import { useRef, useEffect, useCallback, useState } from 'react';

export const AVATAR_R     = 20;
export const PROX_FULL    = 80;
export const PROX_CUTOFF  = 200;
export const REQUEST_DIST = 160;
const MOVE_SPEED = 3;
const WORLD_W    = 2800;
const WORLD_H    = 2000;

// ── ALL ROOMS PUBLIC ──────────────────────────────────────────────────────────
export const ROOMS = [
  { id:'reception',  label:'🏢 Reception',        x:60,   y:60,   w:380, h:260, color:'rgba(245,200,66,0.07)',  border:'rgba(245,200,66,0.3)',   private:false },
  { id:'ceo',        label:'👔 CEO Office',        x:500,  y:60,   w:300, h:260, color:'rgba(124,109,250,0.08)', border:'rgba(124,109,250,0.35)', private:false },
  { id:'boardroom',  label:'📊 Board Room',        x:860,  y:60,   w:440, h:260, color:'rgba(248,113,113,0.07)', border:'rgba(248,113,113,0.28)', private:false },
  { id:'hr',         label:'👥 HR',                x:1360, y:60,   w:280, h:260, color:'rgba(251,146,60,0.07)',  border:'rgba(251,146,60,0.28)',  private:false },
  { id:'finance',    label:'💰 Finance',           x:1700, y:60,   w:280, h:260, color:'rgba(52,211,153,0.07)',  border:'rgba(52,211,153,0.25)',  private:false },
  { id:'devroom',    label:'💻 Engineering',       x:60,   y:400,  w:580, h:400, color:'rgba(96,165,250,0.07)',  border:'rgba(96,165,250,0.25)',  private:false },
  { id:'design',     label:'🎨 Design Studio',     x:700,  y:400,  w:480, h:400, color:'rgba(236,72,153,0.07)',  border:'rgba(236,72,153,0.25)',  private:false },
  { id:'product',    label:'📦 Product Room',      x:1240, y:400,  w:380, h:400, color:'rgba(45,212,191,0.07)',  border:'rgba(45,212,191,0.25)',  private:false },
  { id:'meeting1',   label:'📋 Meeting Room 1',    x:1680, y:400,  w:300, h:180, color:'rgba(245,200,66,0.06)',  border:'rgba(245,200,66,0.2)',   private:false },
  { id:'meeting2',   label:'📋 Meeting Room 2',    x:1680, y:620,  w:300, h:180, color:'rgba(245,200,66,0.06)',  border:'rgba(245,200,66,0.2)',   private:false },
  { id:'open',       label:'🌐 Open Workspace',    x:60,   y:880,  w:1060,h:280, color:'rgba(96,165,250,0.04)',  border:'rgba(96,165,250,0.12)',  private:false },
  { id:'kitchen',    label:'☕ Kitchen & Break',   x:1180, y:880,  w:380, h:280, color:'rgba(245,200,66,0.07)',  border:'rgba(245,200,66,0.25)',  private:false },
  { id:'lounge',     label:'🛋️ Lounge',            x:1620, y:880,  w:360, h:280, color:'rgba(236,72,153,0.06)',  border:'rgba(236,72,153,0.2)',   private:false },
];

const FURNITURE = [
  { type:'bigdesk',    x:130, y:110,  w:200, h:80,  c:'#1c1a10' },
  { type:'couch',      x:130, y:230,  w:160, h:50,  c:'#1a1a2e' },
  { type:'plant',      x:390, y:90,   r:16,          c:'#0a2010' },
  { type:'bigdesk',    x:540, y:110,  w:220, h:90,  c:'#1a1028' },
  { type:'plant',      x:755, y:90,   r:18,          c:'#0a2010' },
  { type:'longtable',  x:900, y:120,  w:360, h:160, c:'#1f1010' },
  { type:'desk',       x:1380,y:110,  w:130, h:50,  c:'#1a1020' },
  { type:'desk',       x:1380,y:180,  w:130, h:50,  c:'#1a1020' },
  { type:'desk',       x:1720,y:110,  w:130, h:50,  c:'#0a1a10' },
  { type:'desk',       x:1720,y:180,  w:130, h:50,  c:'#0a1a10' },
  ...Array.from({length:12},(_,i)=>({ type:'desk', x:80+(i%4)*130, y:450+Math.floor(i/4)*100, w:110, h:48, c:'#0a1020' })),
  ...Array.from({length:9}, (_,i)=>({ type:'desk', x:720+(i%3)*130,y:450+Math.floor(i/3)*100, w:110, h:48, c:'#150a1a' })),
  { type:'roundtable', x:1400,y:600,  r:60,          c:'#0f1a10' },
  { type:'roundtable', x:1820,y:480,  r:55,          c:'#1a1800' },
  { type:'roundtable', x:1820,y:700,  r:55,          c:'#1a1800' },
  ...Array.from({length:8}, (_,i)=>({ type:'desk', x:80+(i%4)*130, y:930+Math.floor(i/2)*90, w:110, h:48, c:'#0a0f1a' })),
  { type:'counter',    x:1200,y:920,  w:260, h:55,  c:'#1a1000' },
  { type:'table',      x:1400,y:1040, r:50,          c:'#1a1000' },
  { type:'plant',      x:1540,y:895,  r:16,          c:'#0a2010' },
  { type:'couch',      x:1640,y:920,  w:180, h:55,  c:'#150a20' },
  { type:'couch',      x:1640,y:1050, w:180, h:55,  c:'#150a20' },
  { type:'table',      x:1760,y:1010, r:45,          c:'#100a1a' },
  { type:'plant',      x:60,  y:400,  r:16,          c:'#0a2010' },
  { type:'plant',      x:1100,y:860,  r:16,          c:'#0a2010' },
];

function drawFurniture(ctx) {
  FURNITURE.forEach(d => {
    ctx.save(); ctx.fillStyle = d.c; const r = 6;
    if (['desk','bigdesk','counter'].includes(d.type)) {
      ctx.beginPath(); ctx.roundRect(d.x,d.y,d.w,d.h,r); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.04)';
      ctx.beginPath(); ctx.roundRect(d.x+3,d.y+3,d.w-6,d.h/3,r); ctx.fill();
      if (['desk','bigdesk'].includes(d.type)) {
        ctx.fillStyle='rgba(0,180,255,0.22)'; ctx.fillRect(d.x+d.w*0.25,d.y+8,d.w*0.5,12);
      }
    } else if (d.type==='longtable') {
      ctx.beginPath(); ctx.roundRect(d.x,d.y,d.w,d.h,12); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.05)'; ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,0.06)';
      for(let c=0;c<5;c++){const cx=d.x+30+c*(d.w-60)/4;ctx.beginPath();ctx.arc(cx,d.y-18,12,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(cx,d.y+d.h+18,12,0,Math.PI*2);ctx.fill();}
    } else if (d.type==='couch') {
      ctx.beginPath(); ctx.roundRect(d.x,d.y,d.w,d.h,r); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.055)';
      ctx.beginPath(); ctx.roundRect(d.x+6,d.y+5,d.w/2-10,d.h-10,4); ctx.fill();
      ctx.beginPath(); ctx.roundRect(d.x+d.w/2+4,d.y+5,d.w/2-10,d.h-10,4); ctx.fill();
    } else if (['roundtable','table'].includes(d.type)) {
      ctx.beginPath(); ctx.arc(d.x,d.y,d.r,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.045)'; ctx.lineWidth=2; ctx.stroke();
    } else if (d.type==='plant') {
      ctx.beginPath(); ctx.arc(d.x,d.y+d.r*.4,d.r*.65,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#2a4f2a'; ctx.beginPath(); ctx.arc(d.x,d.y-d.r*.3,d.r,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(d.x-d.r*.6,d.y+d.r*.05,d.r*.7,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(d.x+d.r*.6,d.y+d.r*.05,d.r*.7,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#3a6a3a'; ctx.beginPath(); ctx.arc(d.x,d.y-d.r*.5,d.r*.55,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  });
}

function drawWorld(ctx) {
  ctx.fillStyle='#060912'; ctx.fillRect(0,0,WORLD_W,WORLD_H);
  ctx.strokeStyle='rgba(124,109,250,0.025)'; ctx.lineWidth=1;
  for(let x=0;x<WORLD_W;x+=80){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,WORLD_H);ctx.stroke();}
  for(let y=0;y<WORLD_H;y+=80){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(WORLD_W,y);ctx.stroke();}
  ctx.fillStyle='rgba(255,255,255,0.01)';
  ctx.fillRect(0,350,WORLD_W,40); ctx.fillRect(0,840,WORLD_W,40);
  ROOMS.forEach(z=>{
    ctx.save();
    ctx.fillStyle=z.color; ctx.beginPath(); ctx.roundRect(z.x,z.y,z.w,z.h,14); ctx.fill();
    ctx.strokeStyle=z.border; ctx.lineWidth=1.5; ctx.stroke();
    ctx.fillStyle=z.border; ctx.font='600 11px Satoshi,sans-serif';
    ctx.fillText(z.label,z.x+12,z.y+20);
    // "PUBLIC" badge on all rooms
    ctx.fillStyle='rgba(52,211,153,0.55)';
    ctx.font='8px monospace';
    ctx.fillText('● OPEN',z.x+12,z.y+34);
    ctx.restore();
  });
  drawFurniture(ctx);
  ctx.strokeStyle='rgba(124,109,250,0.08)'; ctx.lineWidth=4; ctx.strokeRect(4,4,WORLD_W-8,WORLD_H-8);
}

// ── Role colour mapping ────────────────────────────────────────────────────────
function getRoleColor(role, avatarColor) {
  if (role === 'founder')  return '#f5c842';
  if (role === 'employee') return avatarColor || '#60a5fa';
  return avatarColor || '#7c6dfa';
}

function getRoleIcon(role) {
  if (role === 'founder')  return '👑';
  if (role === 'employee') return '👷';
  return null;
}

function drawAvatar(ctx, x, y, user, isMe, vol, reactionEmoji, t, inCall) {
  const { avatar='🎓', avatarColor='#7c6dfa', name='', role='', isMuted, isVideoOff } = user;
  const ringColor = getRoleColor(role, avatarColor);
  const roleIcon  = getRoleIcon(role);

  ctx.save(); ctx.translate(x, y);

  // Active-call glow
  if (inCall) {
    ctx.save(); ctx.globalAlpha=0.28+0.12*Math.sin(t*0.05);
    const g=ctx.createRadialGradient(0,0,AVATAR_R,0,0,AVATAR_R*3.5);
    g.addColorStop(0,ringColor); g.addColorStop(1,'transparent');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,AVATAR_R*3.5,0,Math.PI*2); ctx.fill(); ctx.restore();
  }

  // Proximity ring (other users)
  if (!isMe && vol>0.05) {
    ctx.save(); ctx.globalAlpha=vol*0.45; ctx.strokeStyle=ringColor; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.arc(0,0,AVATAR_R+7+Math.sin(t*0.12)*2,0,Math.PI*2); ctx.stroke(); ctx.restore();
  }

  // My ring glow
  if (isMe) {
    ctx.save(); ctx.shadowColor=ringColor; ctx.shadowBlur=14;
    ctx.strokeStyle=ringColor; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.arc(0,0,AVATAR_R+3,0,Math.PI*2); ctx.stroke(); ctx.restore();
  }

  // Circle
  ctx.beginPath(); ctx.arc(0,0,AVATAR_R,0,Math.PI*2);
  ctx.fillStyle = isMe ? '#0e0c1e' : '#0a0e1c'; ctx.fill();
  ctx.strokeStyle=ringColor; ctx.lineWidth=isMe?2.5:1.5; ctx.stroke();

  // Avatar emoji
  ctx.font=`${AVATAR_R*1.05}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(avatar,0,2);

  // Role badge (crown for founder, hard hat for employee)
  if (roleIcon) {
    ctx.font='9px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(roleIcon, AVATAR_R-3, -AVATAR_R+3);
  }

  // Name tag
  ctx.font='500 10px Satoshi,sans-serif';
  const label = isMe ? `${name} (you)` : name;
  const tw = ctx.measureText(label).width;
  ctx.fillStyle='rgba(6,9,18,0.85)';
  ctx.beginPath(); ctx.roundRect(-tw/2-5,AVATAR_R+2,tw+10,16,3); ctx.fill();
  ctx.fillStyle=isMe?'#f5c842':'#e2e8f4'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(label,0,AVATAR_R+10);

  // Mute badge
  if (isMuted||isVideoOff) {
    ctx.fillStyle='#f87171'; ctx.beginPath(); ctx.arc(-AVATAR_R+3,-AVATAR_R+3,7,0,Math.PI*2); ctx.fill();
    ctx.font='7px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(isMuted?'🔇':'📵',-AVATAR_R+3,-AVATAR_R+3);
  }

  if (reactionEmoji) {
    ctx.font='18px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.globalAlpha=0.9; ctx.fillText(reactionEmoji,0,-AVATAR_R-18); ctx.globalAlpha=1;
  }
  ctx.restore();
}

// ── Main component ────────────────────────────────────────────────────────────
export default function OfficeCanvas({ myUser, users, proximity, reactions, activeCalls, onMove, onUpdateProximity, onRequestTalk }) {
  const canvasRef = useRef(null);
  const offRef    = useRef(null);
  const camRef    = useRef({ x:0, y:0 });
  const keysRef   = useRef({});
  const dragRef   = useRef(null);
  const tRef      = useRef(0);
  const posRef    = useRef({ x: myUser?.x||800, y: myUser?.y||600 });
  const pendRef   = useRef(new Set());
  const [size, setSize] = useState({ w:window.innerWidth, h:window.innerHeight });

  const activeReactions = {};
  reactions.forEach(r => { activeReactions[r.socketId] = r.emoji; });

  useEffect(() => {
    const onR = () => setSize({ w:window.innerWidth, h:window.innerHeight });
    window.addEventListener('resize', onR); return () => window.removeEventListener('resize', onR);
  }, []);

  useEffect(() => {
    const off = document.createElement('canvas'); off.width=WORLD_W; off.height=WORLD_H;
    drawWorld(off.getContext('2d')); offRef.current = off;
  }, []);

  useEffect(() => {
    const dn=e=>{keysRef.current[e.key]=true;};
    const up=e=>{keysRef.current[e.key]=false;};
    window.addEventListener('keydown',dn); window.addEventListener('keyup',up);
    return()=>{window.removeEventListener('keydown',dn);window.removeEventListener('keyup',up);};
  },[]);

  const onMouseDown = useCallback(e=>{
    if(e.button!==0) return;
    const rect=canvasRef.current.getBoundingClientRect(), cam=camRef.current;
    const wx=e.clientX-rect.left+cam.x, wy=e.clientY-rect.top+cam.y, mp=posRef.current;
    if(Math.hypot(wx-mp.x,wy-mp.y)<AVATAR_R+6) dragRef.current={ox:wx-mp.x,oy:wy-mp.y};
    else { dragRef.current=null; posRef.current={x:Math.max(AVATAR_R,Math.min(WORLD_W-AVATAR_R,wx)),y:Math.max(AVATAR_R,Math.min(WORLD_H-AVATAR_R,wy))}; onMove(posRef.current.x,posRef.current.y); }
  },[onMove]);

  const onMouseMove = useCallback(e=>{
    if(!dragRef.current) return;
    const rect=canvasRef.current.getBoundingClientRect(), cam=camRef.current;
    posRef.current={x:Math.max(AVATAR_R,Math.min(WORLD_W-AVATAR_R,e.clientX-rect.left+cam.x-dragRef.current.ox)),y:Math.max(AVATAR_R,Math.min(WORLD_H-AVATAR_R,e.clientY-rect.top+cam.y-dragRef.current.oy))};
    onMove(posRef.current.x,posRef.current.y);
  },[onMove]);

  const onMouseUp = useCallback(()=>{ dragRef.current=null; },[]);

  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext('2d'); let raf;
    function loop(){
      tRef.current++;
      const t=tRef.current, W=canvas.width, H=canvas.height, cam=camRef.current, pos=posRef.current, keys=keysRef.current;
      let moved=false;
      if(keys['w']||keys['W']||keys['ArrowUp'])    {pos.y=Math.max(AVATAR_R,pos.y-MOVE_SPEED);moved=true;}
      if(keys['s']||keys['S']||keys['ArrowDown'])  {pos.y=Math.min(WORLD_H-AVATAR_R,pos.y+MOVE_SPEED);moved=true;}
      if(keys['a']||keys['A']||keys['ArrowLeft'])  {pos.x=Math.max(AVATAR_R,pos.x-MOVE_SPEED);moved=true;}
      if(keys['d']||keys['D']||keys['ArrowRight']) {pos.x=Math.min(WORLD_W-AVATAR_R,pos.x+MOVE_SPEED);moved=true;}
      if(moved) onMove(pos.x,pos.y);
      if(t%8===0){
        onUpdateProximity(pos.x,pos.y);
        Object.values(users).forEach(u=>{
          const dist=Math.hypot((u.x||0)-pos.x,(u.y||0)-pos.y);
          const inCall=activeCalls instanceof Set?activeCalls.has(u.socketId):false;
          if(dist<REQUEST_DIST&&!pendRef.current.has(u.socketId)&&!inCall){
            pendRef.current.add(u.socketId); onRequestTalk(u.socketId);
            setTimeout(()=>pendRef.current.delete(u.socketId),30000);
          }
        });
      }
      const tx=Math.max(0,Math.min(WORLD_W-W,pos.x-W/2)), ty=Math.max(0,Math.min(WORLD_H-H,pos.y-H/2));
      cam.x+=(tx-cam.x)*0.1; cam.y+=(ty-cam.y)*0.1;
      ctx.clearRect(0,0,W,H); ctx.save(); ctx.translate(-cam.x,-cam.y);
      if(offRef.current) ctx.drawImage(offRef.current,0,0);
      // Proximity rings
      ctx.save(); ctx.globalAlpha=0.07; ctx.strokeStyle='#f5c842'; ctx.lineWidth=1;
      ctx.setLineDash([4,4]); ctx.beginPath(); ctx.arc(pos.x,pos.y,PROX_CUTOFF,0,Math.PI*2); ctx.stroke();
      ctx.globalAlpha=0.14; ctx.beginPath(); ctx.arc(pos.x,pos.y,REQUEST_DIST,0,Math.PI*2); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
      // Other users
      Object.values(users).forEach(u=>{
        if(!u.x&&!u.y) return;
        const prox=proximity[u.socketId];
        const inCall=activeCalls instanceof Set?activeCalls.has(u.socketId):false;
        drawAvatar(ctx,u.x,u.y,u,false,prox?.vol||0,activeReactions[u.socketId],t,inCall);
      });
      // My avatar
      if(myUser) drawAvatar(ctx,pos.x,pos.y,{...myUser},true,1,activeReactions[myUser?.socketId],t,false);
      ctx.restore();
      raf=requestAnimationFrame(loop);
    }
    raf=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(raf);
  // eslint-disable-next-line
  },[users,proximity,myUser,reactions,activeCalls,onMove,onUpdateProximity,onRequestTalk]);

  return (
    <canvas ref={canvasRef} width={size.w} height={size.h}
      style={{ display:'block', cursor:'default', touchAction:'none', userSelect:'none' }}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}/>
  );
}

export { WORLD_W, WORLD_H };
