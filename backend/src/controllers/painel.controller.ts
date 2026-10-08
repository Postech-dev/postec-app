import { Response } from 'express';
import pool from '../database';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { sendEmailNotification } from '../services/email.service';

// o painel aceita o id numérico ou o protocolo (POS-1001) na URL
async function localizarId(param: string, loja_id: number | undefined): Promise<number | null> {
  if (/^POS-\d+$/i.test(param)) {
    const r = await pool.query('SELECT id FROM ocorrencias WHERE protocolo = $1 AND loja_id = $2', [
      param.toUpperCase(),
      loja_id
    ]);
    return r.rows[0]?.id ?? null;
  }
  const id = Number(param);
  return Number.isInteger(id) ? id : null;
}

// status em linguagem de cliente, para os e-mails
const STATUS_PARA_CLIENTE: Record<string, string> = {
  Novo: 'Recebemos sua solicitação',
  'Em Triagem': 'A loja está analisando',
  'Aguardando Devolução': 'Aguardando você devolver o produto',
  'Reenvio Solicitado': 'Preparando o novo envio',
  'Estorno Solicitado': 'Preparando seu reembolso',
  Concluído: 'Resolvido'
};

// eventos que aparecem no histórico quando o status muda
const EVENTOS: Record<string, string> = {
  'Aguardando Devolução': 'Devolução solicitada ao cliente',
  'Reenvio Solicitado': 'Reenvio solicitado',
  'Estorno Solicitado': 'Estorno solicitado'
};

// 1. Listar ocorrências da loja autenticada
export async function listarOcorrencias(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const loja_id = req.user?.loja_id;

    const query = `
      SELECT
        o.id,
        o.protocolo,
        o.status,
        o.motivo,
        o.descricao,
        o.tipo_resolucao,
        o.codigo_rastreio,
        o.itens_reenviados,
        o.valor_estorno,
        o.comprovante_estorno,
        o.concluido_em,
        o.canal,
        o.responsavel,
        o.nao_lida,
        o.orientacao_devolucao,
        o.criado_em,
        p.id AS pedido_id,
        p.numero_pedido,
        p.cliente_nome,
        p.cliente_email,
        p.cliente_cpf,
        p.produto,
        p.valor AS pedido_valor,
        p.data_compra,
        (SELECT MAX(m.enviado_em) FROM mensagens m WHERE m.ocorrencia_id = o.id) AS ultima_atividade,
        COALESCE((
          SELECT m.autor FROM mensagens m
          WHERE m.ocorrencia_id = o.id AND m.autor <> 'sistema' AND m.interna = false
          ORDER BY m.id DESC LIMIT 1
        ), '') AS ultimo_autor
      FROM ocorrencias o
      JOIN pedidos p ON p.id = o.pedido_id
      WHERE o.loja_id = $1
      ORDER BY o.id DESC
    `;
    const result = await pool.query(query, [loja_id]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao listar ocorrências:', error);
    res.status(500).json({ mensagem: 'Erro interno ao listar ocorrências' });
  }
}

// 1b. Números do menu: casos novos e casos com mensagem do cliente não lida
export async function contagens(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE status = 'Novo')::int AS novas,
              COUNT(*) FILTER (WHERE nao_lida)::int AS nao_lidas
       FROM ocorrencias WHERE loja_id = $1`,
      [req.user?.loja_id]
    );
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao contar ocorrências:', error);
    res.status(500).json({ mensagem: 'Erro interno ao contar ocorrências' });
  }
}

// 2. Detalhar uma ocorrência específica com suas mensagens (inclui notas internas)
export async function detalharOcorrencia(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const loja_id = req.user?.loja_id;
    const id = await localizarId(String(req.params.id), loja_id);

    if (id === null) {
      res.status(404).json({ mensagem: 'Ocorrência não encontrada' });
      return;
    }

    const query = `
      SELECT
        o.*,
        p.id AS pedido_id,
        p.numero_pedido,
        p.cliente_nome,
        p.cliente_cpf,
        p.cliente_email,
        p.produto,
        p.valor AS pedido_valor,
        p.data_compra
      FROM ocorrencias o
      JOIN pedidos p ON p.id = o.pedido_id
      WHERE o.id = $1 AND o.loja_id = $2
    `;
    const result = await pool.query(query, [id, loja_id]);

    if (result.rows.length === 0) {
      res.status(404).json({ mensagem: 'Ocorrência não encontrada' });
      return;
    }

    const ocorrencia = result.rows[0];

    const mensagensResult = await pool.query(
      'SELECT id, autor, autor_nome, texto, interna, enviado_em FROM mensagens WHERE ocorrencia_id = $1 ORDER BY id ASC',
      [id]
    );

    res.status(200).json({
      ...ocorrencia,
      mensagens: mensagensResult.rows
    });
  } catch (error) {
    console.error('Erro ao detalhar ocorrência:', error);
    res.status(500).json({ mensagem: 'Erro interno ao detalhar ocorrência' });
  }
}

// 2b. Marcar como lida (o atendente abriu o caso)
export async function marcarLida(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const loja_id = req.user?.loja_id;
    const id = await localizarId(String(req.params.id), loja_id);

    if (id === null) {
      res.status(404).json({ mensagem: 'Ocorrência não encontrada' });
      return;
    }

    await pool.query('UPDATE ocorrencias SET nao_lida = false WHERE id = $1 AND loja_id = $2', [id, loja_id]);
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao marcar como lida:', error);
    res.status(500).json({ mensagem: 'Erro interno ao marcar como lida' });
  }
}

// 3. Atualizar status da ocorrência (Triagem, Aguardando Devolução, etc)
export async function atualizarStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const loja_id = req.user?.loja_id;
    const nomeUsuario = req.user?.nome ?? 'Atendimento';
    const { status, mensagem } = req.body;

    const statusValidos = [
      'Novo',
      'Em Triagem',
      'Aguardando Devolução',
      'Reenvio Solicitado',
      'Estorno Solicitado',
      'Concluído'
    ];

    if (!status || !statusValidos.includes(status)) {
      res.status(400).json({
        mensagem: `Status inválido. Deve ser um dos seguintes: ${statusValidos.join(', ')}`
      });
      return;
    }

    const id = await localizarId(String(req.params.id), loja_id);
    if (id === null) {
      res.status(404).json({ mensagem: 'Ocorrência não encontrada' });
      return;
    }

    const atual = await pool.query('SELECT responsavel FROM ocorrencias WHERE id = $1 AND loja_id = $2', [id, loja_id]);
    if (atual.rows.length === 0) {
      res.status(404).json({ mensagem: 'Ocorrência não encontrada' });
      return;
    }

    // quem inicia a triagem assume o caso; a orientação de devolução fica guardada para o portal
    const responsavel = status === 'Em Triagem' && !atual.rows[0].responsavel ? nomeUsuario : atual.rows[0].responsavel;
    const orientacao = status === 'Aguardando Devolução' && mensagem ? mensagem : null;

    const updateQuery = `
      UPDATE ocorrencias
      SET status = $1,
          responsavel = $2,
          orientacao_devolucao = COALESCE($3, orientacao_devolucao)
      WHERE id = $4 AND loja_id = $5
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [status, responsavel, orientacao, id, loja_id]);
    const ocorrencia = result.rows[0];

    // evento no histórico
    const evento = status === 'Em Triagem' ? `${nomeUsuario.split(' ')[0]} iniciou a triagem` : EVENTOS[status];
    if (evento) {
      await pool.query('INSERT INTO mensagens (ocorrencia_id, autor, autor_nome, texto) VALUES ($1, $2, $3, $4)', [
        id,
        'sistema',
        'Sistema',
        evento
      ]);
    }

    // Se o atendente enviou uma mensagem de texto junto com a mudança de status
    if (mensagem) {
      await pool.query('INSERT INTO mensagens (ocorrencia_id, autor, autor_nome, texto) VALUES ($1, $2, $3, $4)', [
        id,
        'atendente',
        nomeUsuario,
        mensagem
      ]);
    }

    // Busca dados do cliente para notificação
    const pedidoResult = await pool.query('SELECT cliente_nome, cliente_email FROM pedidos WHERE id = $1', [
      ocorrencia.pedido_id
    ]);

    if (pedidoResult.rows.length > 0) {
      const cliente = pedidoResult.rows[0];
      const statusCliente = STATUS_PARA_CLIENTE[status] ?? status;
      sendEmailNotification({
        to: cliente.cliente_email,
        subject: `Atualização da sua solicitação ${ocorrencia.protocolo}: ${statusCliente}`,
        text: `Olá ${cliente.cliente_nome},\n\nSua solicitação ${ocorrencia.protocolo} agora está assim: "${statusCliente}".${mensagem ? `\n\nMensagem da loja: ${mensagem}` : ''}\n\nAcompanhe no portal com o seu protocolo.`
      }).catch(err => console.error('Erro no envio de email:', err));
    }

    res.status(200).json({
      mensagem: 'Status atualizado com sucesso',
      ocorrencia
    });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ mensagem: 'Erro interno ao atualizar status' });
  }
}

// 4. Resolver ocorrência (Reenvio ou Estorno) e concluir
export async function resolverOcorrencia(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const loja_id = req.user?.loja_id;
    const { tipo_resolucao, codigo_rastreio, itens_reenviados, valor_estorno, comprovante_estorno } = req.body;

    if (!tipo_resolucao || (tipo_resolucao !== 'Reenvio' && tipo_resolucao !== 'Estorno')) {
      res.status(400).json({ mensagem: 'tipo_resolucao deve ser "Reenvio" ou "Estorno"' });
      return;
    }

    if (tipo_resolucao === 'Reenvio' && !codigo_rastreio) {
      res.status(400).json({ mensagem: 'codigo_rastreio é obrigatório para resolução de Reenvio' });
      return;
    }

    if (tipo_resolucao === 'Estorno' && (!valor_estorno || !comprovante_estorno)) {
      res.status(400).json({ mensagem: 'valor_estorno e comprovante_estorno são obrigatórios para Estorno' });
      return;
    }

    const id = await localizarId(String(req.params.id), loja_id);
    if (id === null) {
      res.status(404).json({ mensagem: 'Ocorrência não encontrada' });
      return;
    }

    // o estorno nunca pode passar do valor do pedido
    if (tipo_resolucao === 'Estorno') {
      const limite = await pool.query(
        'SELECT p.valor FROM ocorrencias o JOIN pedidos p ON p.id = o.pedido_id WHERE o.id = $1 AND o.loja_id = $2',
        [id, loja_id]
      );
      if (limite.rows.length > 0 && Number(valor_estorno) > Number(limite.rows[0].valor)) {
        res.status(400).json({ mensagem: 'O valor do estorno não pode ser maior que o valor do pedido' });
        return;
      }
    }

    const updateQuery = `
      UPDATE ocorrencias
      SET status = 'Concluído',
          tipo_resolucao = $1,
          codigo_rastreio = $2,
          itens_reenviados = $3,
          valor_estorno = $4,
          comprovante_estorno = $5,
          concluido_em = CURRENT_TIMESTAMP,
          nao_lida = false
      WHERE id = $6 AND loja_id = $7
      RETURNING *
    `;
    const values = [
      tipo_resolucao,
      codigo_rastreio || null,
      itens_reenviados || null,
      valor_estorno || null,
      comprovante_estorno || null,
      id,
      loja_id
    ];
    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      res.status(404).json({ mensagem: 'Ocorrência não encontrada' });
      return;
    }

    const ocorrencia = result.rows[0];

    // Registra mensagem de encerramento no histórico
    const textoMensagem = tipo_resolucao === 'Reenvio'
      ? `Chamado concluído com Reenvio. Código de rastreio: ${codigo_rastreio}`
      : `Chamado concluído com Estorno no valor de R$ ${Number(valor_estorno).toFixed(2)}. Comprovante: ${comprovante_estorno}`;

    await pool.query('INSERT INTO mensagens (ocorrencia_id, autor, autor_nome, texto) VALUES ($1, $2, $3, $4)', [
      id,
      'sistema',
      'Sistema',
      textoMensagem
    ]);

    // Dispara e-mail de conclusão com a comprovação
    const pedidoResult = await pool.query('SELECT cliente_nome, cliente_email FROM pedidos WHERE id = $1', [
      ocorrencia.pedido_id
    ]);

    if (pedidoResult.rows.length > 0) {
      const cliente = pedidoResult.rows[0];
      const resultado = tipo_resolucao === 'Reenvio' ? 'Reenvio do produto' : 'Reembolso';
      sendEmailNotification({
        to: cliente.cliente_email,
        subject: `[Resolvido] Sua solicitação ${ocorrencia.protocolo} foi concluída!`,
        text: `Olá ${cliente.cliente_nome},\n\nSua solicitação (${ocorrencia.protocolo}) foi resolvida!\n\nResultado: ${resultado}\n${textoMensagem}\n\nAgradecemos a sua paciência!`
      }).catch(err => console.error('Erro no envio de email:', err));
    }

    res.status(200).json({
      mensagem: 'Ocorrência resolvida e concluída com sucesso',
      ocorrencia
    });
  } catch (error) {
    console.error('Erro ao resolver ocorrência:', error);
    res.status(500).json({ mensagem: 'Erro interno ao resolver ocorrência' });
  }
}

// 5. Enviar mensagem avulsa no histórico (ou nota interna, que o cliente não vê)
export async function enviarMensagem(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const loja_id = req.user?.loja_id;
    const { texto, interna } = req.body;

    if (!texto || !String(texto).trim()) {
      res.status(400).json({ mensagem: 'O campo texto é obrigatório' });
      return;
    }

    const id = await localizarId(String(req.params.id), loja_id);
    if (id === null) {
      res.status(404).json({ mensagem: 'Ocorrência não encontrada' });
      return;
    }

    // Valida se a ocorrência existe e pertence à loja
    const ocCheck = await pool.query('SELECT id FROM ocorrencias WHERE id = $1 AND loja_id = $2', [id, loja_id]);
    if (ocCheck.rows.length === 0) {
      res.status(404).json({ mensagem: 'Ocorrência não encontrada' });
      return;
    }

    const query = `
      INSERT INTO mensagens (ocorrencia_id, autor, autor_nome, texto, interna)
      VALUES ($1, 'atendente', $2, $3, $4)
      RETURNING id, autor, autor_nome, texto, interna, enviado_em
    `;
    const result = await pool.query(query, [id, req.user?.nome ?? 'Atendimento', String(texto).trim(), interna === true]);

    res.status(201).json({
      mensagem: 'Mensagem enviada com sucesso',
      dados: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ mensagem: 'Erro interno ao enviar mensagem' });
  }
}
