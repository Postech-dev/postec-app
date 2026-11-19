"""Low-disk deterministic HTML -> H.264/AAC export, with no intermediate frames.

python render_stream.py timeline.html sound.wav output.mp4 --ar 9x16 --fps 60
Uses the same window.ready/DUR/seek contract as render.py. Run layout checks first.
"""
import argparse
import asyncio
import math
import os
from pathlib import Path
from urllib.parse import urlencode
from playwright.async_api import async_playwright

async def render(args):
    sizes = {'9x16':(1080,1920),'16x9':(1920,1080),'1x1':(1080,1080),'4x5':(1080,1350)}
    w,h = sizes[args.ar] if args.ar in sizes else tuple(map(int,args.ar.split('x')))
    output = Path(args.output).resolve()
    output.parent.mkdir(parents=True,exist_ok=True)
    # Never replace a reviewed export unless explicitly requested.
    if output.exists() and not args.overwrite:
        raise FileExistsError(f'{output} exists; choose another path or --overwrite')
    temp = output.with_name(output.stem+'.partial.mp4')
    errors=[]
    proc=None
    async with async_playwright() as p:
        browser=await p.chromium.launch(args=['--force-color-profile=srgb','--font-render-hinting=none','--allow-file-access-from-files'])
        try:
            page=await browser.new_page(viewport={'width':w,'height':h},device_scale_factor=args.scale)
            page.on('pageerror',lambda error: errors.append(str(error)))
            await page.goto(Path(args.html).resolve().as_uri()+'?'+urlencode({'ar':args.ar}))
            await page.wait_for_function('window.ready===true',timeout=60000)
            await page.evaluate('document.fonts.ready')
            duration=float(await page.evaluate('window.DUR'))
            duration=min(duration,args.duration) if args.duration else duration
            if not math.isfinite(duration) or duration<=0:
                raise ValueError('DUR must be positive and finite')
            frames=round(duration*args.fps)
            command=['ffmpeg','-y','-loglevel','error','-f','image2pipe','-vcodec','mjpeg','-framerate',str(args.fps),'-i','pipe:0','-i',str(Path(args.audio).resolve()),'-map','0:v:0','-map','1:a:0','-t',str(frames/args.fps),'-vf','scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-c:v','libx264','-preset','fast','-crf',str(args.crf),'-pix_fmt','yuv420p','-profile:v','high','-af','loudnorm=I=-14.5:TP=-1.0:LRA=11','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',str(temp)]
            proc=await asyncio.create_subprocess_exec(*command,stdin=asyncio.subprocess.PIPE)
            for i in range(frames):
                await page.evaluate('(t)=>window.seek(t)',i/args.fps)
                if errors: raise RuntimeError('; '.join(errors))
                frame=await page.screenshot(type='jpeg',quality=96)
                proc.stdin.write(frame)
                await proc.stdin.drain()
                if i % (args.fps*2)==0: print(f'{i/args.fps:.0f}/{duration:g} seconds rendered',flush=True)
            proc.stdin.close()
            code=await proc.wait()
            if code: raise RuntimeError(f'ffmpeg exited {code}')
            if temp.stat().st_size==0: raise RuntimeError('Empty export')
            os.replace(temp,output)
            print(f'Render complete: {output} ({output.stat().st_size/1048576:.1f} MiB)',flush=True)
        finally:
            if proc and proc.returncode is None:
                proc.kill()
                await proc.wait()
            await browser.close()

if __name__=='__main__':
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('html'); ap.add_argument('audio'); ap.add_argument('output')
    ap.add_argument('--ar',default='9x16'); ap.add_argument('--fps',type=int,choices=[24,25,30,60],default=60)
    ap.add_argument('--scale',type=float,default=1); ap.add_argument('--crf',type=int,default=18)
    ap.add_argument('--duration',type=float,help='Limit duration for a smoke test')
    ap.add_argument('--overwrite',action='store_true')
    asyncio.run(render(ap.parse_args()))
