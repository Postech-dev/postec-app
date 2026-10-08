import { Link } from 'react-router-dom'
import './BackLink.css'

function BackLink({ to, state, children }: { to: string; state?: unknown; children: string }) {
  return (
    <Link to={to} state={state} className="back-link">
      ← {children}
    </Link>
  )
}

export default BackLink
