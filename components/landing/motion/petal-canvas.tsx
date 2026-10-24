'use client';

import { useEffect, useRef } from 'react';

export function PetalCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    let width = 0, height = 0, lastScroll = window.scrollY;
    const particles: { x:number;y:number;size:number;speed:number;sway:number;phase:number;gold:boolean }[] = [];
    const setup = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth; height = window.innerHeight;
      canvas.width = width * dpr; canvas.height = height * dpr;
      canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
      context.setTransform(dpr,0,0,dpr,0,0);
      const small = width < 640;
      const count = small ? 15 : 40, dust = small ? 20 : 60;
      particles.length = 0;
      for(let i=0;i<count+dust;i++) particles.push({x:Math.random()*width,y:Math.random()*height,size:i<count?3+Math.random()*5:1+Math.random()*1.5,speed:.3+Math.random()*.7,sway:8+Math.random()*20,phase:Math.random()*Math.PI*2,gold:i>=count});
    };
    let scrollBoost=0;
    const scroll=()=>{const now=window.scrollY;scrollBoost=Math.min(3,Math.abs(now-lastScroll)*.03);lastScroll=now;};
    const draw=()=>{
      if(document.hidden){frame=requestAnimationFrame(draw);return;}
      context.clearRect(0,0,width,height);
      const t=performance.now()*.001;
      for(const p of particles){
        p.y += p.gold ? -.12*p.speed : p.speed+scrollBoost;
        p.x += Math.sin(t+p.phase)*.18;
        if(p.y > height+20) {p.y=-20;p.x=Math.random()*width;}
        if(p.y < -25) {p.y=height+20;p.x=Math.random()*width;}
        context.save();context.translate(p.x+Math.sin(t+p.phase)*p.sway,p.y);context.globalAlpha=p.gold?.3:.15;
        if(p.gold){context.fillStyle='#C9A24B';context.beginPath();context.arc(0,0,p.size,0,Math.PI*2);context.fill();}
        else {context.rotate(Math.sin(t+p.phase)*.6);context.scale(Math.cos(t*1.2+p.phase)*.25+.75,1);context.fillStyle='#A9575A';context.beginPath();context.moveTo(0,-p.size*1.8);context.bezierCurveTo(p.size*1.5,-p.size,p.size*1.8,p.size,0,p.size*2);context.bezierCurveTo(-p.size*1.8,p.size,-p.size*1.5,-p.size,0,-p.size*1.8);context.fill();}
        context.restore();
      }
      scrollBoost*=.96;frame=requestAnimationFrame(draw);
    };
    setup();draw();window.addEventListener('resize',setup);window.addEventListener('scroll',scroll,{passive:true});
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('resize',setup);window.removeEventListener('scroll',scroll);};
  },[]);
  return <canvas ref={ref} className="iv-petal-canvas" aria-hidden="true" />;
}
