import { NavLink } from 'react-router-dom'
import './ViewToggle.css'

function ViewToggle() {
  return (
    <div className="view-toggle">
      <NavLink to="/ocorrencias" end className={({ isActive }) => (isActive ? 'view-ativo' : '')}>
        Tabela
      </NavLink>
      <NavLink to="/ocorrencias/kanban" className={({ isActive }) => (isActive ? 'view-ativo' : '')}>
        Kanban
      </NavLink>
    </div>
  )
}

export default ViewToggle
