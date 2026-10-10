import type { StatusOcorrencia } from '../../types'
import './EsteiraProgresso.css'

// etapas simplificadas para a esteira (Reenvio e Estorno viram uma)
const ETAPAS: { rotulo: string; status: StatusOcorrencia[] }[] = [
  { rotulo: 'Novo',                status: ['Novo'] },
  { rotulo: 'Em triagem',          status: ['Em triagem'] },
  { rotulo: 'Aguardando devolução', status: ['Aguardando devolução'] },
  { rotulo: 'Reenvio / Estorno',   status: ['Reenvio solicitado', 'Estorno solicitado'] },
  { rotulo: 'Concluído',           status: ['Concluído'] },
]

function indiceEtapa(status: StatusOcorrencia): number {
  return ETAPAS.findIndex((e) => e.status.includes(status))
}

function EsteiraProgresso({ status }: { status: StatusOcorrencia }) {
  const atual = indiceEtapa(status)
  const proxima = ETAPAS[atual + 1]

  return (
    <>
      {/* desktop: faixa horizontal */}
      <nav className="esteira" aria-label="Progresso da ocorrência">
        {ETAPAS.map((etapa, i) => {
          const feita = i < atual
          const ativa = i === atual
          const opcional = etapa.rotulo === 'Aguardando devolução'
          return (
            <div
              key={etapa.rotulo}
              className={[
                'esteira-etapa',
                feita ? 'esteira-feita' : '',
                ativa ? 'esteira-ativa' : '',
                opcional ? 'esteira-opcional' : '',
              ].filter(Boolean).join(' ')}
              aria-current={ativa ? 'step' : undefined}
            >
              <span className="esteira-bolinha" aria-hidden="true">
                {feita ? '✓' : i + 1}
              </span>
              <span className="esteira-rotulo">{etapa.rotulo}</span>
              {i < ETAPAS.length - 1 && <span className="esteira-linha" aria-hidden="true" />}
            </div>
          )
        })}
      </nav>

      {/* mobile: texto compacto */}
      <p className="esteira-mobile">
        <strong>Etapa atual:</strong> {status}
        {proxima && <> · <strong>Próxima:</strong> {proxima.rotulo}</>}
      </p>
    </>
  )
}

export default EsteiraProgresso
