import { Link } from 'react-router-dom'
import './BackLink.css'

function BackLink({ to, state, children }: { to: string; state?: unknown; children: string }) {
  return (
    <Link to={to} state={state} className="back-link">
      <svg className="back-link-seta" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M10 3L5 8l5 5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {children}
    </Link>
  )
}

export default BackLink
