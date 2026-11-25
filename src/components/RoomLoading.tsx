import { Link } from 'react-router-dom'
import './RoomLoading.css'

export default function RoomLoading({ progress, failed = false, leaving = false }: { progress?: number; failed?: boolean; leaving?: boolean }) {
  return <div className={'room-loading'+(leaving ? ' room-loading-leaving' : '')} role="status" aria-live="polite">
    <div>
      <p>{failed ? 'The room could not finish loading.' : 'Entering the room…'}</p>
      {!failed && <progress aria-label="Room loading" max="100" value={progress} />}
      <Link to="/Gallery">View all projects</Link>
    </div>
  </div>
}
