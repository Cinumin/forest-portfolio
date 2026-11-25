import { useEffect, useState } from 'react'

type State = { progress: number; urls: string[] | null; error: boolean }
let state: State = { progress: 0, urls: null, error: false }
let pending: Promise<void> | undefined
const subscribers = new Set<(value: State) => void>()
const publish = (value: State) => {
  state = value
  subscribers.forEach(listener => listener(value))
}

async function downloadRoom() {
  const files = ['models/library-web.glb','models/projector-web.glb','art/window-view-web.webp']
  const loaded = [0,0,0]
  const totals = [0,0,0]
  try {
    const urls = await Promise.all(files.map(async (file,index) => {
      const response = await fetch(import.meta.env.BASE_URL + file)
      if (!response.ok) throw new Error('Room asset failed')
      totals[index] = Number(response.headers.get('content-length')) || 0
      const reader = response.body?.getReader()
      if (!reader) return URL.createObjectURL(await response.blob())
      const chunks: Uint8Array<ArrayBuffer>[] = []
      while (true) {
        const result = await reader.read()
        if (result.done) break
        chunks.push(new Uint8Array(result.value))
        loaded[index] += result.value.byteLength
        const total = totals.reduce((a,b)=>a+b,0)
        // Hold the final few percent for parsing and GPU preparation.
        const progress = totals.every(Boolean) ? Math.min(95,loaded.reduce((a,b)=>a+b,0)/total*95) : 0
        publish({ progress: Math.max(state.progress,progress), urls: null, error: false })
      }
      return URL.createObjectURL(new Blob(chunks,{type:file.endsWith('webp')?'image/webp':'model/gltf-binary'}))
    }))
    publish({ progress: 96, urls, error: false })
  } catch {
    publish({ ...state, error: true })
    pending = undefined
  }
}

export function useRoomAssets() {
  const [value,setValue] = useState(state)
  useEffect(()=>{
    subscribers.add(setValue)
    setValue(state)
    if (!pending && !state.urls) pending = downloadRoom()
    return ()=>{subscribers.delete(setValue)}
  },[])
  return value
}
