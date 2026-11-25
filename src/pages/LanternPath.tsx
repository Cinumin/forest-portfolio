import { Suspense, useMemo, useState, useEffect, useLayoutEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import RoomLoading from '../components/RoomLoading'
import { useRoomAssets } from './roomAssets'
import { Html } from '@react-three/drei/web/Html.js'
import { useGLTF } from '@react-three/drei/core/Gltf.js'
import { useTexture } from '@react-three/drei/core/Texture.js'
import * as THREE from 'three'
import './LanternPath.css'
import artwork from './artwork.json'
import { projects } from '../data/projects'
import { Link, useNavigate, useLocation } from 'react-router-dom'

const CONFIG = {
  snow: { count: 520, speed: .14, size: .009, opacity: .75 },
  lighting: { exposure: .78, lamp: 1.5, shelf: .65, window: .55 },
  camera: { position: [-4.0, 1.42, 4.95], target: [-4.50, 1.23, 7.0], fov: 68 },
  colors: { wall: '#392b32', wood: '#725039', curtain: '#574045', metal: '#34414a', lamp: '#ffcf8c' },
}
function Box({ at, size, color, roughness = .8 }: { at: [number, number, number]; size: [number, number, number]; color: string; roughness?: number }) {
  return <mesh position={at} castShadow receiveShadow><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={roughness} /></mesh>
}
function Projector({ onOpen, url }: { onOpen: () => void; url: string }) {
  const [hovered, setHovered] = useState(false)
  useEffect(() => {
    if (!hovered) return
    document.body.style.cursor = 'pointer'
    return () => { document.body.style.cursor = '' }
  }, [hovered])
  const { scene } = useGLTF(url)
  const model = useMemo(() => {
    const copy = scene.clone()
    copy.rotation.y = -Math.PI / 2
    copy.updateMatrixWorld(true)
    const bounds = new THREE.Box3().setFromObject(copy)
    const size = bounds.getSize(new THREE.Vector3())
    const scale = .48 / size.y
    copy.scale.setScalar(scale)
    copy.position.set(
      -(bounds.min.x + bounds.max.x) * .5 * scale,
      -bounds.min.y * scale,
      -(bounds.min.z + bounds.max.z) * .5 * scale,
    )
    copy.traverse(node => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = true
        node.receiveShadow = true
      }
    })
    return copy
  }, [scene])
  return <group onPointerOver={event => { event.stopPropagation(); setHovered(true) }} onPointerOut={() => setHovered(false)} onClick={event => { event.stopPropagation(); setHovered(false); onOpen() }} position={[-4.14,.77,5.92]} rotation={[0,2.7,0]}><primitive object={model} />
    {hovered && <Html center position={[0,.58,0]} style={{ pointerEvents: 'none' }}>
      <span className="projector-hover-label">Videos</span>
    </Html>}
  </group>
}
function OutsideSnow() {
  const snowMaterial = useRef<THREE.ShaderMaterial>(null)
  const snowStart = useRef(performance.now())
  const particles = useMemo(() => {
    let seed = 1741
    const rand = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296)
    const positions = new Float32Array(CONFIG.snow.count * 3)
    const attributes = new Float32Array(CONFIG.snow.count * 3)
    for (let i = 0; i < CONFIG.snow.count; i++) {
      const depth = rand()
      positions.set([-5.01 + rand() * 1.02, rand(), 7.40 + depth * .014], i * 3)
      attributes.set([depth, rand() * Math.PI * 2, .65 + rand() * .7], i * 3)
    }
    return { positions, attributes }
  }, [])
  const uniforms = useMemo(() => ({
    time: { value: 0 },
    resolution: { value: 900 },
    reduced: { value: 0 },
    speed: { value: CONFIG.snow.speed },
  }), [])
  useFrame(({ clock, gl, size }) => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    uniforms.reduced.value = reduced ? 1 : 0
    const activeUniforms = snowMaterial.current?.uniforms ?? uniforms
    activeUniforms.time.value = reduced ? 0 : (performance.now() - snowStart.current) / 1000
    activeUniforms.reduced.value = reduced ? 1 : 0
    activeUniforms.resolution.value = size.height * gl.getPixelRatio()
    uniforms.resolution.value = size.height * gl.getPixelRatio()
  })
  return <points frustumCulled={false}>
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[particles.positions, 3]} />
      <bufferAttribute attach="attributes-flake" args={[particles.attributes, 3]} />
    </bufferGeometry>
    <shaderMaterial ref={snowMaterial} transparent depthWrite={false} blending={THREE.AdditiveBlending}
      uniforms={uniforms}
      vertexShader={`
        attribute vec3 flake;
        uniform float time, resolution, reduced, speed;
        varying float fade, sparkle, nearDepth;
        void main() {
          nearDepth = 1. - flake.x;
          float travel = fract(position.y - time * speed * (.36 + nearDepth * .5) * flake.z);
          float ground = mix(1.60, .69, nearDepth);
          float top = 2.17;
          vec3 p = vec3(position.x, mix(ground, top, travel), position.z);
          float breeze = sin(time * .18 + flake.y) * .006;
          p.x += (breeze + sin(time * .32 + flake.y * 2.) * .004) * (1. - reduced);
          fade = smoothstep(0., .20, travel) * (1. - smoothstep(.92, 1., travel));
          sparkle = mix(.45, .5 + .5 * sin(time * (.7 + flake.z * .3) + flake.y), 1. - reduced);
          vec4 eye = modelViewMatrix * vec4(p, 1.);
          gl_Position = projectionMatrix * eye;
          gl_PointSize = clamp(resolution / 900. * mix(1.7, 5.2, nearDepth) / max(-eye.z * .32, .8), 1.2, 12.);
        }
      `}
      fragmentShader={`
        varying float fade, sparkle, nearDepth;
        void main() {
          vec2 p = (gl_PointCoord - .5) * 2.;
          // Soft ellipses suggest the short exposure trails in the reference.
          p.x += p.y * .18;
          vec2 shape = p * vec2(mix(1.35, 1.8, nearDepth), .85);
          float density = exp(-dot(shape,shape)*5.);
          float edge = 1. - smoothstep(.70,1.,length(p));
          float visibility = mix(.22,.51,nearDepth);
          float alpha = density * edge * fade * visibility;
          gl_FragColor = vec4(vec3(.83,.89,.94),alpha);
          #include <colorspace_fragment>
        }
      `} />
  </points>
}
function DeskObject({ label, position, color, onOpen }: {
  label: string; position: [number,number,number]; color: string; onOpen: () => void
}) {
  const [hovered,setHovered] = useState(false)
  return <group position={position} onClick={event=>{event.stopPropagation();onOpen()}}
    onPointerOver={event=>{event.stopPropagation();setHovered(true);document.body.style.cursor='pointer'}}
    onPointerOut={()=>{setHovered(false);document.body.style.cursor=''}}>
    <Box at={[0,.02,0]} size={[.31,.04,.23]} color={color} />
    <Box at={[0,.043,0]} size={[.28,.006,.20]} color={label==='Data Analysis'?'#e0d3b8':color} />
    {label==='Data Analysis' && [0,1,2,3].map(i=><Box key={i} at={[-.09+i*.055,.05,.025-i*.01]} size={[.025,.009,.05+i*.025]} color="#456d71" />)}
    {hovered && <Html center position={[0,.13,0]} style={{pointerEvents:'none'}}><span className="projector-hover-label">{label}</span></Html>}
  </group>
}
function ProjectPanel({ category, onClose }: {category: string; onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null)
  useEffect(()=>{
    dialog.current?.showModal()
    if(category==='Artworks' && dialog.current) dialog.current.scrollTop=Number(sessionStorage.getItem('artworkGalleryScroll') || 0)
    return()=>dialog.current?.close()
  },[category])
  const artGroups = [...new Set(artwork.map(item=>item.group))]
  return <dialog ref={dialog} className={'room-project-panel'+(category==='Artworks'?' room-gallery-panel':'')} onCancel={onClose} onClick={event=>{if(event.target===dialog.current)onClose()}}>
    <button onClick={onClose} autoFocus aria-label="Close project panel">×</button>
    <h2>{category}</h2>
    {category==='Artworks' ? <div className="room-art-gallery">
      {artGroups.map(group=><section key={group}>
        <h3>{group}</h3>
        <div className="room-art-grid">{artwork.filter(item=>item.group===group).map(item=><figure key={item.id}>
          <Link to={'/Artworks/'+item.id} state={{artworkGallery: 'room'}} onClick={()=>sessionStorage.setItem('artworkGalleryScroll',String(dialog.current?.scrollTop ?? 0))} aria-label={'View '+item.title+' details'}>
            <img loading="lazy" src={import.meta.env.BASE_URL+'artwork/'+item.id+'-thumb.jpg'} alt={item.alt} width={item.width} height={item.height}/>
          </Link><figcaption>{item.title}</figcaption>
        </figure>)}</div>
      </section>)}
    </div> : projects.filter(project=>project.group===(category==='Code'?'Design & Development':'Data Analysis')).map(project=><article key={project.title}>
      <h3>{project.title}</h3><p>{project.description}</p>
      {'url' in project && <a href={project.url} target="_blank" rel="noreferrer">Open project ↗</a>}
    </article>)}
  </dialog>
}

function Room({ onProjector, onWindow, mode, onCategory, urls }: { urls: string[]; onProjector: () => void; onWindow: () => void; mode: string; onCategory: (category: string) => void }) {
  const [windowHovered,setWindowHovered] = useState(false)
  useEffect(()=>{
    if (!windowHovered) return
    document.body.style.cursor='pointer'
    return()=>{document.body.style.cursor=''}
  },[windowHovered])
  const { scene } = useGLTF(urls[0])
  const texture = useTexture(urls[2])
  texture.colorSpace = THREE.SRGBColorSpace
  const library = useMemo(() => {
    const copy = scene.clone()
    copy.traverse(node => {
      if (/screen/i.test(node.name) || ['Cube249','Cube248','Cube247','Cube239','Cube237',
        'Cube.249','Cube.248','Cube.247','Cube.239','Cube.237'].includes(node.name)) node.visible = false
      if (node instanceof THREE.Mesh) {
        node.castShadow = true
        node.receiveShadow = true
        const materials = Array.isArray(node.material) ? node.material : [node.material]
        if (materials.some(material => /picture/i.test(material.name))) node.visible = false
        const updated = materials.map(material => {
          const copy = material.clone() as THREE.MeshStandardMaterial
          if (/carpet/i.test(copy.name)) {
            copy.map = null
            copy.color.set('#20392c')
            copy.roughness = 1
            copy.metalness = 0
          }
          if (/wood|cedar|soffit/i.test(copy.name)) {
            copy.color.set('#bbad9d')
            copy.roughness = .82
          }
          if (/glass|screen/i.test(copy.name)) {
            copy.transparent = true
            copy.opacity = 0
            copy.depthWrite = false
          }
          return copy
        })
        node.material = Array.isArray(node.material) ? updated : updated[0]
      }
    })
    return copy
  }, [scene])
  const exitStarted = useRef(0)
  useEffect(() => { exitStarted.current = 0 }, [mode])
  useFrame(({ clock }) => {
    if (mode !== 'window') return
    if (!exitStarted.current) exitStarted.current = clock.elapsedTime
    const opacity = 1 - THREE.MathUtils.smoothstep(clock.elapsedTime - exitStarted.current, .5, 2.1)
    library.traverse(node => {
      if (!(node instanceof THREE.Mesh)) return
      const materials = Array.isArray(node.material) ? node.material : [node.material]
      for (const material of materials) {
        material.transparent = true
        if (!/glass|screen/i.test(material.name)) material.opacity = opacity
      }
    })
  })
  return <>
    <primitive object={library} />
    <rectAreaLight position={[-4.5,2.12,6.9]} rotation={[0,Math.PI,0]} width={1.1} height={.12} color="#ffe0b6" intensity={1.8} />
    <ambientLight intensity={.08} color="#c8b9a9" />
    <hemisphereLight args={['#9cb6d3','#493c32',.18]} />
    <pointLight position={[-4.61,1.16,5.81]} intensity={CONFIG.lighting.lamp} color="#ffe1b4" distance={5} decay={2} castShadow shadow-mapSize={[1024,1024]} shadow-normalBias={.012} />
    <pointLight position={[-5.83,1.87,4.07]} intensity={CONFIG.lighting.shelf} color="#ffe1ba" distance={5} />
    <pointLight position={[-4.5,2.2,6.8]} intensity={CONFIG.lighting.window} color="#b3cffa" distance={5} />
    <mesh onClick={onWindow} position={[-4.5,1.41,7.43]} rotation={[0,Math.PI,0]}>
      <planeGeometry args={[2.844,1.60]} /><meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
    {windowHovered && <Html center position={[-4.5,1.8,7.30]} style={{pointerEvents:'none'}}>
      <span className="projector-hover-label">Home</span>
    </Html>}
    <OutsideSnow />
    <mesh position={[-4.5,1.41,7.37]} rotation={[0,Math.PI,0]}
      onPointerOver={event=>{event.stopPropagation();setWindowHovered(true)}}
      onPointerOut={()=>setWindowHovered(false)}
      onClick={()=>{setWindowHovered(false);onWindow()}}>
      <planeGeometry args={[1.08,1.5]} />
      <shaderMaterial transparent depthWrite={false}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv=uv;
            gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
          void main() {
            float edgeDistance=min(min(vUv.x,1.-vUv.x),min(vUv.y,1.-vUv.y));
            float edge=1.-smoothstep(.015,.21,edgeDistance);
            float bottom=1.-smoothstep(0.,.37,vUv.y);
            float corner=bottom*pow(abs(vUv.x-.5)*2.,2.);
            float fog=.018+edge*.12+corner*.09;
            vec2 cells=vUv*vec2(43.,65.);
            vec2 id=floor(cells);
            vec2 local=fract(cells)-.5;
            float seed=hash(id);
            vec2 offset=vec2(hash(id+1.),hash(id+3.))*.36-.18;
            vec2 p=(local-offset)*vec2(1.,.65);
            float r=length(p);
            float drop=(1.-smoothstep(.065,.12,r))*step(.94,seed);
            float rim=exp(-pow((r-.11)*55.,2.))*step(.94,seed);
            float droplets=(drop*.045+rim*.13)*(.2+edge*.8);
            float grain=(hash(floor(vUv*800.))-.5)*edge*.015;
            gl_FragColor=vec4(vec3(.58,.70,.76),clamp(fog+droplets+grain,0.,.3));
            #include <colorspace_fragment>
          }
        `} />
    </mesh>
    <Projector url={urls[1]} onOpen={onProjector} />
    <DeskObject label="Code" position={[-4.75,.81,5.93]} color="#3e5144" onOpen={()=>onCategory('Code')} />
    <DeskObject label="Data Analysis" position={[-4.63,.81,6.30]} color="#c8b99b" onOpen={()=>onCategory('Data Analysis')} />
    <DeskObject label="Artworks" position={[-3.66,.81,6.15]} color="#783f37" onOpen={()=>onCategory('Artworks')} />
  </>
}
const videos = [
  { title: 'Garden Study', file: 'garden-study-4k' },
  { title: 'Washington DC', file: 'washington-dc-720' },
  { title: 'The Beauty of Still Shots', file: 'still-shots-hd' },
  { title: 'Museum Study', file: 'museum-study-landscape' },
  { title: 'Orchard Study', file: 'orchard-study-4k' },
]

function CameraMove({ mode, onArrive, pan }: { mode: string; onArrive: () => void; pan: number }) {
  const start = useRef(0)
  const origin = useRef(new THREE.Vector3())
  const look = useRef(new THREE.Vector3(...CONFIG.camera.target as [number,number,number]))
  useEffect(() => { start.current = 0 }, [mode])
  useFrame(({ camera, clock }) => {
    if (!start.current) { start.current = clock.elapsedTime; origin.current.copy(camera.position) }
    const t = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : Math.min(1,(clock.elapsedTime-start.current)/2.5)
    const eased = t*t*(3-2*t)
    const destination = mode === 'window' ? new THREE.Vector3(-4.5,1.65,7.30)
      : mode === 'video' ? new THREE.Vector3(-4.15,1.42,5.3)
      : new THREE.Vector3(...CONFIG.camera.position as [number,number,number])
    const target = mode === 'video' ? new THREE.Vector3(-2.79,1.43,5.55)
      : mode === 'window' ? new THREE.Vector3(-4.5,1.65,9)
      : new THREE.Vector3(...CONFIG.camera.target as [number,number,number])
    if (mode === 'room' && matchMedia('(max-width: 700px)').matches) {
      const direction = target.clone().sub(destination).applyAxisAngle(new THREE.Vector3(0,1,0),pan)
      target.copy(destination).add(direction)
    }
    camera.position.lerpVectors(origin.current,destination,eased)
    look.current.lerp(target,Math.min(1,.065 + eased*.1))
    camera.lookAt(look.current)
    if (mode === 'window' && t === 1) onArrive()
  })
  return null
}
function Projection({ video, onExpand }: { video: HTMLVideoElement; onExpand: () => void }) {
  const canvas = useMemo(() => {
    const value = document.createElement('canvas')
    value.width = 1280; value.height = 720
    return value
  }, [])
  const texture = useMemo(() => new THREE.CanvasTexture(canvas),[canvas])
  const material = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(() => ({ film: { value: texture }, time: { value: 0 } }), [texture])
  useEffect(() => () => texture.dispose(),[texture])
  useFrame(({ clock }) => {
    const context = canvas.getContext('2d')!
    context.fillStyle = '#000'
    context.fillRect(0,0,1280,720)
    if (video.readyState >= 2 && video.videoWidth) {
      const scale = Math.min(1280/video.videoWidth,720/video.videoHeight)
      const w = video.videoWidth*scale, h=video.videoHeight*scale
      context.drawImage(video,(1280-w)/2,(720-h)/2,w,h)
      texture.needsUpdate = true
    }
    uniforms.time.value = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : clock.elapsedTime
  })
  const beam = useMemo(() => {
    const source = new THREE.Vector3(-4.14,1.06,5.92)
    const destination = new THREE.Vector3(-2.79,1.43,5.55)
    const direction = source.clone().sub(destination)
    return {
      position: source.clone().add(destination).multiplyScalar(.5),
      rotation: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize()),
      length: direction.length(),
    }
  },[])
  return <>
    <mesh onClick={onExpand} position={[-2.79,1.43,5.55]} rotation={[0,-Math.PI/2,0]}>
      <planeGeometry args={[1.65,.928]} />
      <shaderMaterial ref={material} uniforms={uniforms} transparent depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
        fragmentShader={`
          uniform sampler2D film; uniform float time; varying vec2 vUv;
          void main(){
            vec2 uv=vUv;
            vec3 image=texture2D(film,uv).rgb;
            float edge=smoothstep(0.,.025,uv.x)*smoothstep(0.,.025,1.-uv.x)*smoothstep(0.,.035,uv.y)*smoothstep(0.,.035,1.-uv.y);
            float grain=fract(sin(dot(floor(uv*1200.),vec2(12.9898,78.233)))*43758.5453);
            float illumination=.84+.018*sin(time*2.);
            vec3 color=image*vec3(1.,.94,.83)*illumination*(.96+grain*.06);
            gl_FragColor=vec4(color,edge*.83);
            #include <colorspace_fragment>
          }`} />
    </mesh>
    <mesh position={beam.position} quaternion={beam.rotation}>
      <coneGeometry args={[.64,beam.length,48,1,true]} />
      <meshBasicMaterial color="#f1d6a1" transparent opacity={.003} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
    </mesh>
    <pointLight position={[-2.95,1.43,5.55]} color="#e1d4b8" intensity={.015} distance={1.2} />
  </>
}
function RoomReady({ onReady }: { onReady: () => void }) {
  useLayoutEffect(() => { onReady() }, [onReady])
  return null
}
export default function LanternPath() {
  const [mode,setMode] = useState('room')
  const [pan,setPan] = useState(0)
  const gesture = useRef({ x:0, pan:0, dragging:false, moved:false })
  const [ready,setReady] = useState(false)
  const { progress, urls, error } = useRoomAssets()

  const location = useLocation()
  const [category,setCategory] = useState<string | null>(()=>new URLSearchParams(location.search).get('gallery')==='artworks'?'Artworks':null)
  const [expanded,setExpanded] = useState(false)
  const [index,setIndex] = useState(0)
  const navigate = useNavigate()
  const video = useMemo(() => {
    const element = document.createElement('video')
    element.muted = false; element.loop = true; element.playsInline = true
    element.preload = 'auto'
    element.src = import.meta.env.BASE_URL + 'project-media/garden-study-preview.mp4'
    return element
  },[])
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('portfolio-projector-playback', { detail: mode === 'video' || expanded }))
    return () => { window.dispatchEvent(new CustomEvent('portfolio-projector-playback', { detail: false })) }
  }, [mode, expanded])
  useEffect(() => {
    const file = index === 0 ? 'garden-study-preview' : videos[index].file
    const source = new URL(import.meta.env.BASE_URL + 'project-media/' + file + '.mp4', window.location.href).href
    if (video.src !== source) video.src = source
    if (mode === 'video' && !expanded) void video.play().catch(() => {})
    return () => video.pause()
  },[index,mode,video,expanded])
  function openProjector() {
    const source = new URL(import.meta.env.BASE_URL + 'project-media/garden-study-preview.mp4',window.location.href).href
    if (video.src !== source) video.src = source
    setIndex(0)
    setMode('video')
    void video.play().catch(()=>{})
  }
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setExpanded(false); setCategory(null); setMode('room') }
      if (mode === 'video' && event.key === 'ArrowRight') setIndex(i=>(i+1)%videos.length)
      if (mode === 'video' && event.key === 'ArrowLeft') setIndex(i=>(i+videos.length-1)%videos.length)
    }
    window.addEventListener('keydown',close)
    return () => window.removeEventListener('keydown',close)
  },[mode])
  return <main className="room-viewport" aria-busy={!ready}
    onTouchStart={event=>{
      if (mode !== 'room' || !(event.target instanceof HTMLCanvasElement) || event.touches.length!==1) return
      gesture.current={x:event.touches[0].clientX,pan,dragging:true,moved:false}
    }}
    onTouchMove={event=>{
      if (!gesture.current.dragging || event.touches.length!==1) return
      const delta=event.touches[0].clientX-gesture.current.x
      if (Math.abs(delta)>8) gesture.current.moved=true
      setPan(THREE.MathUtils.clamp(gesture.current.pan+delta/window.innerWidth*1.7,-1.05,1.05))
    }}
    onTouchEnd={()=>{gesture.current.dragging=false}}
    onTouchCancel={()=>{gesture.current.dragging=false}}
    onClickCapture={event=>{
      if (gesture.current.moved && event.target instanceof HTMLCanvasElement) {
        event.stopPropagation()
        gesture.current.moved=false
      }
    }}>
    {!ready && <RoomLoading progress={progress} failed={error} />}
    {mode === 'window' && <div className="window-exit-blend" style={{backgroundImage: `url(${import.meta.env.BASE_URL}art/01-window-view.png)`}} />} 
    <Canvas gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: CONFIG.lighting.exposure }} shadows dpr={[1,matchMedia('(pointer: coarse)').matches ? 1.25 : 1.75]} camera={{position:CONFIG.camera.position as [number,number,number],fov:CONFIG.camera.fov}}>
      <color attach="background" args={['#16151b']} />
      <CameraMove pan={pan} mode={mode} onArrive={()=>navigate('/')} />
      {urls && <Suspense fallback={null}><RoomReady onReady={()=>setReady(true)} /><Room urls={urls} onCategory={setCategory} mode={mode} onProjector={openProjector} onWindow={()=>setMode('window')} /></Suspense>}
      {mode === 'video' && <Projection video={video} onExpand={()=>{video.pause();setExpanded(true)}} />}
    </Canvas>
    {mode === 'video' && <div className="projection-controls">
      <button onClick={()=>setIndex(i=>(i+videos.length-1)%videos.length)} aria-label="Previous video">←</button>
      <span className="projection-title" aria-live="polite">{videos[index].title}</span>
      <button onClick={()=>setIndex(i=>(i+1)%videos.length)} aria-label="Next video">→</button>
      <button aria-label="Original video" onClick={()=>setExpanded(true)}><span className="nav-full">Original video</span><span className="nav-compact">Original</span></button>
      <button aria-label="Return to room" onClick={()=>setMode('room')}><span className="nav-full">Return to room</span><span className="nav-compact">Room</span></button>
    </div>}
    {category && <ProjectPanel category={category} onClose={()=>setCategory(null)} />}
    {expanded && <div className="original-video" role="dialog" aria-modal="true" aria-label={videos[index].title}>
      <button autoFocus onClick={()=>setExpanded(false)}>Back to projection</button>
      <video key={index} controls autoPlay playsInline src={import.meta.env.BASE_URL+'project-media/'+videos[index].file+'.mp4'} />
    </div>}
    <details className="room-browse-menu">
      <summary>Browse projects</summary>
      <nav aria-label="Projects">
        <Link to="/Gallery">All projects</Link>
        <button onClick={event=>{openProjector();event.currentTarget.closest('details')?.removeAttribute('open')}}>Videos</button>
        {['Code','Data Analysis','Artworks'].map(label=><button key={label} onClick={event=>{setCategory(label);event.currentTarget.closest('details')?.removeAttribute('open')}}>{label}</button>)}
      </nav>
    </details>
    {mode==='room' && <p className="room-swipe-hint">Swipe to look around · Tap objects to explore</p>}
    <button className="room-projector-access" onClick={openProjector}>Play projector</button>
    <button className="room-window-access" onClick={()=>setMode('window')}>Enter forest</button>
  </main>
}
