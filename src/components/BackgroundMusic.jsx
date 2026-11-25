import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

const AUDIO = {
  musicVolume: .30,
  homeAmbienceVolume: .16,
  roomAmbienceVolume: .10,
}

export default function BackgroundMusic() {
  const { pathname } = useLocation()
  const [enabled, setEnabled] = useState(false)
  const [projecting, setProjecting] = useState(false)
  const music = useRef(null)
  const ambience = useRef(null)
  const allowed = pathname === '/' || pathname === '/Projects'
  const playing = enabled && allowed && !projecting

  function startAudio() {
    music.current.volume = AUDIO.musicVolume
    ambience.current.volume = pathname === '/Projects'
      ? AUDIO.roomAmbienceVolume : AUDIO.homeAmbienceVolume
    void music.current.play().catch(() => {})
    void ambience.current.play().catch(() => {})
  }

  useEffect(() => {
    const update = event => setProjecting(event.detail)
    window.addEventListener('portfolio-projector-playback', update)
    return () => window.removeEventListener('portfolio-projector-playback', update)
  }, [])

  useEffect(() => {
    music.current.volume = AUDIO.musicVolume
    ambience.current.volume = pathname === '/Projects'
      ? AUDIO.roomAmbienceVolume : AUDIO.homeAmbienceVolume
    if (playing) {
      void music.current.play().catch(() => {})
      void ambience.current.play().catch(() => {})
    } else {
      music.current.pause()
      ambience.current.pause()
    }
  }, [playing, pathname])

  return <aside className="background-music" style={{ display: allowed && !projecting ? undefined : 'none' }}>
    <audio ref={music} src={import.meta.env.BASE_URL+'audio/tinker-bell-prologue.mp3'} loop preload="metadata" />
    <audio ref={ambience} src={import.meta.env.BASE_URL+'audio/forest-ambience.mp3'} loop preload="metadata" />
    <button aria-label={enabled ? 'Turn sound off' : 'Turn sound on'}
      title={enabled ? 'Turn sound off' : 'Turn sound on'}
      aria-pressed={enabled} onClick={() => {
        if (!enabled && allowed && !projecting) startAudio()
        setEnabled(value => !value)
      }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M4 9h4l5-4v14l-5-4H4z"/>
        {enabled ? <path d="M16 8q5 4 0 8M19 5q8 7 0 14"/> : <path d="m17 9 5 6m0-6-5 6"/>}
      </svg>
    </button>
  </aside>
}
