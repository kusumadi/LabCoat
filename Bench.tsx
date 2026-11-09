import {useEffect,useRef,useState} from 'react';
import * as T from 'three';
import {defaultEnvironment,moveEquipment,type Environment,type Item,type Layout,type Point} from './environment.mjs';

type Props={reading:number;volume:number;pink:number;plume:boolean;camera:string;motion:string;act:(name:string)=>void;filled:boolean;environment?:Environment;layout?:Layout;arrange?:boolean;explore?:boolean;onLayout?:(layout:Layout)=>void};
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
    const ambient=new T.HemisphereLight('#fff9ec','#759787',2.6);
    scene.add(ambient);
    let parent:T.Object3D=scene;
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
    function mesh(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number,owner:T.Object3D=parent) {
      const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=!m.transparent;o.receiveShadow=true;owner.add(o);return o;
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
    const table=new T.Group();
    scene.add(table);
    const groups:Partial<Record<Item,T.Group>>={table};
    const hitboxes:{object:T.Mesh;action:string;item:Item}[]=[];
    function group(item:Item) {
      const g=new T.Group();
      table.add(g);groups[item]=g;
      parent=g;
      return g;
    }
    function target(item:Item,action:string,w:number,h:number,d:number,x:number,y:number,z:number) {
      const object=mesh(box(w,h,d),new T.MeshBasicMaterial({visible:false}),x,y,z);
      hitboxes.push({object,action,item});
    }
    parent=table;
    const tabletop=new T.MeshStandardMaterial({color:'#71988b'});
    mesh(box(12,.25,6),tabletop,0,-.15,0);
    target('table','',12,.24,6,0,-.15,0);
    for(const x of [-5.5,5.5]) for(const z of [-2.55,2.55]) mesh(box(.22,2.7,.22),metal,x,-1.55,z);
    mesh(box(34,.2,30),new T.MeshStandardMaterial({color:'#b8c9c1'}),0,-3.55,0,scene);
    const burette=group('burette');
    mesh(box(1.95,.12,1.65),metal,-.9,.08,-.6);
    mesh(cyl(.05,5.7),metal,-.95,2.93,-.6);
    mesh(box(1.13,.12,.14),metal,-.47,4.58,-.43);
    mesh(new T.TorusGeometry(.12,.035,12,32),metal,0,4.58,0).rotation.x=Math.PI/2;
    mesh(cyl(.095,4.6),glass,0,3.85,0);
    const column=mesh(cyl(.071,1),liquid,0,3.8,0);
    const ticks=new T.InstancedMesh(box(1,.003,.003),new T.MeshBasicMaterial({color:'#163833'}),501);
    const transform=new T.Object3D();
    for(let i=0;i<=500;i++){
      const major=i%50===0;
      transform.position.set(.072,6-i*.0085,.102);
      transform.scale.x=major?.12:i%10===0?.076:.038;
      transform.updateMatrix();
      ticks.setMatrixAt(i,transform.matrix);
      if(major) label(String(i/10),.16,.08,.224,6-i*.0085,.102);
    }
    burette.add(ticks);
    mesh(cyl(.041,.32),glass,0,1.4,0);
    mesh(cyl(.068,.2),teal,0,1.58,0).rotation.z=Math.PI/2;
    const handle=mesh(box(.28,.068,.065),teal,.14,1.58,.06);
    const drop=mesh(new T.SphereGeometry(.035,16,12),liquid,0,1.22,0);
    target('burette','tap',.48,.3,.38,.12,1.57,0);
    target('burette','burette',.38,4.46,.32,0,3.89,0);
    target('burette','burette',1.1,4.9,.4,-.95,2.7,-.6);
    group('tile');
    mesh(box(1.55,.055,1.45),new T.MeshStandardMaterial({color:'#fffcf4',roughness:.29}),0,.03,0);
    target('tile','',1.55,.08,1.45,0,.03,0);
    const flask=group('flask');
    const vessel=new T.Group();
    flask.add(vessel);parent=vessel;
    const profile=(pts:number[][])=>new T.LatheGeometry(pts.map(([r,y])=>new T.Vector2(r,y)),56);
    mesh(profile([[0,0],[.43,0],[.5,.06],[.49,.15],[.18,.78],[.16,.9],[.16,1.1],[.19,1.11]]),glass,0,0,0);
    const fill=mesh(profile([[0,0],[.42,0],[.47,.06],[.38,.3],[0,.3]]),solution,0,.025,0);
    const plume=mesh(new T.SphereGeometry(.15,24,18),plumeMaterial,0,.2,.03);
    target('flask','flask',1,1.12,.92,0,.58,0);
    const bottles=[
      {item:'base',x:-2.25,name:'NaOH',color:'#afded0'},
      {item:'acid',x:-3.45,name:'HCl',color:'#b3c5c9'},
      {item:'indicator',x:2.38,name:'Indicator',color:'#7d6048'}
    ] as const;
    for(const {item,x,name,color} of bottles){
      group(item);
      const body=new T.MeshStandardMaterial({color,roughness:.27});
      const narrow=item==='indicator';
      mesh(cyl(narrow?.27:.39,narrow?.79:1.12),body,x,narrow?.4:.57,-.27);
      mesh(cyl(.19,.18),metal,x,narrow?.85:1.21,-.27);
      label(name,narrow?.48:.66,.21,x,.53,narrow?.009:.13);
      target(item,item==='base'?'burette':item==='acid'?'pipette':'indicator',.75,1.25,.8,x,.6,-.27);
    }
    const pipette=group('pipette');
    const pipetteBody=new T.Group();
    pipette.add(pipetteBody);parent=pipetteBody;
    mesh(cyl(.049,2.7),glass,1.77,.095,.75).rotation.z=1.28;
    const bulb=mesh(new T.SphereGeometry(.17,24,18),teal,3.1,.55,.75);
    bulb.scale.set(1.35,.78,.8);
    const tube=mesh(new T.SphereGeometry(.10,20,14),glass,1.69,.08,.75);
    tube.scale.x=3.1;
    target('pipette','pipette',2.95,.52,.52,1.78,.26,.75);
    const indicatorDrop=mesh(new T.SphereGeometry(.033,16,12),liquid,0,0,0,table);
    const ray=new T.Raycaster();
    const plane=new T.Plane(new T.Vector3(0,1,0),0);
    const onPlane=new T.Vector3();
    let drag:{id:number;item?:Item;action?:string;x:number;y:number;start?:Point;position?:Point;moved:boolean}|undefined;
    let orbit=0,elevation=0,zoom=1;
    let pending:Layout|undefined;
    let layoutVersion=state.current.layout;
    const canvas=renderer.domElement;
    function cast(e:PointerEvent) {
      const r=canvas.getBoundingClientRect();
      ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2),camera);
    }
    function hit() {
      const objects=state.current.arrange ? hitboxes : hitboxes.filter(t=>t.action);
      const object=ray.intersectObjects(objects.map(t=>t.object))[0]?.object;
      return objects.find(t=>t.object===object);
    }
    function intersection() {
      plane.constant=-table.position.y;
      return ray.ray.intersectPlane(plane,onPlane) ? {x:onPlane.x,z:onPlane.z} : undefined;
    }
    const down=(e:PointerEvent)=>{
      if(e.button!==0||drag)return;
      cast(e);
      const target=hit();
      const item=state.current.arrange ? target?.item : undefined;
      drag={id:e.pointerId,item,action:target?.action,x:e.clientX,y:e.clientY,moved:false,
        start:item ? intersection() : undefined,position:item ? state.current.layout?.[item] : undefined};
      canvas.setPointerCapture(e.pointerId);
    };
    const move=(e:PointerEvent)=>{
      cast(e);
      if(!drag||drag.id!==e.pointerId) {
        canvas.style.cursor=state.current.arrange?'grab':hit()?'pointer':state.current.explore?'grab':'default';
        return;
      }
      const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
      if(!drag.moved&&Math.hypot(dx,dy)<4)return;
      if(drag.item&&drag.start) {
        const p=intersection();
        if(p) pending=moveEquipment(state.current.layout??{},drag.item,(drag.position?.x??0)+p.x-drag.start.x,(drag.position?.z??0)+p.z-drag.start.z);
      } else if(state.current.explore&&state.current.camera==='Bench') {
        orbit+=dx*.006;
        elevation=T.MathUtils.clamp(elevation+dy*.005,-.23,.52);
        drag.x=e.clientX;drag.y=e.clientY;
      }
      drag.moved=true;
      canvas.style.cursor='grabbing';
    };
    const up=(e:PointerEvent)=>{
      if(drag?.id!==e.pointerId)return;
      if(e.type==='pointerup') {
        if(drag.item&&pending) state.current.onLayout?.(pending);
        else if(!drag.moved&&!state.current.arrange&&drag.action) state.current.act(drag.action);
      }
      drag=undefined;pending=undefined;
      canvas.style.cursor='grab';
    };
    const wheel=(e:WheelEvent)=>{
      if(!state.current.explore||state.current.camera!=='Bench'||!e.shiftKey)return;
      e.preventDefault();zoom=T.MathUtils.clamp(zoom+Math.sign(e.deltaY)*.08,.65,1.5);
    };
    canvas.addEventListener('pointerdown',down);
    canvas.addEventListener('pointermove',move);
    canvas.addEventListener('pointerup',up);
    canvas.addEventListener('lostpointercapture',up);
    canvas.addEventListener('wheel',wheel,{passive:false});
    let frame=0,previous='',began=0,last=0,width=0,height=0,level=1.6,volume=0,plumeAmount=0;
    const clear=new T.Color('#b8e2dd'), pink=new T.Color('#e02983'), goalColor=new T.Color();
    const surfaceColors={sage:new T.Color('#71988b'),slate:new T.Color('#455d69'),birch:new T.Color('#bf9b6d')};
    const look=new T.Vector3(), goal=new T.Vector3(), focus=new T.Vector3();
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    function draw(now:number) {
      frame=requestAnimationFrame(draw);
      const s=state.current, environment=s.environment??defaultEnvironment;
      if(s.layout!==layoutVersion){layoutVersion=s.layout;if(!drag)pending=undefined;}
      const dt=last ? (now-last)/1000 : 1;
      last=now;
      const blend=reduced.matches?1:1-Math.exp(-dt*13);
      if(s.motion!==previous){previous=s.motion;began=now;}
      const age=now-began;
      const progress=(duration:number)=>T.MathUtils.clamp(age/duration,0,1);
      const arc=(duration:number)=>reduced.matches?0:Math.sin(Math.PI*progress(duration));
      const preparing=s.motion.startsWith('prepare');
      const transferring=s.motion.startsWith('transfer');
      const indicating=/^(indicator|add-indicator)/.test(s.motion);
      const adding=s.motion.startsWith('add:');
      const activeLayout=pending??s.layout??environment.layout;
      for(const [item,g] of Object.entries(groups)) {
        const p=activeLayout[item as Item];
        g.position.x=T.MathUtils.lerp(g.position.x,p?.x??0,blend);
        g.position.z=T.MathUtils.lerp(g.position.z,p?.z??0,blend);
      }
      table.position.y=T.MathUtils.lerp(table.position.y,environment.height,blend);
      tabletop.color.lerp(surfaceColors[environment.surface],blend);
      light.intensity=T.MathUtils.lerp(light.intensity,2.8*environment.lighting,blend);
      ambient.intensity=T.MathUtils.lerp(ambient.intensity,2.6*environment.lighting,blend);
      level=T.MathUtils.lerp(level,s.filled?6-s.reading*.085:1.6,preparing?blend*.46:blend);
      column.visible=level>1.605;
      column.scale.y=Math.max(.005,level-1.6);column.position.y=1.6+column.scale.y/2;
      volume=T.MathUtils.lerp(volume,s.volume,transferring?blend*.42:blend);
      fill.visible=volume>.025;
      fill.scale.y=.17+volume/80;
      solution.color.lerp(goalColor.copy(clear).lerp(pink,Math.min(1,s.pink*.89)),blend*.65);
      plumeAmount=T.MathUtils.lerp(plumeAmount,Number(s.plume),blend*.72);
      plume.visible=plumeAmount>.015;
      plumeMaterial.opacity=plumeAmount*.56;
      plume.scale.set(1.6-plumeAmount*.6,.30,1.6-plumeAmount*.6);
      plume.position.x=reduced.matches?0:Math.sin(now/550)*.11;
      const stream=s.motion.startsWith('add:stream');
      const dropProgress=stream ? ((age-115)%150)/150 : (age-115)/260;
      drop.visible=!reduced.matches&&adding&&age>115&&age<(stream?585:375);
      drop.position.y=1.22-.94*T.MathUtils.clamp(dropProgress,0,1)**2;
      handle.rotation.z=adding?arc(690)*1.57:0;
      const swirl=arc(820)*Number(s.motion.startsWith('swirl'));
      vessel.rotation.z=Math.sin(age/50)*.17*swirl;
      vessel.position.x=Math.sin(age/65)*.14*swirl;
      const tilePos=activeLayout.tile,flaskPos=activeLayout.flask;
      vessel.position.y=Math.hypot((tilePos?.x??0)-(flaskPos?.x??0),(tilePos?.z??0)-(flaskPos?.z??0))<.53?.06:0;
      pipetteBody.position.set(transferring?-1.35*arc(900):0,transferring?1.3*arc(900):0,0);
      pipetteBody.rotation.z=transferring?-.78*arc(900):0;
      indicatorDrop.visible=!reduced.matches&&indicating&&age>100&&age<620;
      indicatorDrop.position.set(flask.position.x,1.55-((age%240)/240)*1.25,flask.position.z);
      const eye=s.camera==='Eye level',close=s.camera==='Flask';
      if(width!==host.clientWidth||height!==host.clientHeight){
        width=host.clientWidth;height=host.clientHeight;
        renderer.setSize(width,height);
        camera.aspect=width/Math.max(height,1);camera.updateProjectionMatrix();
      }
      if(eye) {
        focus.set(table.position.x+burette.position.x+.15,table.position.y+level,table.position.z+burette.position.z);
        goal.copy(focus).add(new T.Vector3(0,0,1.25));
      } else if(close) {
        focus.set(table.position.x+flask.position.x,table.position.y+.75,table.position.z+flask.position.z);
        goal.set(1.3,1.35,4.2).add(focus);
      } else {
        const distance=(camera.aspect<1.1?17:13.8)*zoom;
        const yaw=.29+orbit;
        const pitch=.25+elevation;
        focus.set(0,2.25,0);
        goal.set(Math.sin(yaw)*distance*Math.cos(pitch),2.25+Math.sin(pitch)*distance,Math.cos(yaw)*distance*Math.cos(pitch));
      }
      camera.position.lerp(goal,blend);
      look.lerp(focus,blend);camera.lookAt(look);
      renderer.render(scene,camera);
    }

    frame=requestAnimationFrame(draw);
    return ()=>{
      cancelAnimationFrame(frame);renderer.domElement.remove();renderer.dispose();
      scene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials){m.map?.dispose();m.dispose();}}});
    };
  },[]);
  return <div className="bench" data-explore={props.explore||props.arrange||undefined} ref={mount}>
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
