import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell/AppShell'
import PortalShell from './components/PortalShell/PortalShell'
import CadastroPage from './pages/CadastroPage'
import ClientePage from './pages/ClientePage'
import ImportarPedidosPage from './pages/ImportarPedidosPage'
import IntegracoesPage from './pages/IntegracoesPage'
import MetricasPage from './pages/MetricasPage'
import NovaOcorrenciaPage from './pages/NovaOcorrenciaPage'
import NovoPedidoPage from './pages/NovoPedidoPage'
import PedidoDetalhePage from './pages/PedidoDetalhePage'
import PedidosPage from './pages/PedidosPage'
import PortalCasoPage from './pages/PortalCasoPage'
import EditarLojaPage from './pages/EditarLojaPage'
import EquipePage from './pages/EquipePage'
import LoginPage from './pages/LoginPage'
import LojasPage from './pages/LojasPage'
import NotFoundPage from './pages/NotFoundPage'
import OcorrenciaDetalhePage from './pages/OcorrenciaDetalhePage'
import OcorrenciasKanbanPage from './pages/OcorrenciasKanbanPage'
import OcorrenciasPage from './pages/OcorrenciasPage'
import PortalAbrirPage from './pages/PortalAbrirPage'
import PortalAcompanhamentoPage from './pages/PortalAcompanhamentoPage'
import PortalConcluidoPage from './pages/PortalConcluidoPage'
import PortalConsultaPage from './pages/PortalConsultaPage'
import PortalPedidoPage from './pages/PortalPedidoPage'
import PortalRecebidaPage from './pages/PortalRecebidaPage'
import RegistrarEstornoPage from './pages/RegistrarEstornoPage'
import RegistrarReenvioPage from './pages/RegistrarReenvioPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />

      <Route element={<AppShell />}>
        <Route path="/ocorrencias" element={<OcorrenciasPage />} />
        <Route path="/ocorrencias/nova" element={<NovaOcorrenciaPage />} />
        <Route path="/ocorrencias/kanban" element={<OcorrenciasKanbanPage />} />
        <Route path="/ocorrencias/:protocolo" element={<OcorrenciaDetalhePage />} />
        <Route path="/ocorrencias/:protocolo/reenvio" element={<RegistrarReenvioPage />} />
        <Route path="/ocorrencias/:protocolo/estorno" element={<RegistrarEstornoPage />} />
        <Route path="/pedidos" element={<PedidosPage />} />
        <Route path="/pedidos/importar" element={<ImportarPedidosPage />} />
        <Route path="/pedidos/novo" element={<NovoPedidoPage />} />
        <Route path="/pedidos/:id" element={<PedidoDetalhePage />} />
        <Route path="/clientes/:id" element={<ClientePage />} />
        <Route path="/metricas" element={<MetricasPage />} />
        <Route path="/integracoes" element={<IntegracoesPage />} />
        <Route path="/lojas" element={<LojasPage />} />
        <Route path="/lojas/:id/editar" element={<EditarLojaPage />} />
        <Route path="/equipe" element={<EquipePage />} />
      </Route>

      <Route path="/portal/:slug" element={<PortalShell />}>
        <Route index element={<PortalConsultaPage />} />
        <Route path="pedido" element={<PortalPedidoPage />} />
        <Route path="abrir" element={<PortalAbrirPage />} />
        <Route path="recebida/:protocolo" element={<PortalRecebidaPage />} />
        <Route path="acompanhar/:protocolo" element={<PortalAcompanhamentoPage />} />
        <Route path="caso/:token" element={<PortalCasoPage />} />
        <Route path="concluido/:protocolo" element={<PortalConcluidoPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/ocorrencias" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
