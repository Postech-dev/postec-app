// Native 9:16 PosTec composition. Every frame is a pure function of time.
const MARK={OPEN:0,CENTRAL:5,RESOLVE:10,PORTAL:15,END:20};
const DUR=25;
window.MARK=MARK; window.DUR=DUR;

function logo(parent,x,y,w){
  return div(parent,'el',`left:${x}px;top:${y}px;width:${w}px;height:${w*150/468}px;background:#0c0d0e`,
    '<svg style="mix-blend-mode:screen" viewBox="388 280 468 150" width="100%" height="100%"><image href="../assets/brand.jpeg" width="1280" height="714"/></svg>');
}
function label(parent,text,y=1398){
  return div(parent,'el',`left:150px;top:${y}px;width:780px;text-align:center;font-size:34px;letter-spacing:0;color:#b6b6b9`,text);
}
function title(parent,lines,fs=104,y=405){
  const h=HL(parent,lines,`left:150px;top:${y}px;width:780px;font-size:${fs}px;text-align:left;font-family:Manrope;font-weight:650;line-height:1.08;letter-spacing:-5px`);
  h.dataset.block='1';return h;
}
function picture(parent,src,x,y,w,h){
  const wrap=div(parent,'el picture',`left:${x}px;top:${y}px;width:${w}px;height:${h}px;overflow:hidden;border-radius:24px;box-shadow:0 26px 50px #0004`);
  wrap.dataset.role='focal';wrap.dataset.name=src;
  wrap.innerHTML=`<img src="../assets/${src}" style="display:block;width:100%;height:100%;object-fit:contain"/>`;
  return wrap;
}
function sceneBase(kicker){
  const s=scene('#0c0d0e');
  logo(s.c,150,274,245);
  const line=div(s.c,'el','left:150px;top:370px;width:780px;height:2px;background:#ffffff25');line.dataset.bleed='';
  if(kicker)div(s.c,'el','left:460px;top:300px;width:470px;text-align:right;font-size:26px;letter-spacing:2px;color:#ff8a43',kicker);
  return s;
}

const S1=sceneBase('PÓS-VENDA EM ORDEM');
const hook=title(S1.c,['Pós-venda','espalhado?'],112,440);
hook.querySelectorAll('.ln')[1].style.color='#ff6a16';
const tickets=['Trocas','Pedidos','Mensagens'].map((text,i)=>{
  const box=div(S1.c,'el ticket',`width:690px;height:132px;border:1px solid #ffffff32;border-radius:18px;background:#191a1c;display:flex;align-items:center;padding:0 34px;gap:28px;box-sizing:border-box`,
    `<span style="width:56px;height:56px;border:2px solid #ff6a16;border-radius:50%;display:grid;place-items:center;font-size:42px;color:#ff6a16;font-weight:400">${['↻','↗','···'][i]}</span><span style="font-size:45px;font-weight:550;letter-spacing:-1px">${text}</span>`);
  box.dataset.block='1';return box;
});

const S2=sceneBase('CENTRALIZE');
const h2=title(S2.c,['Cada caso.','No seu lugar.'],101,402);
h2.querySelectorAll('.ln')[1].style.color='#ff6a16';
const kanban=picture(S2.c,'kanban-focus.png',260,651,560,733.09);
const demo2=label(S2.c,'Tela real · dados de demonstração',1410);

const S3=sceneBase('RESOLVA');
const h3=title(S3.c,['Da troca','à solução.'],112,436);
h3.querySelectorAll('.ln')[1].style.color='#ff6a16';
const actions=picture(S3.c,'acoes.png',170,790,740,487.94);
const select=div(S3.c,'el','left:217px;top:1024px;width:646px;height:89px;box-sizing:border-box;border:4px solid #ff6a16;border-radius:21px;pointer-events:none');
select.dataset.bleed='';
const demo3=label(S3.c,'Reenvios e estornos no mesmo fluxo.',1353);
const cursor=div(S3.c,'el','width:50px;height:64px;filter:drop-shadow(0 3px 2px #0005)',
 '<svg width="50" height="64" viewBox="0 0 50 64"><path d="M6 4L42 34L25 37L18 55L6 4Z" fill="#0c0d0e" stroke="white" stroke-width="3"/></svg>');
cursor.dataset.bleed='';

const S4=sceneBase('ACOMPANHE');
const h4=title(S4.c,['Seu cliente','acompanha.'],106,405);
h4.querySelectorAll('.ln')[1].style.color='#ff6a16';
const portal=picture(S4.c,'portal-acompanhar.png',180,697,720,689.83);
const demo4=label(S4.c,'Portal do cliente · demonstração',1410);

const S5=scene('#0c0d0e');
const finalRule=div(S5.c,'el','left:150px;top:430px;width:780px;height:8px;background:#ff6a16');finalRule.dataset.bleed='';
const finalLogo=logo(S5.c,205,566,670);
const finalTitle=title(S5.c,['Seu pós-venda,','sob controle.'],96,876);
finalTitle.style.textAlign='center';
const cta=div(S5.c,'el','left:215px;top:1180px;width:650px;height:106px;border-radius:12px;background:#ff6a16;color:#100d0b;display:flex;align-items:center;justify-content:center;gap:30px;font-size:40px;font-weight:700;letter-spacing:-1px','Conheça a PosTec <span style="font-size:48px">↗</span>');cta.dataset.block='1';
const url=label(S5.c,'postec-app.vercel.app',1340);url.style.fontSize='35px';url.style.letterSpacing='0';

function enter(el,t,start,dy=30){
  const p=E.o5(seg(t,start,start+.55));
  el.style.opacity=p;el.style.transform=`translateY(${(1-p)*dy}px) scale(${.97+.03*p})`;
}
function camera(sc,t,a,b){
  const u=seg(t,a,b),q=E.io3(u);
  // The enclosing camera owns scene exits; entries remain independent.
  const out=E.i3(seg(t,b-.24,b));
  sc.c.style.transformOrigin='540px 960px';
  sc.c.style.transform=`scale(${.992+.008*q}) translateY(${-out*18}px)`;
  sc.c.style.opacity=1-out;
}
function seek(t){
  t=clamp(t,0,DUR-.001);
  [S1,S2,S3,S4,S5].forEach((s,i)=>show(s,t>=i*5&&t<(i+1)*5));
  if(t<5){
    // The hook is complete from frame zero, with only supporting cards entering.
    hlA(hook,t,-1.0);
    tickets.forEach((e,i)=>{
      const p=E.o5(seg(t,.12+i*.18,.75+i*.18));
      const collapse=E.i3(seg(t,4.48,4.98));
      T(e,{x:540+(1-p)*(i%2?100:-100),y:860+i*178+(1-p)*26-collapse*(i-1)*150,r:([ -2.4,1.8,-1.5][i])*(1-collapse),s:1-collapse*.05,o:p*(1-collapse)});
    });
    camera(S1,t,0,5);
  } else if(t<10){
    camera(S2,t,5,10);hlA(h2,t,4.98);enter(kanban,t,5.85,42);enter(demo2,t,6.1,0);
  } else if(t<15){
    camera(S3,t,10,15);hlA(h3,t,9.98);enter(actions,t,10.15,36);enter(demo3,t,10.5,0);
    const p=E.io3(seg(t,11.4,12.15));
    const press=1-.09*Math.sin(Math.PI*seg(t,12.15,12.4));
    T(cursor,{x:lerp(830,730,p),y:lerp(1320,1090,p),s:press,o:seg(t,11.4,11.7)*(1-seg(t,13,13.3)),ax:0,ay:0});
    select.style.opacity=seg(t,12.15,12.35);select.style.transform=`scale(${1+.025*(1-E.o3(seg(t,12.15,12.5)))})`;
  } else if(t<20){
    camera(S4,t,15,20);hlA(h4,t,14.98);enter(portal,t,15.12,36);enter(demo4,t,15.5,0);
  } else {
    S5.c.style.opacity=1;S5.c.style.transform='none';
    finalRule.style.transformOrigin='left';finalRule.style.transform=`scaleX(${E.o5(seg(t,20,20.75))})`;
    enter(finalLogo,t,20.03,20);hlA(finalTitle,t,20.20);enter(cta,t,20.65,26);enter(url,t,20.85,12);
  }
}
window.seek=seek;
Promise.all([document.fonts.ready,
  ...['500','550','600','650','700'].map(w=>document.fonts.load(`${w} 48px Manrope`)),
  ...['400','500','600','700'].map(w=>document.fonts.load(`${w} 48px 'DM Sans'`)),
  ...[...document.images].map(i=>i.decode())
]).then(()=>{
  seek(+Q.get('t')||0);window.ready=true;
  if(Q.get('play')){const t0=performance.now();const loop=()=>{seek(((performance.now()-t0)/1000)%DUR);requestAnimationFrame(loop);};loop();}
});
