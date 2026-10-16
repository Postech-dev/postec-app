import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDados } from '../../hooks/useDados'
import { useToast } from '../../hooks/useToast'
import { conectarNuvemshop, desconectarNuvemshop, sincronizarNuvemshop, statusNuvemshop } from '../../services/integracoes.service'
import { formatarData } from '../../utils/format'
import Button from '../Button/Button'
import Card from '../Card/Card'
import ErroCarregamento from '../ErroCarregamento/ErroCarregamento'
import './IntegracaoNuvemshop.css'

function IntegracaoNuvemshop() {
  const { mostrar } = useToast()
  const { dados: status, setDados, erro, tentarDeNovo } = useDados(statusNuvemshop)
  const [acao, setAcao] = useState('')
  const [erroAcao, setErroAcao] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [params] = useSearchParams()
  const retorno = params.get('nuvemshop')

  useEffect(() => {
    if (!status?.conectada) return
    let ativo = true
    const timer = setInterval(() => {
      if (!document.hidden) statusNuvemshop().then(s => { if (ativo) setDados(s) })
        .catch(() => { if (ativo) setErroAcao('Não conseguimos atualizar o status. Tente atualizar a página.') })
    }, 5000)
    return () => { ativo = false; clearInterval(timer) }
  }, [status?.conectada, setDados])

  async function executar(tipo: 'conectar' | 'sincronizar' | 'desconectar') {
    setAcao(tipo)
    setErroAcao('')
    try {
      if (tipo === 'conectar') await conectarNuvemshop()
      else {
        if (tipo === 'sincronizar') await sincronizarNuvemshop()
        else { await desconectarNuvemshop(); setConfirmando(false) }
        setDados(await statusNuvemshop())
        mostrar(tipo === 'sincronizar' ? 'Sincronização agendada.' : 'Conexão encerrada. Os pedidos importados foram preservados.')
      }
    } catch (e) { setErroAcao(e instanceof Error ? e.message : 'Não foi possível concluir a operação.') }
    finally { setAcao('') }
  }

  if (erro) return <ErroCarregamento mensagem={erro} onTentar={tentarDeNovo} />
  if (!status) return <p>Carregando…</p>
  const bloqueio = !status.podeGerenciar ? 'Somente administradores podem gerenciar a conexão.' :
    !status.configurada ? 'A conexão estará disponível após configurar o servidor.' : undefined

  return (
    <Card>
      <div className="integracao">
        <div className="integracao-nome" aria-hidden="true">N</div>
        <div className="integracao-dados">
          <h2 className="card-titulo">Nuvemshop</h2>
          <p>Importe os pedidos da sua loja e acompanhe as atualizações automaticamente.</p>
          <span className={`integracao-status ${status.conectada ? 'integracao-ligada' : ''}`}>
            {status.suspensa ? 'Acesso suspenso na Nuvemshop' : status.conectada ? `Conectada em ${formatarData(status.conectadaEm?.slice(0, 10) ?? '')}` : 'Não conectada'}
          </span>
        </div>
        <div className="integracao-acoes">
          {status.conectada && <Button variante="secundario" onClick={() => executar('sincronizar')}
            carregando={acao === 'sincronizar'} disabled={!!acao} motivoDesabilitado={bloqueio || (status.suspensa ? 'Retome o acesso na Nuvemshop para sincronizar.' : undefined)}>Sincronizar agora</Button>}
          <Button onClick={() => executar('conectar')} carregando={acao === 'conectar'} disabled={!!acao}
            motivoDesabilitado={bloqueio}>{status.conectada ? 'Reconectar' : 'Conectar Nuvemshop'}</Button>
          {status.conectada && <Button variante="secundario" onClick={() => setConfirmando(true)} disabled={!!acao}
            motivoDesabilitado={!status.podeGerenciar ? 'Somente administradores podem desconectar.' : undefined}>Desconectar</Button>}
        </div>
      </div>
      <div className="integracao-detalhes" aria-live="polite">
        {!status.configurada && <p>A integração está em preparação. A conexão será liberada quando o ambiente estiver configurado.</p>}
        {retorno === 'conectada' && status.conectada && <p>Loja autorizada. A importação dos últimos 90 dias foi agendada.</p>}
        {retorno && retorno !== 'conectada' && <p role="alert">A autorização não foi concluída. Confira as permissões do aplicativo e inicie a conexão novamente.</p>}
        {status.conectada && <>
          <p><strong>{status.pedidosImportados}</strong> pedidos importados · Loja Nuvemshop {status.storeId}</p>
          <p>{status.ultimaSincronizacao ? `Última atualização: ${new Date(status.ultimaSincronizacao).toLocaleString('pt-BR')}` : 'Aguardando a primeira importação.'}</p>
          <p>{status.tarefasPendentes ? `Sincronização em andamento · ${status.tarefasPendentes} tarefas na fila.` : 'Nenhuma importação em andamento.'}</p>
          <p>{status.webhooksAtivos ? 'Atualizações automáticas configuradas.' : 'Atualizações automáticas aguardando configuração.'}</p>
          {!!status.tarefasComFalha && <p>Há tarefas que precisam de nova tentativa. Use “Sincronizar agora”.</p>}
          <Link to="/pedidos">Ver pedidos importados</Link>
        </>}
        {(erroAcao || status.erro) && <p className="campo-erro" role="alert">{erroAcao || status.erro}</p>}
        {confirmando && <div className="integracao-confirmacao">
          <p>Encerrar a importação automática? Os pedidos já importados serão mantidos. Para revogar a autorização na Nuvemshop, desinstale o aplicativo no painel da loja.</p>
          <div className="integracao-acoes">
            <Button variante="secundario" disabled={!!acao} onClick={() => setConfirmando(false)}>Manter conexão</Button>
            <Button carregando={acao === 'desconectar'} disabled={!!acao} onClick={() => executar('desconectar')}>Confirmar desconexão</Button>
          </div>
        </div>}
      </div>
    </Card>
  )
}

export default IntegracaoNuvemshop
