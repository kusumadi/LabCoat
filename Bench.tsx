import {useEffect,useRef,useState} from 'react';
import * as T from 'three';

type Props={reading:number;volume:number;pink:number;plume:boolean;camera:string;motion:string;act:(name:string)=>void;filled:boolean};
export function Bench(props:Props) {
  const mount=useRef<HTMLDivElement>(null);
  const state=useRef(props);
  state.current=props;
  const [fallback,setFallback]=useState(false);
  useEffect(()=>{
    const host=mount.current!;
    let renderer:T.WebGLRenderer;
    try {renderer=new T.WebGLRenderer({antialias:true,alpha:true});}
    catch {setFallback(true);return;}
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    renderer.shadowMap.enabled=true;
    host.prepend(renderer.domElement);
    const scene=new T.Scene();
    scene.fog=new T.Fog('#d9e7df',15,35);
    scene.add(new T.HemisphereLight('#fff9ec','#759787',2.6));
    const light=new T.DirectionalLight('#fff7df',2.8);
    light.position.set(-3,10,7);
    light.castShadow=true;
    light.shadow.mapSize.set(1024,1024);
    scene.add(light);
    const camera=new T.PerspectiveCamera(34,1,.01,45);
    const metal=new T.MeshStandardMaterial({color:'#3f5550',metalness:.55,roughness:.28});
    const glass=new T.MeshPhysicalMaterial({color:'#cefff1',transparent:true,opacity:.21,roughness:.16,side:T.DoubleSide,depthWrite:false});
    const teal=new T.MeshStandardMaterial({color:'#167c69',roughness:.36});
    const liquid=new T.MeshStandardMaterial({color:'#9ddfd9',transparent:true,opacity:.75});
    const solution=new T.MeshStandardMaterial({color:'#b8e2dd',transparent:true,opacity:.88});
    const plumeMaterial=new T.MeshStandardMaterial({color:'#ed499c',transparent:true,opacity:.56,depthWrite:false});
    function mesh(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number,parent:T.Object3D=scene) {
      const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=!m.transparent;o.receiveShadow=true;parent.add(o);return o;
    }
    const cyl=(r:number,h:number)=>new T.CylinderGeometry(r,r,h,36);
    const box=(w:number,h:number,d:number)=>new T.BoxGeometry(w,h,d);
    function label(text:string,w:number,h:number,x:number,y:number,z:number,background='#e9f3e8'){
      const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
      const ctx=canvas.getContext('2d')!;ctx.fillStyle=background;ctx.fillRect(0,0,512,128);
      ctx.font='bold 53px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#163833';ctx.fillText(text,256,64);
      const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
      return mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture,transparent:true}),x,y,z);
    }
    mesh(box(15,.25,8),new T.MeshStandardMaterial({color:'#71988b'}),0,-.15,0);
    mesh(box(1.95,.12,1.65),metal,-.9,.08,-.6);
    mesh(cyl(.05,5.7),metal,-.95,2.93,-.6);
    mesh(box(1.13,.12,.14),metal,-.47,4.58,-.43);
    mesh(new T.TorusGeometry(.12,.035,12,32),metal,0,4.58,0).rotation.x=Math.PI/2;
    mesh(cyl(.095,4.6),glass,0,3.85,0);
    const column=mesh(cyl(.071,1),liquid,0,3.8,0);
    const ink=new T.MeshBasicMaterial({color:'#163833'});
    for(let i=0;i<=500;i++){
      const major=i%50===0, intermediate=i%10===0;
      mesh(box(major?.12:intermediate?.076:.038,.003,.003),ink,.072,6-i*.0085,.102);
      if(major) label(String(i/10),.16,.08,.224,6-i*.0085,.102,'#e9f3e8de');
    }
    mesh(cyl(.041,.32),glass,0,1.4,0);
    mesh(cyl(.068,.2),teal,0,1.58,0).rotation.z=Math.PI/2;
    const handle=mesh(box(.28,.068,.065),teal,.14,1.58,.06);
    const tile=new T.MeshStandardMaterial({color:'#fffcf4',roughness:.29});
    mesh(box(1.55,.055,1.45),tile,0,.03,0);
    const flask=new T.Group();flask.position.y=.06;scene.add(flask);
    const profile=(pts:number[][])=>new T.LatheGeometry(pts.map(([r,y])=>new T.Vector2(r,y)),56);
    mesh(profile([[0,0],[.43,0],[.5,.06],[.49,.15],[.18,.78],[.16,.9],[.16,1.1],[.19,1.11]]),glass,0,0,0,flask);
    const fill=mesh(profile([[0,0],[.42,0],[.47,.06],[.38,.3],[0,.3]]),solution,0,.025,0,flask);
    const plume=mesh(new T.SphereGeometry(.15,24,18),plumeMaterial,0,.2,.03,flask);
    plume.scale.y=.34;
    const drop=mesh(new T.SphereGeometry(.035,16,12),liquid,0,1.22,0);
    const bottles=[{x:-2.25,name:'NaOH',color:'#afded0'},{x:-3.45,name:'HCl',color:'#b3c5c9'},{x:2.38,name:'Indicator',color:'#7d6048'}];
    for(const {x,name,color} of bottles){
      const body=new T.MeshStandardMaterial({color,roughness:.27});
      const narrow=name==='Indicator';
      mesh(cyl(narrow?.27:.39,narrow?.79:1.12),body,x,narrow?.4:.57,-.27);
      mesh(cyl(.19,.18),metal,x,narrow?.85:1.21,-.27);
      label(name,narrow?.48:.66,.21,x,.53,narrow?.009:.13);
    }
    mesh(cyl(.049,2.7),glass,1.77,.095,.75).rotation.z=1.28;
    const bulb=mesh(new T.SphereGeometry(.17,24,18),teal,3.1,.55,.75);
    bulb.scale.set(1.35,.78,.8);
    const tube=mesh(new T.SphereGeometry(.10,20,14),glass,1.69,.08,.75);
    tube.scale.x=3.1;
    const hitboxes=[
      [mesh(box(.42,.35,.35),new T.MeshBasicMaterial({visible:false}),.1,1.57,0),'tap'],
      [mesh(box(1,1.2,1),new T.MeshBasicMaterial({visible:false}),0,.65,0),'flask'],
      [mesh(box(.72,1,.8),new T.MeshBasicMaterial({visible:false}),2.38,.45,-.27),'indicator'],
      [mesh(box(2.8,.22,.4),new T.MeshBasicMaterial({visible:false}),1.75,.21,.75),'pipette'],
      [mesh(box(.35,4.4,.3),new T.MeshBasicMaterial({visible:false}),0,3.88,0),'burette']
    ] as const;
    const ray=new T.Raycaster();
    function hit(event:PointerEvent) {
      const r=renderer.domElement.getBoundingClientRect();
      ray.setFromCamera(new T.Vector2((event.clientX-r.left)/r.width*2-1,1-(event.clientY-r.top)/r.height*2),camera);
      return ray.intersectObjects(hitboxes.map(([o])=>o))[0]?.object;
    }
    const click=(e:PointerEvent)=>{const target=hitboxes.find(([o])=>o===hit(e));if(target)state.current.act(target[1]);};
    const move=(e:PointerEvent)=>{renderer.domElement.style.cursor=hit(e)?'pointer':'default';};
    renderer.domElement.addEventListener('pointerdown',click);
    renderer.domElement.addEventListener('pointermove',move);
    let frame=0, previous='', began=0, level=6;
    const clear=new T.Color('#b8e2dd'), pink=new T.Color('#e02983');
    function draw(now:number) {
      frame=requestAnimationFrame(draw);
      const s=state.current;
      if(s.motion!==previous){previous=s.motion;began=now;}
      const age=now-began;
      level+=(6-s.reading*.085-level)*.13;
      column.visible=s.filled;
      column.scale.y=Math.max(.02,level-1.6);column.position.y=1.6+column.scale.y/2;
      fill.visible=s.volume>0;
      fill.scale.y=.52+s.volume/80;
      solution.color.copy(clear).lerp(pink,Math.min(1,s.pink*.89));
      plume.visible=s.plume;plume.position.x=Math.sin(now/550)*.11;
      const adding=s.motion.startsWith('add')&&age<650;
      drop.visible=adding&&age>45;drop.position.y=1.22-((age%260)/260)*.94;
      handle.rotation.z=adding?Math.sin(Math.PI*age/650)*1.57:0;
      flask.rotation.z=s.motion.startsWith('swirl')&&age<740?Math.sin(age/42)*.11*(1-age/740):0;
      const eye=s.camera==='Eye level',close=s.camera==='Flask';
      const aspect=host.clientWidth/Math.max(host.clientHeight,1);
      if(renderer.domElement.clientWidth!==host.clientWidth||renderer.domElement.clientHeight!==host.clientHeight)renderer.setSize(host.clientWidth,host.clientHeight);
      camera.aspect=aspect;camera.updateProjectionMatrix();
      if(eye){camera.position.set(.15,level,1.25);camera.lookAt(.15,level,0);}
      else if(close){camera.position.set(1.3,2.1,4.2);camera.lookAt(0,.75,0);}
      else{camera.position.set(4.6,6.1,aspect<1.1?15.5:12.3);camera.lookAt(-.1,2.65,0);}
      renderer.render(scene,camera);
    }
    frame=requestAnimationFrame(draw);
    return ()=>{
      cancelAnimationFrame(frame);renderer.domElement.remove();renderer.dispose();
      scene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials){m.map?.dispose();m.dispose();}}});
    };
  },[]);
  return <div className="bench" ref={mount}>
    {fallback&&<div className="fallback">3D rendering is unavailable. Use the bench controls and calibrated eye-level view.</div>}
    {props.camera==='Eye level'&&<Scale reading={props.reading}/>}
  </div>;
}

function Scale({reading}:{reading:number}) {
  const origin=Math.floor(reading)-1;
  const y=(n:number)=>16+(n-origin)*118;
  return <div className="scale"><svg viewBox="0 0 220 386" role="img" aria-label="Calibrated burette scale. Accessible reading in adjacent disclosure.">
    <defs><linearGradient id="glass"><stop stopColor="#c0dbd1"/><stop offset=".5" stopColor="#fff"/><stop offset="1" stopColor="#adc8bf"/></linearGradient></defs>
    <rect x="44" y="0" width="60" height="386" fill="url(#glass)" stroke="#809e96"/>
    <path d={'M47 '+(y(reading)-9)+' Q74 '+(y(reading)+9)+' 101 '+(y(reading)-9)+' V386 H47 Z'} fill="#85cccd" stroke="#377e82"/>
    {Array.from({length:32},(_,i)=>Math.round((origin+i/10)*10)/10).filter(n=>n>=0&&n<=50).map(n=><g key={n}>
      <line x1={Number.isInteger(n)?99:111} y1={y(n)} x2="133" y2={y(n)} stroke="#274943"/>
      {Number.isInteger(n)&&<text x="142" y={y(n)+5} fill="#274943" fontSize="15">{n} mL</text>}
    </g>)}
  </svg><details><summary>Accessible scale reading</summary>{(Math.round(reading*100)/100).toFixed(2)} mL at the meniscus bottom</details></div>;
}


