import {useEffect,useRef,useState} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {apparatusIcon,LabIcon} from './LabIcon';
import {benchItems} from './lab-capabilities.mjs';

export type TransferOutcome={allowed:boolean;visual?:string;observation?:string;source?:string;spent?:boolean};
type Props={
  tools:string[];
  materials:string[];
  viewReset:number;
  benchReset:number;
  apparatus?:Record<string,string>;
  selected:string;
  onSelect:(tool:string)=>void;
  onDrop:(tool:string,kind:'transfer'|'mat')=>void;
  onTransfer:(from:number,to:number,phase:'liquid'|'solid')=>Promise<TransferOutcome>;
  result?:{visual:string;operation:string;tool:string;direct?:boolean};
};
const cubic=(x:number)=>x*x*(3-2*x);

export function GeneratedBench(props:Props){
  const host=useRef<HTMLDivElement>(null);
  const live=useRef(props);
  live.current=props;
  const [fallback,setFallback]=useState(false);
  const {tools,apparatus,materials}=props;
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
    scene.fog=new T.Fog('#e7e8f5',36,55);
    scene.add(new T.HemisphereLight('#fffaff','#a19fc6',2.2));
    const key=new T.DirectionalLight('#fff3dd',3);
    key.position.set(-4,8,6);
    key.castShadow=true;
    key.shadow.mapSize.set(1024,1024);
    key.shadow.camera.left=-7;key.shadow.camera.right=7;
    key.shadow.camera.top=7;key.shadow.camera.bottom=-7;
    key.shadow.normalBias=.025;
    scene.add(key);
    const camera=new T.OrthographicCamera(-8,8,5,-5,.1,65);
    const overview=new T.Vector3(2,12,12);
    camera.position.copy(overview);
    const controls=new OrbitControls(camera,renderer.domElement);
    controls.target.set(0,.25,0);
    controls.enableDamping=true;
    controls.minZoom=.65;
    controls.maxZoom=3.25;
    controls.enablePan=false;
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
    const items=benchItems(tools,materials);
    const columns=Math.min(8,Math.max(4,Math.ceil(Math.sqrt(items.length*1.8))));
    const rows=Math.ceil(items.length/columns);
    const back=Math.max(4,1.25+rows*1.7);
    mesh(scene,box(13,.25,back+4),tabletop,0,-.13,(4-back)/2);
    for(const x of [-5.7,5.7])for(const z of [-back+.55,3.2])mesh(scene,box(.25,2.1,.25),dark,x,-1.2,z);
    mesh(scene,box(30,.15,30),material('#c9c9df'),0,-2.32);
    const matPaint=material('#d0e8e6');
    mesh(scene,box(5.3,.055,3.2),matPaint,0,.035,1.65);
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
    const pour=mesh(working,cylinder(.045,1.1),liquidMat.clone(),0,.95);
    const fallingSample=mesh(scene,box(.23,.19,.24),sampleMat);
    const overlay=document.createElement('div');
    overlay.className='generated-bench-labels';
    overlay.setAttribute('aria-hidden','true');
    container.appendChild(overlay);
    const paints=['#53b9d9','#b695e2','#64bd9b','#e4bd75'];
    const apparatusMeshes=items.map(({id,label,name,content},index)=>{
      const kind=content==='solid'?'sample':content==='liquid'?'supply':apparatus?.[label]??apparatusIcon(label);
      const object=new T.Group();
      const rowSize=Math.min(columns,items.length-Math.floor(index/columns)*columns);
      const home=new T.Vector3(((index%columns)-(rowSize-1)/2)*Math.min(2.1,11/(columns-1)),.07,-.60-Math.floor(index/columns)*1.7);
      scene.add(object);
      object.position.copy(home);
      switch(kind){
        case 'sample':
          mesh(object,box(.73,.085,.54),steel,0,.042);
          break;
        case 'supply':
          vessel(object,[[0,0],[.33,0],[.36,.08],[.36,.67],[.25,.85],[.25,1.02]]);
          break;
        case 'burette':
          mesh(object,box(.60,.08,.45),steel,0,.04);
          mesh(object,cylinder(.035,1.55),steel,-.19,.81);
          vessel(object,[[0,.28],[.05,.28],[.09,.41],[.09,1.55],[.12,1.58]]);
          mesh(object,box(.25,.06,.06),mint,0,.36);
          break;
        case 'pipette':
        case 'rod':
          mesh(object,cylinder(.046,.84),kind==='rod'?glass:steel,0,.15).rotation.z=Math.PI/2;
          if(kind==='pipette')mesh(object,new T.SphereGeometry(.10,16,12),mint,-.36,.15);
          break;
        case 'tube':
          vessel(object,[[0,.02],[.13,.04],[.17,.14],[.17,.86],[.20,.89]]);
          break;
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
      const dimensions:Record<string,[number,number,number]>={supply:[.30,.66,1.02],cylinder:[.146,1.22,1.40],dish:[.43,.14,.29],tube:[.145,.68,.89],
        flask:[.31,.36,1.03],beaker:[.34,.64,.78],tools:[.34,.64,.78]};
      const shape=dimensions[kind];
      const tint=new T.Color(content==='liquid'?paints[index%paints.length]:'#54bed1');
      const fillPaint=liquidMat.clone();fillPaint.color.copy(tint);
      const fill=shape?mesh(object,cylinder(shape[0],1),fillPaint):undefined;
      const solid=mesh(object,box(.23,.19,.24),sampleMat,0,.18);
      const tag=document.createElement('span');
      tag.textContent=name;
      tag.title=name;
      if(content)tag.classList.add('material-tag');
      overlay.appendChild(tag);
      const ring=mesh(object,new T.RingGeometry(.47,.52,40),new T.MeshBasicMaterial({color:'#784fe2',side:T.DoubleSide}),0,.012);
      ring.rotation.x=-Math.PI/2;
      const height=shape?.[2]??(kind==='filter'?.87:kind==='timer'||kind==='lens'?.76:.37);
      const hit=mesh(object,box(1.09,height+.12,1.03),new T.MeshBasicMaterial({visible:false}),0,height/2);
      return {id,label,content,object,home,rest:home.clone(),ring,hit,tag,height,fill,shape,solid,baseTint:tint.clone(),
        level:content==='liquid'?.42:0,displayLevel:content==='liquid'?.42:0,hasSolid:content==='solid',tint,fillPaint};
    });
    const ray=new T.Raycaster(), pointer=new T.Vector2();
    type Item=typeof apparatusMeshes[number];
    const canvas=renderer.domElement;
    const plane=new T.Plane(new T.Vector3(0,1,0),-.07);
    const hits=apparatusMeshes.map(item=>item.hit);
    const byHit=new Map(apparatusMeshes.map(item=>[item.hit as T.Object3D,item]));
    const point=new T.Vector3();
    const grab=new T.Vector3();
    const offset=new T.Vector3();
    const start=new T.Vector2();
    let drag:{id:number;item:Item;moved:boolean;target?:Item}|undefined;
    let checking=false,disposed=false,reaction:{item:Item;age:number}|undefined;
    let transfer:{from:Item;to:Item;age:number;amount:number;solid:boolean;origin:T.Vector3;before:number;received:number;spent?:boolean}|undefined;
    const onMat=(position:T.Vector3)=>Math.abs(position.x)<2.65&&position.z>.05&&position.z<3.25;
    function aim(event:PointerEvent){
      const bounds=canvas.getBoundingClientRect();
      pointer.set(2*(event.clientX-bounds.left)/bounds.width-1,1-2*(event.clientY-bounds.top)/bounds.height);
      ray.setFromCamera(pointer,camera);
    }
    function down(event:PointerEvent){
      if(event.button!==0||drag||transfer||checking)return;
      aim(event);
      const hit=ray.intersectObjects(hits)[0];
      const item=hit&&byHit.get(hit.object);
      if(!item||!ray.ray.intersectPlane(plane,point))return;
      controls.enabled=false;
      event.stopImmediatePropagation();
      canvas.setPointerCapture(event.pointerId);
      start.set(event.clientX,event.clientY);
      offset.copy(item.object.position).sub(point);
      grab.copy(item.object.position);
      drag={id:event.pointerId,item,moved:false};
      canvas.style.cursor='grabbing';
      if(item.label)live.current.onSelect(item.label);
    }
    function move(event:PointerEvent){
      aim(event);
      if(!drag){canvas.style.cursor=ray.intersectObjects(hits).length?'grab':'default';return;}
      if(drag.id!==event.pointerId||!ray.ray.intersectPlane(plane,point))return;
      if(!drag.moved&&start.distanceTo(new T.Vector2(event.clientX,event.clientY))<5)return;
      drag.moved=true;
      grab.set(T.MathUtils.clamp(point.x+offset.x,-5.92,5.92),.42,
        T.MathUtils.clamp(point.z+offset.z,-back+.48,3.48));
      drag.target=undefined;
      if(drag.item.level>.01||drag.item.hasSolid){
        for(const hit of ray.intersectObjects(hits)){
          const item=byHit.get(hit.object);
          if(item&&item!==drag.item&&item.shape&&item.label&&
            (drag.item.level<=.01?!item.hasSolid:item.level+drag.item.level<=1.001)){drag.target=item;break;}
        }
      }
    }
    async function end(event:PointerEvent){
      if(drag?.id!==event.pointerId)return;
      if(event.type==='pointerup')move(event);
      const {item,moved,target}=drag;
      drag=undefined;
      controls.enabled=true;
      canvas.style.cursor='grab';
      if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
      if(!moved||event.type!=='pointerup')return;
      if(target){
        const solid=item.hasSolid&&item.level<=.01;
        checking=true;
        const origin=item.object.position.clone();
        let outcome:TransferOutcome;
        try{outcome=await live.current.onTransfer(item.id,target.id,solid?'solid':'liquid');}
        finally{checking=false;}
        if(disposed||!outcome.allowed)return;
        transfer={from:item,to:target,age:0,amount:solid?0:item.level,
          solid,origin,before:item.level,received:target.level,spent:outcome.spent};
        if(outcome.visual==='bubbles')reaction={item:target,age:0};
        if(!solid)target.tint.lerp(item.tint,transfer.amount/Math.max(.01,target.level+transfer.amount));
        const matching=apparatusMeshes.filter(row=>row.label===target.label);
        if(matching.length===1||(solid&&matching.every(row=>row===target||row.hasSolid)))
          live.current.onDrop(target.label,'transfer');
      }else{
        const wasOnMat=onMat(item.rest);
        item.rest.set(grab.x,.07,grab.z);
        if(!wasOnMat&&onMat(item.rest)&&item.label)live.current.onDrop(item.label,'mat');
      }
    }
    canvas.addEventListener('pointerdown',down,true);
    canvas.addEventListener('pointermove',move);
    canvas.addEventListener('pointerup',end);
    canvas.addEventListener('pointercancel',end);
    canvas.addEventListener('lostpointercapture',end);
    const center=new T.Vector3(0,.25,(4-back)/2);
    function fullView(){
      controls.reset();
      controls.target.copy(center);
      camera.position.copy(center).add(overview);
      camera.zoom=1;
      camera.updateProjectionMatrix();
      controls.update();
    }
    const resize=new ResizeObserver(()=>{
      const width=container.clientWidth,height=container.clientHeight;
      if(!width||!height)return;
      const aspect=width/height;
      const vertical=Math.max((back+4)*.39+1.6,7.5/aspect);
      camera.left=-vertical*aspect;camera.right=vertical*aspect;
      camera.top=vertical;camera.bottom=-vertical;
      camera.updateProjectionMatrix();
      renderer.setSize(width,height);
    });
    fullView();
    resize.observe(container);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    let previous:Props['result'],age=0,last=0,frame=0,liquid=0,liquidInDish=false;
    const streamAxis=new T.Vector3(0,1,0),fromMouth=new T.Vector3(),toMouth=new T.Vector3(),direction=new T.Vector3();
    const projected=new T.Vector3();
    let evaporation:{item:Item;initial:number}|undefined,crystalDish:Item|undefined;
    let seenView=live.current.viewReset,seenReset=live.current.benchReset,osmosisReset=-1;
    function draw(now:number){
      frame=requestAnimationFrame(draw);
      const delta=last?Math.min(34,now-last):16;
      last=now;
      const {selected,result,viewReset,benchReset}=live.current;
      if(viewReset!==seenView){seenView=viewReset;fullView();}
      if(benchReset!==seenReset){
        seenReset=benchReset;
        transfer=undefined;
        reaction=undefined;
        evaporation=undefined;
        crystalDish=undefined;
        for(const item of apparatusMeshes){
          item.rest.copy(item.home);
          item.level=item.content==='liquid'?.42:0;
          item.tint.copy(item.baseTint);
          item.solid.scale.setScalar(1);
          item.hasSolid=item.content==='solid';
        }
      }
      if(result!==previous){
        previous=result;
        age=0;
        if(result?.visual==='osmosis')osmosisReset=seenReset;
        if(result?.visual==='liquid')liquidInDish=(apparatus?.[result.tool]??apparatusIcon(result.tool))==='dish';
        if(result?.visual==='crystals'&&result.operation==='Wait'){
          const item=apparatusMeshes.find(row=>row.label&&(apparatus?.[row.label]??apparatusIcon(row.label))==='dish'&&row.level>.01);
          if(item){evaporation={item,initial:item.level};crystalDish=item;}
        }
      }
      else age+=delta;
      const ease=reduced.matches?1:1-Math.exp(-delta*.013);
      const progress=reduced.matches?1:Math.min(1,age/950);
      const movement=Math.sin(progress*Math.PI);
      if(evaporation){
        evaporation.item.level=evaporation.initial*(1-cubic(progress));
        if(progress>=1)evaporation=undefined;
      }
      const lookAtTool=result?.direct?undefined:result?.tool;
      const flight=transfer?(reduced.matches?1:Math.min(1,(transfer.age+=delta)/1050)):0;
      const streamProgress=cubic(T.MathUtils.clamp((flight-.30)/.37,0,1));
      if(transfer){
        const {from,to,solid,amount,before,received}=transfer;
        if(solid&&flight>=.63){from.hasSolid=false;to.hasSolid=!transfer.spent;}
        if(transfer.spent&&flight>=.63)to.hasSolid=false;
        if(!solid){

          from.level=before-amount*streamProgress;
          to.level=received+amount*streamProgress;
        }
      }
      matPaint.color.set(drag?.moved&&onMat(grab)&&!drag.target?'#b4dfce':'#d0e8e6');
      for(const item of apparatusMeshes){
        const active=!!selected&&selected===item.label;
        const held=drag?.item===item&&drag.moved;
        const receiving=drag?.target===item||transfer?.to===item;
        item.ring.visible=active||!!held||receiving;
        (item.ring.material as T.MeshBasicMaterial).color.set(receiving?'#08a184':'#784fe2');
        const playing=lookAtTool===item.label&&!transfer&&!drag?movement:0;
        if(transfer?.from===item){
          const {to,origin,solid}=transfer;
          const approaching=cubic(Math.min(1,flight/.30)),returning=cubic(Math.max(0,(flight-.67)/.33));
          item.object.position.set(to.rest.x-.82,to.rest.y+to.height+(solid?.5:.24),to.rest.z);
          item.object.position.lerp(origin,1-approaching).lerp(item.rest,returning);
          item.object.rotation.z=-(solid?.40:1.24)*approaching*(1-returning);
        }else{
          const place=held?grab:item.rest;
          item.object.position.x=T.MathUtils.lerp(item.object.position.x,place.x*(1-playing*.74),ease);
          item.object.position.y=T.MathUtils.lerp(item.object.position.y,place.y+playing*.7,ease);
          item.object.position.z=T.MathUtils.lerp(item.object.position.z,place.z+(1.05-place.z)*playing,ease);
          item.object.rotation.z=T.MathUtils.lerp(item.object.rotation.z,
            playing*(result?.operation==='Transfer'?-.72:result?.operation==='Mix'?Math.sin(age/55)*.23:-.10),ease);
        }
        item.displayLevel=T.MathUtils.lerp(item.displayLevel,item.level,ease);
        if(item.fill&&item.shape){
          const height=item.displayLevel*item.shape[1];
          item.fill.visible=height>.006;
          item.fill.scale.y=Math.max(.001,height);
          item.fill.position.y=.05+height/2;
          item.fillPaint.color.copy(item.tint);
        }
        item.solid.visible=item.hasSolid&&!(transfer?.solid&&transfer.from===item&&flight>=.32&&flight<.63);
        if(result?.visual==='osmosis'&&item.label&&item.hasSolid&&seenReset===osmosisReset){
          const index=apparatusMeshes.filter(row=>row.label===item.label).indexOf(item);
          item.solid.scale.setScalar(1+(index===1?-.23:.22)*cubic(progress));
        }else if(!item.hasSolid)item.solid.scale.setScalar(1);
      }
      const visual=result?.visual??'neutral';
      const paired=(visual==='samples'||visual==='osmosis')&&!apparatusMeshes.some(item=>item.hasSolid);
      const dry=visual==='crystals';
      const realLiquid=apparatusMeshes.some(item=>item.label&&item.level>.01);
      const pooled=(visual==='liquid'&&!realLiquid)||['bubbles','layers','precipitate'].includes(visual);
      const dish=(dry&&!crystalDish)||(visual==='liquid'&&liquidInDish&&!realLiquid);
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
        if(crystalDish&&dry){
          const radius=.09+Math.sqrt(i/18)*.34,angle=i*2.4;
          crystal.position.set(crystalDish.object.position.x+Math.cos(angle)*radius-working.position.x,
            .09,crystalDish.object.position.z+Math.sin(angle)*radius-working.position.z);
        }
        crystal.scale.setScalar(cubic(T.MathUtils.clamp((progress-.2-i*.018)*3,0,1)));
        if(visual==='precipitate')crystal.scale.multiplyScalar(.4);
      }
      for(const [i,specimen] of specimens.entries()){
        specimen.visible=paired;
        specimen.position.set(i?.72:-.72,.18,0);
        specimen.scale.setScalar(visual==='osmosis'?1+(i?-.23:.22)*cubic(progress):1);
      }
      if(reaction){
        reaction.age+=delta;
        if(reaction.age>2300||reduced.matches)reaction=undefined;
      }
      for(const [i,bubble] of bubbles.entries()){
        const target=reaction?.item.object.position,phase=reaction?Math.max(0,(reaction.age-330)/1500):progress;
        bubble.visible=target?phase>0:visual==='bubbles'&&progress<1;
        bubble.position.set((target?target.x-working.position.x:0)+Math.sin(i*2.2)*.23,
          .09+((phase*1.4+i/8)%1)*.61,(target?target.z-working.position.z:0)+Math.cos(i*2.2)*.23);
      }
      upperLayer.visible=visual==='layers';
      fallingSample.visible=!!transfer?.solid&&flight>=.32&&flight<.63;
      if(transfer&&fallingSample.visible){
        const t=(flight-.32)/.31;
        fromMouth.copy(transfer.from.solid.position);
        transfer.from.object.localToWorld(fromMouth);
        toMouth.copy(transfer.to.object.position);toMouth.y+=.18;
        fallingSample.position.copy(fromMouth).lerp(toMouth,t*t);
        fallingSample.rotation.z=t*1.9;
      }
      pour.visible=!!transfer&&!transfer.solid&&flight>.28&&flight<.70;
      if(pour.visible&&transfer){
        const {from,to}=transfer;
        fromMouth.set(0,from.height,0);from.object.localToWorld(fromMouth);
        toMouth.copy(to.object.position);toMouth.y+=Math.max(.06,to.displayLevel*(to.shape?.[1]??.6));
        direction.subVectors(fromMouth,toMouth);
        pour.position.copy(fromMouth).add(toMouth).multiplyScalar(.5).sub(working.position);
        pour.scale.y=direction.length()/1.1;
        pour.quaternion.setFromUnitVectors(streamAxis,direction.normalize());
        (pour.material as T.MeshStandardMaterial).color.copy(from.tint);
      }
      if(flight>=1)transfer=undefined;
      controls.update();
      const width=canvas.clientWidth,height=canvas.clientHeight;
      for(const item of apparatusMeshes){
        projected.copy(item.object.position);
        projected.z+=.56;
        projected.y+=.04;
        projected.project(camera);
        item.tag.style.visibility=Math.abs(projected.x)>1||Math.abs(projected.y)>1?'hidden':'visible';
        item.tag.style.transform='translate('+((projected.x+1)*width/2)+'px,'+((1-projected.y)*height/2)+'px) translate(-50%, -50%)';
      }
      renderer.render(scene,camera);
    }
    frame=requestAnimationFrame(draw);
    return ()=>{
      disposed=true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      canvas.removeEventListener('pointerdown',down,true);
      canvas.removeEventListener('pointermove',move);
      canvas.removeEventListener('pointerup',end);
      canvas.removeEventListener('pointercancel',end);
      canvas.removeEventListener('lostpointercapture',end);
      overlay.remove();
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
  },[tools,apparatus,materials]);

  return <div className="generated-canvas" ref={host} aria-label="Interactive 3D lab bench">
    {fallback&&<div className="generated-fallback"><LabIcon name={apparatusIcon(props.selected)} size={68}/><p>3D is unavailable. Use the apparatus buttons to continue.</p></div>}
  </div>;
}
