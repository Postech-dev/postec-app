import { Response } from 'express';
import pool from '../database';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { sendEmailNotification } from '../services/email.service';

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
        o.valor_estorno,
        o.criado_em,
        p.numero_pedido,
        p.cliente_nome,
        p.cliente_email,
        p.produto,
        p.valor AS pedido_valor
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

// 2. Detalhar uma ocorrência específica com suas mensagens
export async function detalharOcorrencia(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const loja_id = req.user?.loja_id;
    const { id } = req.params;

    const query = `
      SELECT 
        o.*,
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
      'SELECT id, autor, texto, enviado_em FROM mensagens WHERE ocorrencia_id = $1 ORDER BY id ASC',
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

// 3. Atualizar status da ocorrência (Triagem, Aguardando Devolução, etc)
export async function atualizarStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const loja_id = req.user?.loja_id;
    const { id } = req.params;
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

    const updateQuery = `
      UPDATE ocorrencias
      SET status = $1
      WHERE id = $2 AND loja_id = $3
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [status, id, loja_id]);

    if (result.rows.length === 0) {
      res.status(404).json({ mensagem: 'Ocorrência não encontrada' });
      return;
    }

    const ocorrencia = result.rows[0];

    // Se o atendente enviou uma mensagem de texto junto com a mudança de status
    if (mensagem) {
      await pool.query(
        'INSERT INTO mensagens (ocorrencia_id, autor, texto) VALUES ($1, $2, $3)',
        [id, 'atendente', mensagem]
      );
    }

    // Busca dados do cliente para notificação
    const pedidoResult = await pool.query(
      'SELECT cliente_nome, cliente_email FROM pedidos WHERE id = $1',
      [ocorrencia.pedido_id]
    );

    if (pedidoResult.rows.length > 0) {
      const cliente = pedidoResult.rows[0];
      sendEmailNotification({
        to: cliente.cliente_email,
        subject: `Atualização da Ocorrência ${ocorrencia.protocolo}: ${status}`,
        text: `Olá ${cliente.cliente_nome},\n\nO status do seu chamado ${ocorrencia.protocolo} mudou para: "${status}".${mensagem ? `\n\nMensagem do atendente: ${mensagem}` : ''}\n\nAcompanhe no portal com o seu protocolo.`
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
    const { id } = req.params;
    const { tipo_resolucao, codigo_rastreio, valor_estorno, comprovante_estorno } = req.body;

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

    const updateQuery = `
      UPDATE ocorrencias
      SET status = 'Concluído',
          tipo_resolucao = $1,
          codigo_rastreio = $2,
          valor_estorno = $3,
          comprovante_estorno = $4
      WHERE id = $5 AND loja_id = $6
      RETURNING *
    `;
    const values = [
      tipo_resolucao,
      codigo_rastreio || null,
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

    await pool.query(
      'INSERT INTO mensagens (ocorrencia_id, autor, texto) VALUES ($1, $2, $3)',
      [id, 'sistema', textoMensagem]
    );

    // Dispara e-mail de conclusão com a comprovação
    const pedidoResult = await pool.query(
      'SELECT cliente_nome, cliente_email FROM pedidos WHERE id = $1',
      [ocorrencia.pedido_id]
    );

    if (pedidoResult.rows.length > 0) {
      const cliente = pedidoResult.rows[0];
      sendEmailNotification({
        to: cliente.cliente_email,
        subject: `[Concluído] Sua ocorrência ${ocorrencia.protocolo} foi finalizada!`,
        text: `Olá ${cliente.cliente_nome},\n\nSua solicitação (${ocorrencia.protocolo}) foi concluída com sucesso!\n\nResultado: ${tipo_resolucao}\n${textoMensagem}\n\nAgradecemos a sua paciência!`
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

// 5. Enviar mensagem avulsa no histórico
export async function enviarMensagem(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const loja_id = req.user?.loja_id;
    const { id } = req.params;
    const { texto } = req.body;

    if (!texto) {
      res.status(400).json({ mensagem: 'O campo texto é obrigatório' });
      return;
    }

    // Valida se a ocorrência existe e pertence à loja
    const ocCheck = await pool.query('SELECT id FROM ocorrencias WHERE id = $1 AND loja_id = $2', [id, loja_id]);
    if (ocCheck.rows.length === 0) {
      res.status(404).json({ mensagem: 'Ocorrência não encontrada' });
      return;
    }

    const query = `
      INSERT INTO mensagens (ocorrencia_id, autor, texto)
      VALUES ($1, 'atendente', $2)
      RETURNING *
    `;
    const result = await pool.query(query, [id, texto]);

    res.status(201).json({
      mensagem: 'Mensagem enviada com sucesso',
      dados: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ mensagem: 'Erro interno ao enviar mensagem' });
  }
}
