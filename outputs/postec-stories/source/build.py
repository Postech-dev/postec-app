"""Generate the editable timeline using Motion Designer's original core."""
from pathlib import Path
ROOT=Path(__file__).resolve().parent
template=ROOT/'timeline-template.html'
html=template.read_text().split('// ================================================================= TIMELINE (named marks drive audio + VO)')[0]
start=html.index('<link rel="preconnect"')
end=html.index('<style>',start)
html=html[:start]+html[end:]
html=html.replace('<title>timeline</title>','<title>PosTec — Stories 9:16</title>')
html=html.replace('<style>','''<style>
@font-face{font-family:Manrope;src:url('../assets/manrope.woff2');font-weight:200 800;font-display:block}
@font-face{font-family:'DM Sans';src:url('../assets/dm-sans.woff2');font-weight:100 1000;font-display:block}
''',1)
html=html.replace("--bg:#F7F7F5;--ink:#141414", "--bg:#0c0d0e;--ink:#f8f8f6")
html=html.replace("--accent:#2D5BFF", "--accent:#ff6a16")
html=html.replace("--display:'Inter',sans-serif;--mono:'JetBrains Mono',monospace", "--display:'DM Sans',sans-serif;--mono:'DM Sans',sans-serif")
html=html.replace("Q.get('ar')||'16x9'", "Q.get('ar')||'9x16'")
html+= (ROOT/'scenes.js').read_text()+'\n</script></body></html>\n'
(ROOT/'timeline.html').write_text(html)
print('Built timeline.html')
