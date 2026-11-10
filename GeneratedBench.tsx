import {useEffect,useRef,useState} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {apparatusIcon,LabIcon} from './LabIcon';

type Props={
  tools:string[];
  apparatus?:Record<string,string>;
  selected:string;
  onSelect:(tool:string)=>void;
  result?:{visual:string;operation:string;tool:string};
};
const cubic=(x:number)=>x*x*(3-2*x);

export function GeneratedBench(props:Props){
  const host=useRef<HTMLDivElement>(null);
  const live=useRef(props);
  live.current=props;
  const [fallback,setFallback]=useState(false);
  const {tools,apparatus}=props;
  useEffect(()=>{
    const container=host.current!;
    let renderer:T.WebGLRenderer;
    try{renderer=new T.WebGLRenderer({antialias:true});}
    catch{setFallback(true);return;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.65));
    renderer.shadowMap.enabled=true;
    renderer.setClearColor('#e7e8f5');
    container.appendChild(renderer.domElement);
    const scene=new T.Scene();
    scene.fog=new T.Fog('#e7e8f5',17,32);
    scene.add(new T.HemisphereLight('#fffaff','#a19fc6',2.2));
    const key=new T.DirectionalLight('#fff3dd',3);
    key.position.set(-4,8,6);
    key.castShadow=true;
    key.shadow.mapSize.set(1024,1024);
    key.shadow.camera.left=-7;key.shadow.camera.right=7;
    key.shadow.camera.top=7;key.shadow.camera.bottom=-7;
    key.shadow.normalBias=.025;
    scene.add(key);
    const camera=new T.PerspectiveCamera(38,1,.1,60);
    camera.position.set(7,7.5,11);
    const controls=new OrbitControls(camera,renderer.domElement);
    controls.target.set(0,.25,0);
    controls.enableDamping=true;
    controls.minDistance=4;
    controls.maxDistance=20;
    controls.maxPolarAngle=Math.PI*.46;
    const material=(color:string,metalness=0)=>new T.MeshStandardMaterial({color,roughness:.38,metalness});
    const glass=new T.MeshPhysicalMaterial({color:'#d6f7ff',transparent:true,opacity:.24,roughness:.16,side:T.DoubleSide,depthWrite:false});
    const dark=material('#444465',.3),steel=material('#b4bfd2',.48),mint=material('#52b7ab'),violet=material('#7160a0');
    const liquidMat=new T.MeshStandardMaterial({color:'#52bed1',transparent:true,opacity:.63,depthWrite:false,roughness:.24});
    const saltMat=material('#fbfcff'), sampleMat=material('#e9b36a'), bubbleMat=material('#d0f7ff');
    function mesh(parent:T.Object3D,geometry:T.BufferGeometry,paint:T.Material,x=0,y=0,z=0){
      const object=new T.Mesh(geometry,paint);
      object.position.set(x,y,z);
      object.castShadow=!paint.transparent;
      object.receiveShadow=true;
      parent.add(object);
      return object;
    }
    const box=(x:number,y:number,z:number)=>new T.BoxGeometry(x,y,z);
    const cylinder=(r:number,h:number)=>new T.CylinderGeometry(r,r,h,36);
    function vessel(parent:T.Object3D,profile:number[][]){
      return mesh(parent,new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),40),glass);
    }
    const tabletop=material('#66648d');
    mesh(scene,box(13,.25,8),tabletop,0,-.13);
    for(const x of [-5.7,5.7])for(const z of [-3.2,3.2])mesh(scene,box(.25,2.1,.25),dark,x,-1.2,z);
    mesh(scene,box(30,.15,30),material('#c9c9df'),0,-2.32);
    mesh(scene,box(5.3,.055,3.2),material('#d0e8e6'),0,.035,1.65);
    const working=new T.Group();working.position.set(0,.07,1.8);scene.add(working);
    const processDish=vessel(working,[[0,0],[.83,0],[.98,.08],[1.06,.29]]);
    const processBeaker=vessel(working,[[0,0],[.56,0],[.60,.07],[.60,1.08],[.64,1.12]]);
    const secondBeaker=processBeaker.clone();working.add(secondBeaker);
    const volume=mesh(working,cylinder(.52,1),liquidMat);
    const secondVolume=volume.clone();working.add(secondVolume);
    const crystals=Array.from({length:18},(_,i)=>{
      const angle=i*2.4;
      const radius=.18+Math.sqrt(i/18)*.65;
      const crystal=mesh(working,box(.11+i%3*.035,.11+i%3*.035,.11+i%3*.035),saltMat,Math.cos(angle)*radius,.09,Math.sin(angle)*radius);
      crystal.rotation.set(i*.11,i*.52,i*.13);
      return crystal;
    });
    const specimens=[mesh(working,box(.30,.28,.28),sampleMat),mesh(working,box(.30,.28,.28),sampleMat)];
    const bubbles=Array.from({length:8},(_,i)=>mesh(working,new T.SphereGeometry(.026+i%3*.015,12,8),bubbleMat));
    const upperLayer=mesh(working,cylinder(.515,.18),material('#e3be68'),0,.55);
    const pour=mesh(working,cylinder(.045,1.1),liquidMat,0,.95);
    const apparatusMeshes=tools.map((label,index)=>{
      const kind=apparatus?.[label]??apparatusIcon(label);
      const object=new T.Group();
      const home=new T.Vector3(((index%8)-Math.min(7,tools.length-1)/2)*1.46,.06,-.35-Math.floor(index/8)*1.15);
      scene.add(object);
      object.position.copy(home);
      switch(kind){
        case 'cylinder':
          mesh(object,cylinder(.32,.08),steel,0,.04);
          vessel(object,[[0,.08],[.17,.08],[.17,1.37],[.20,1.41]]);
          for(let j=0;j<8;j++)mesh(object,box(j%2?.075:.12,.013,.01),dark,.06,.28+j*.13,.18);
          break;
        case 'flask':vessel(object,[[0,0],[.43,0],[.46,.08],[.14,.74],[.14,1.01],[.18,1.03]]);break;
        case 'dish':vessel(object,[[0,0],[.45,0],[.53,.05],[.59,.18]]);break;
        case 'filter':vessel(object,[[0,.02],[.08,.02],[.08,.45],[.47,.87]]);break;
        case 'balance':
          mesh(object,box(1,.22,.75),dark,0,.11);
          mesh(object,cylinder(.39,.075),steel,0,.29);
          mesh(object,box(.42,.065,.018),mint,0,.13,.383);
          break;
        case 'timer':
        case 'lens':{
          const face=mesh(object,new T.TorusGeometry(.29,.053,12,36),kind==='timer'?mint:dark,0,.42,0);
          if(kind==='lens'){
            mesh(object,cylinder(.065,.42),dark,0,.12);
            mesh(object,new T.CircleGeometry(.25,32),glass,0,.42);
          }else{
            mesh(object,new T.CircleGeometry(.26,32),steel,0,.42);
            mesh(object,box(.025,.15,.014),dark,0,.47,.018);
          }
          face.rotation.y=.18;
          break;
        }
        case 'notebook':
        case 'blot':
          mesh(object,box(.68,.055,.83),kind==='notebook'?violet:steel,0,.028);
          mesh(object,box(.62,.024,.77),saltMat,0,.065);
          break;
        case 'heat':
          mesh(object,box(.88,.22,.76),dark,0,.11);
          mesh(object,cylinder(.34,.07),steel,0,.25);
          mesh(object,cylinder(.065,.08),violet,.25,.12,.38).rotation.x=Math.PI/2;
          break;
        default:
          vessel(object,[[0,0],[.37,0],[.38,.07],[.38,.74],[.43,.78]]);
      }
      const ring=mesh(object,new T.RingGeometry(.47,.52,40),new T.MeshBasicMaterial({color:'#784fe2',side:T.DoubleSide}),0,.012);
      ring.rotation.x=-Math.PI/2;
      const hit=mesh(object,box(1.1,1.45,1),new T.MeshBasicMaterial({visible:false}),0,.6);
      return {label,object,home,ring,hit};
    });
    const ray=new T.Raycaster(), pointer=new T.Vector2();
    let pointerStart:T.Vector2|undefined;
    const canvas=renderer.domElement;
    function down(event:PointerEvent){pointerStart=new T.Vector2(event.clientX,event.clientY);}
    function up(event:PointerEvent){
      if(!pointerStart||pointerStart.distanceTo(pointer.set(event.clientX,event.clientY))>5)return;
      const bounds=canvas.getBoundingClientRect();
      pointer.set(2*(event.clientX-bounds.left)/bounds.width-1,1-2*(event.clientY-bounds.top)/bounds.height);
      ray.setFromCamera(pointer,camera);
      const hit=ray.intersectObjects(apparatusMeshes.map(item=>item.hit))[0];
      const item=apparatusMeshes.find(item=>item.hit===hit?.object);
      if(item)live.current.onSelect(item.label);
    }
    canvas.addEventListener('pointerdown',down);
    canvas.addEventListener('pointerup',up);
    const resize=new ResizeObserver(()=>{
      const width=container.clientWidth,height=container.clientHeight;
      if(!width||!height)return;
      camera.aspect=width/height;
      camera.updateProjectionMatrix();
      renderer.setSize(width,height);
    });
    resize.observe(container);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    let previous:Props['result'],age=0,last=0,frame=0,liquid=0,liquidInDish=false;
    function draw(now:number){
      frame=requestAnimationFrame(draw);
      const delta=last?Math.min(34,now-last):16;
      last=now;
      const {selected,result}=live.current;
      if(result!==previous){
        previous=result;
        age=0;
        if(result?.visual==='liquid')liquidInDish=(apparatus?.[result.tool]??apparatusIcon(result.tool))==='dish';
      }
      else age+=delta;
      const ease=reduced.matches?1:1-Math.exp(-delta*.013);
      const progress=reduced.matches?1:Math.min(1,age/950);
      const movement=Math.sin(progress*Math.PI);
      const lookAtTool=result?.tool;
      for(const item of apparatusMeshes){
        const active=selected===item.label;
        item.ring.visible=active;
        const playing=lookAtTool===item.label?movement:0;
        item.object.position.x=T.MathUtils.lerp(item.object.position.x,item.home.x*(1-playing*.74),ease);
        item.object.position.y=T.MathUtils.lerp(item.object.position.y,item.home.y+(active?.16:0)+playing*.7,ease);
        item.object.position.z=T.MathUtils.lerp(item.object.position.z,item.home.z+(1.05-item.home.z)*playing,ease);
        item.object.rotation.z=playing*(result?.operation==='Transfer'?-.72:result?.operation==='Mix'?Math.sin(age/55)*.23:-.10);
      }
      const visual=result?.visual??'neutral';
      const paired=visual==='samples'||visual==='osmosis';
      const dry=visual==='crystals';
      const pooled=['liquid','bubbles','layers','precipitate'].includes(visual);
      const dish=dry||(visual==='liquid'&&liquidInDish);
      processDish.visible=dish;
      processBeaker.visible=!dish&&(paired||pooled);
      processBeaker.position.x=paired?-.72:0;
      secondBeaker.visible=paired;
      secondBeaker.position.x=.72;
      liquid=T.MathUtils.lerp(liquid,pooled||visual==='samples'?(dish?.11:.5):0,ease*.35);
      volume.visible=liquid>.016;
      volume.scale.set(dish?1.67:1,Math.max(.01,liquid),dish?1.67:1);
      volume.position.set(paired?-.72:0,liquid/2+.03,0);
      secondVolume.visible=paired&&volume.visible;
      secondVolume.position.set(.72,volume.position.y,0);
      secondVolume.scale.copy(volume.scale);
      for(const [i,crystal] of crystals.entries()){
        crystal.visible=(dry||visual==='precipitate')&&progress>.2+i*.018;
        crystal.scale.setScalar(cubic(T.MathUtils.clamp((progress-.2-i*.018)*3,0,1)));
        if(visual==='precipitate')crystal.scale.multiplyScalar(.4);
      }
      for(const [i,specimen] of specimens.entries()){
        specimen.visible=paired;
        specimen.position.set(i?.72:-.72,.18,0);
        specimen.scale.setScalar(visual==='osmosis'?1+(i?-.23:.22)*cubic(progress):1);
      }
      for(const [i,bubble] of bubbles.entries()){
        bubble.visible=visual==='bubbles'&&progress<1;
        bubble.position.set(Math.sin(i*2.2)*.33,.09+((progress*1.4+i/8)%1)*.61,Math.cos(i*2.2)*.33);
      }
      upperLayer.visible=visual==='layers';
      pour.visible=result?.operation==='Transfer'&&progress>.2&&progress<.78;
      pour.scale.y=Math.max(.04,movement);
      controls.update();
      renderer.render(scene,camera);
    }
    frame=requestAnimationFrame(draw);
    return ()=>{
      cancelAnimationFrame(frame);
      resize.disconnect();
      canvas.removeEventListener('pointerdown',down);
      canvas.removeEventListener('pointerup',up);
      controls.dispose();
      scene.traverse(object=>{
        if(object instanceof T.Mesh){
          object.geometry.dispose();
          (Array.isArray(object.material)?object.material:[object.material]).forEach(paint=>paint.dispose());
        }
      });
      renderer.dispose();
      canvas.remove();
    };
  },[tools,apparatus]);

  return <div className="generated-canvas" ref={host} aria-label="Interactive 3D lab bench">
    {fallback&&<div className="generated-fallback"><LabIcon name={apparatusIcon(props.selected)} size={68}/><p>3D is unavailable. Use the apparatus buttons to continue.</p></div>}
  </div>;
}
