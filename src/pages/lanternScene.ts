export const CONFIG = {
  colors: { night: '#071425', snow: '#7899be', moon: '#a6c8ff', amber: '#ffb26d', mist: '#6895b3' },
  camera: { fov: 43, height: 2.15, pitch: -0.12, plateDepth: 55, maxDpr: 2 },
  moon: { position: [-5, 9, -8], intensity: 0.85 },
  lamp: { position: [-1.75, 0, -6.7], lightHeight: 2.45, intensity: 22, distance: 10 },
  window: { uv: [0.537, 0.93], radius: 0.012, intensity: 0.49 },
  mist: [
    { center: [0.53, 0.70], size: [0.43, 0.22], depth: 46, opacity: 0.24, speed: 0.043 },
    { center: [0.55, 0.80], size: [0.38, 0.31], depth: 37, opacity: 0.18, speed: 0.026 },
    { center: [0.49, 0.55], size: [0.69, 0.20], depth: 27, opacity: 0.12, speed: 0.034 },
  ],
  snow: [
    { count: 110, near: 2, far: 9, size: 0.018, speed: 0.17, opacity: 0.28 },
    { count: 260, near: 8, far: 23, size: 0.034, speed: 0.21, opacity: 0.57 },
    { count: 390, near: 20, far: 46, size: 0.043, speed: 0.25, opacity: 0.48 },
  ],
  timing: { cameraSeconds: 2.5, hintSeconds: 5 },
  post: { focusDistance: 7, focalLength: 0.04 },
} as const

export const plateRatio = 16 / 9
