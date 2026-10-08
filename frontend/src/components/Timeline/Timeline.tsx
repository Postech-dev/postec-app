import './Timeline.css'

export interface PassoTimeline {
  rotulo: string
  estado: 'feito' | 'atual' | 'futuro'
  // texto de apoio sob o rótulo (hora, o que está acontecendo)
  detalhe?: string
}

const marcas = { feito: '✓', atual: '●', futuro: '○' }
const falas = { feito: 'concluído', atual: 'etapa atual', futuro: 'próxima etapa' }

function Timeline({ passos }: { passos: PassoTimeline[] }) {
  return (
    <ol className="timeline">
      {passos.map((p) => (
        <li key={p.rotulo} className={`timeline-${p.estado}`} aria-current={p.estado === 'atual' ? 'step' : undefined}>
          <span className="timeline-marca" aria-hidden="true">
            {marcas[p.estado]}
          </span>
          <span className="timeline-texto">
            <strong>{p.rotulo}</strong>
            <span className="so-leitor"> ({falas[p.estado]})</span>
            {p.detalhe && <span className="timeline-detalhe">{p.detalhe}</span>}
          </span>
        </li>
      ))}
    </ol>
  )
}

export default Timeline
