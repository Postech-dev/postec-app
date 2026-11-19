import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import './BackLink.css'

function BackLink({ to, state, children }: { to: string; state?: unknown; children: string }) {
  return (
    <Link to={to} state={state} className="back-link">
      <ChevronLeft className="back-link-seta" size={14} strokeWidth={1.8} aria-hidden="true" />
      {children}
    </Link>
  )
}

export default BackLink
