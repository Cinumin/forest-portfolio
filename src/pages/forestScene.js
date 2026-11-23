import * as T from 'three'

const trailX = z => Math.sin(z * .065) * 4.7 + Math.sin(z * .028) * 3.3
const terrain = (x, z) => .15 * Math.sin(z * .14) + Math.min(1, Math.abs(x - trailX(z)) / 8) * (.32 * Math.sin(x * .41 + z * .18))
const range = (a, b) => a + Math.random() * (b - a)
const clamp = T.MathUtils.clamp

export function createForest(host, count, onSelect, onTravel) {
  const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65))
  renderer.setClearColor(0x081425)
  const canvas = renderer.domElement
  canvas.tabIndex = 0
  canvas.setAttribute('aria-label', 'Snowy forest. Drag to look and use W or S to walk.')
  host.append(canvas)
  const scene = new T.Scene()
  scene.fog = new T.FogExp2(0x0b1d32, .035)
  const camera = new T.PerspectiveCamera(63, 1, .1, 120)
  const materials = []
  const paint = options => {
    const m = new T.MeshStandardMaterial(options)
    materials.push(m)
    return m
  }
  const bark = paint({ color: 0x162638, roughness: 1 })
  const needles = paint({ color: 0x193644, flatShading: true })
  const crown = paint({ color: 0x334a42, flatShading: true })
  const snow = paint({ color: 0x9ebcd7, roughness: .85, flatShading: true })
  const light = paint({ color: 0xffdba5, emissive: 0xffaa56, emissiveIntensity: 1.7 })
  const trail = paint({ color: 0x86a5c0, roughness: 1, side: T.DoubleSide })
  const meshes = (geometry, material, amount) => {
    const mesh = new T.InstancedMesh(geometry, material, amount)
    mesh.count = 0
    scene.add(mesh)
    return mesh
  }
  const dummy = new T.Object3D()
  const inst = (mesh, x, y, z, sx, sy, sz, rotation = 0, tilt = 0) => {
    dummy.position.set(x, y, -z)
    dummy.scale.set(sx, sy, sz)
    dummy.rotation.set(0, rotation, tilt)
    dummy.updateMatrix()
    mesh.setMatrixAt(mesh.count++, dummy.matrix)
  }
  const trunks = meshes(new T.CylinderGeometry(.67, 1, 1, 7), bark, 1200)
  const evergreen = meshes(new T.ConeGeometry(1, 1, 7), needles, 1000)
  const dust = meshes(new T.ConeGeometry(1, 1, 7), snow, 1000)
  const leaves = meshes(new T.IcosahedronGeometry(1, 0), crown, 900)
  const pebbles = meshes(new T.IcosahedronGeometry(1, 0), bark, 130)
  for (let i = 0; i < 255; i++) {
    const z = range(-6, 112), side = i % 2 ? 1 : -1
    const x = trailX(z) + side * range(3.5, 31), y = terrain(x, z), h = range(4, 13)
    const trunk = range(.13, .45), angle = range(-.12, .12)
    inst(trunks, x, y + h / 2, z, trunk, h, trunk, 0, angle)
    if (i % 3) {
      for (let j = 0; j < 4; j++) {
        const radius = (1.24 - j * .2) * h / 5, height = h * .45, level = y + h * (.43 + j * .14)
        const turn = i * 1.3 + j * .7
        inst(evergreen, x, level, z, radius, height, radius, turn)
        inst(dust, x, level + h * .039, z, radius * .89, height * .93, radius * .89, turn)
      }
    } else {
      for (let j = 0; j < 4; j++) {
        const side = j % 2 ? 1 : -1, level = y + h * (.62 + j * .085)
        inst(trunks, x + side * h * .104, level, z + j * .35, trunk * .5, h * .37, trunk * .5, j, -side * .91)
        inst(leaves, x + side * h * .20, level + h * .14, z + j * .31, h * .23, h * .11, h * .18, j)
      }
    }
  }
  const ground = new T.PlaneGeometry(94, 150, 72, 100)
  ground.rotateX(-Math.PI / 2)
  ground.translate(0, 0, -59)
  const vertices = ground.getAttribute('position')
  const colors = []
  const shade = new T.Color()
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), z = -vertices.getZ(i)
    vertices.setY(i, terrain(x, z))
    shade.setRGB(.31 + .04 * Math.sin(z * .55), .43 + .05 * Math.cos(x * .41 + z), .59 + .06 * Math.sin(x * .44 + z * .39))
    colors.push(shade.r, shade.g, shade.b)
  }
  ground.setAttribute('color', new T.Float32BufferAttribute(colors, 3))
  ground.computeVertexNormals()
  scene.add(new T.Mesh(ground, paint({ vertexColors: true, roughness: 1 })))
  const path = []
  for (let z = -8; z < 103; z += .65) {
    const edge = (t, side) => {
      const x = trailX(t) + side * (2.35 + .18 * Math.sin(t * .64 + side))
      return [x, terrain(x, t) + .025, -t]
    }
    const a = edge(z, -1), b = edge(z, 1), c = edge(z + .65, -1), d = edge(z + .65, 1)
    path.push(...a, ...b, ...c, ...b, ...d, ...c)
  }
  const pathGeometry = new T.BufferGeometry()
  pathGeometry.setAttribute('position', new T.Float32BufferAttribute(path, 3))
  pathGeometry.computeVertexNormals()
  scene.add(new T.Mesh(pathGeometry, trail))
  for (let i = 0; i < 86; i++) {
    const z = i * .93, x = trailX(z) + (i % 2 ? .29 : -.29)
    inst(pebbles, x, terrain(x, z) + .029, z, .13, .012, .24, i % 2 ? .12 : -.12)
  }
  scene.add(new T.HemisphereLight(0x93c3f9, 0x132d53, 2.2))
  const moon = new T.DirectionalLight(0xb6d7fe, 1.65)
  moon.position.set(-8, 12, -18)
  scene.add(moon)
  const stations = Array.from({ length: count }, (_, i) => 9 + i * 12)
  const pins = stations.map((z, index) => {
    const side = index % 2 ? -1 : 1, x = trailX(z) + side * 2.48, y = terrain(x, z)
    inst(trunks, x, y + .86, z, .085, 1.72, .085)
    const marker = new T.Mesh(new T.BoxGeometry(.30, .42, .30), light)
    marker.position.set(x, y + 1.8, -z)
    marker.userData.station = index
    scene.add(marker)
    const lamp = new T.PointLight(0xffb466, 70, 8, 2)
    lamp.position.copy(marker.position)
    scene.add(lamp)
    return marker
  })
  // A wheel and roof at the bend echo the landmark in the painting.
  const landmarkZ = 88, landmarkX = trailX(landmarkZ) - 3.6
  const landmarkGround = terrain(landmarkX, landmarkZ)
  const addMesh = (geometry, material, x, y, z) => {
    const mesh = new T.Mesh(geometry, material)
    mesh.position.set(x, y, -z)
    scene.add(mesh)
    return mesh
  }
  const cabin = paint({ color: 0x202e3c, roughness: 1 })
  const rim = paint({ color: 0x536b7f, roughness: .9, metalness: .1 })
  addMesh(new T.BoxGeometry(3.9, 2.7, 3.0), cabin, landmarkX, landmarkGround + 1.35, landmarkZ + 1.9)
  const roof = addMesh(new T.CylinderGeometry(0, 3, 1.4, 4), snow, landmarkX, landmarkGround + 3.2, landmarkZ + 1.9)
  roof.rotation.y = Math.PI / 4
  addMesh(new T.TorusGeometry(1.15, .085, 6, 22), rim, landmarkX, landmarkGround + 1.25, landmarkZ + .21)
  for (let i = 0; i < 4; i++) {
    const spoke = addMesh(new T.BoxGeometry(.075, 2.25, .075), rim, landmarkX, landmarkGround + 1.25, landmarkZ + .21)
    spoke.rotation.z = i * Math.PI / 4
  }
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  const flakes = new Float32Array(690 * 3)
  for (let i = 0; i < flakes.length; i += 3) {
    flakes[i] = range(-22, 22); flakes[i + 1] = range(.4, 13); flakes[i + 2] = range(-102, 7)
  }
  const flakeGeometry = new T.BufferGeometry()
  flakeGeometry.setAttribute('position', new T.BufferAttribute(flakes, 3))
  const crystal = new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { time: { value: 0 }, ratio: { value: renderer.getPixelRatio() } },
    vertexShader: `uniform float time;uniform float ratio;varying float glint;void main(){vec3 p=position;p.y=mod(p.y-time*(.38+.24*sin(p.x)),13.0);p.x+=.2*sin(time+p.z);vec4 mv=modelViewMatrix*vec4(p,1.0);glint=pow(.5+.5*sin(time*2.8+position.x*8.0+position.z),5.0);gl_PointSize=ratio*clamp(35.0/max(1.0,-mv.z),1.5,8.5);gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `varying float glint;void main(){vec2 p=abs(gl_PointCoord-.5);float core=1.0-smoothstep(.03,.24,length(p));float arms=(1.0-smoothstep(.02,.105,min(p.x,p.y)))*(1.0-smoothstep(.10,.5,max(p.x,p.y)));gl_FragColor=vec4(.67,.85,1.,(core*.52+arms*glint*.77)*(.54+glint*.46));}`,
  })
  materials.push(crystal)
  scene.add(new T.Points(flakeGeometry, crystal))

  let z = 1, target = 1, yaw = 0, pitch = 0, active = 0, frame, last = performance.now()
  let drag = null
  const keys = new Set()
  const nearest = () => {
    const i = clamp(Math.round((z + 4.3 - stations[0]) / 12), 0, stations.length - 1)
    if (i !== active) { active = i; onSelect(i) }
  }
  const resize = () => {
    const { clientWidth: width, clientHeight: height } = host
    camera.aspect = width / Math.max(1, height)
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
  }
  const observer = new ResizeObserver(resize)
  observer.observe(host)
  resize()
  const down = event => {
    canvas.focus()
    drag = { x: event.clientX, y: event.clientY, traveled: 0 }
    canvas.setPointerCapture(event.pointerId)
  }
  const move = event => {
    if (!drag) return
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y
    yaw -= dx * .0045; pitch = clamp(pitch - dy * .004, -.65, .65)
    drag = { x: event.clientX, y: event.clientY, traveled: drag.traveled + Math.abs(dx) + Math.abs(dy) }
  }
  const seek = index => {
    active = clamp(index, 0, stations.length - 1)
    onSelect(active)
    target = stations[active] - 4.3
    yaw = active % 2 ? .19 : -.19
    pitch = 0
  }
  const up = event => {
    if (drag && drag.traveled < 6) {
      const rect = canvas.getBoundingClientRect()
      const ray = new T.Raycaster()
      ray.setFromCamera(new T.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2), camera)
      const hit = ray.intersectObjects(pins)[0]
      if (hit) seek(hit.object.userData.station)
    }
    drag = null
  }
  const cancel = () => { drag = null; keys.clear() }
  const allowed = ['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright']
  const keydown = event => {
    const key = event.key.toLowerCase()
    if (allowed.includes(key)) { keys.add(key); event.preventDefault() }
  }
  const keyup = event => keys.delete(event.key.toLowerCase())
  const bindings = [['pointerdown',down], ['pointermove',move], ['pointerup',up], ['pointercancel',cancel], ['keydown',keydown], ['keyup',keyup], ['blur',cancel]]
  for (const [type, listener] of bindings) canvas.addEventListener(type, listener)
  function draw(now) {
    const dt = Math.min((now - last) / 1000, .045)
    last = now
    const moveAlong = Number(keys.has('w') || keys.has('arrowup')) - Number(keys.has('s') || keys.has('arrowdown'))
    const turn = Number(keys.has('a') || keys.has('arrowleft')) - Number(keys.has('d') || keys.has('arrowright'))
    if (moveAlong) { z = clamp(z + moveAlong * dt * 6, 0, 90); target = z; nearest() }
    else z = motion.matches ? target : T.MathUtils.damp(z, target, 3.6, dt)
    yaw -= turn * dt * 1.2
    const x = trailX(z), bearing = Math.atan2(trailX(z + 5) - x, 5)
    camera.position.set(x, terrain(x, z) + 1.67, -z)
    camera.rotation.order = 'YXZ'
    camera.rotation.set(pitch, yaw - bearing, 0)
    crystal.uniforms.time.value = motion.matches ? 0 : now / 1000
    onTravel(z)
    renderer.render(scene, camera)
    frame = requestAnimationFrame(draw)
  }
  frame = requestAnimationFrame(draw)
  return {
    seek,
    destroy() {
      cancelAnimationFrame(frame)
      observer.disconnect()
      for (const [type, listener] of bindings) canvas.removeEventListener(type, listener)
      const geometry = new Set()
      scene.traverse(node => { if (node.geometry) geometry.add(node.geometry); if (node.isInstancedMesh) node.dispose() })
      for (const g of geometry) g.dispose()
      for (const material of materials) material.dispose()
      renderer.dispose()
      canvas.remove()
    },
  }
}
