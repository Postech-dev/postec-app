import { Request, Response } from 'express';
import pool from '../database';
import { sendEmailNotification } from '../services/email.service';

// Dados públicos da loja do portal (nome, prazo, endereço de devolução)
export async function getLoja(req: Request, res: Response): Promise<void> {
  try {
    const { slug } = req.params;
    const result = await pool.query(
      `SELECT id, nome, slug, email, plano, prazo_resposta_dias, endereco_devolucao FROM lojas WHERE slug = $1`,
      [slug]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ mensagem: 'Loja não encontrada' });
      return;
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar loja do portal:', error);
    res.status(500).json({ mensagem: 'Erro interno ao buscar loja' });
  }
}

// Consultar pedido pelo slug da loja, número do pedido e CPF do cliente
export async function consultarPedido(req: Request, res: Response): Promise<void> {
  try {
    const { slug } = req.params;
    const { numero_pedido, cpf } = req.body;

    if (!numero_pedido || !cpf) {
      res.status(400).json({ mensagem: 'Número do pedido e CPF são obrigatórios' });
      return;
    }

    // formata o cpf pra tirar qualquer caractere que nao seja numero
    const cpfLimpo = cpf.toString().replace(/\D/g, '');

    const query = `
      SELECT p.id AS pedido_id, p.numero_pedido, p.cliente_nome, p.cliente_email, p.produto, p.valor, p.data_compra
      FROM pedidos p
      JOIN lojas l ON l.id = p.loja_id
      WHERE l.slug = $1
        AND p.numero_pedido = $2
        AND regexp_replace(p.cliente_cpf, '\\D', '', 'g') = $3
    `;
    const result = await pool.query(query, [slug, numero_pedido, cpfLimpo]);

    // sempre a mesma resposta, exista o número com outro CPF ou não
    if (result.rows.length === 0) {
      res.status(404).json({ mensagem: 'Não encontramos um pedido com esses dados' });
      return;
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao consultar pedido:', error);
    res.status(500).json({ mensagem: 'Erro interno ao consultar pedido' });
  }
}

// Abrir ocorrência pelo portal do cliente
export async function abrirOcorrencia(req: Request, res: Response): Promise<void> {
  const client = await pool.connect();
  try {
    const { slug } = req.params;
    const { pedido_id, motivo, descricao } = req.body;

    if (!pedido_id || !motivo || !descricao) {
      res.status(400).json({ mensagem: 'pedido_id, motivo e descricao são obrigatórios' });
      return;
    }

    // 1. Validar se o pedido pertence à loja correspondente ao slug
    const pedidoQuery = `
      SELECT p.*, l.id AS loja_id, l.nome AS loja_nome
      FROM pedidos p
      JOIN lojas l ON l.id = p.loja_id
      WHERE l.slug = $1 AND p.id = $2
    `;
    const pedidoResult = await client.query(pedidoQuery, [slug, pedido_id]);

    if (pedidoResult.rows.length === 0) {
      res.status(404).json({ mensagem: 'Pedido inválido para esta loja' });
      return;
    }

    const pedido = pedidoResult.rows[0];

    await client.query('BEGIN');

    // 2. Gerar número de protocolo sequencial/único (Ex: POS-1001, POS-1002...)
    const countResult = await client.query('SELECT COUNT(*) FROM ocorrencias');
    const total = parseInt(countResult.rows[0].count, 10);
    const protocolo = `POS-${1000 + total + 1}`;

    // 3. Criar a ocorrência (nasce como "não lida" para a loja)
    const insertOcorrenciaQuery = `
      INSERT INTO ocorrencias (loja_id, pedido_id, protocolo, status, motivo, descricao, canal, nao_lida)
      VALUES ($1, $2, $3, 'Novo', $4, $5, 'portal', true)
      RETURNING *
    `;
    const ocorrenciaResult = await client.query(insertOcorrenciaQuery, [
      pedido.loja_id,
      pedido_id,
      protocolo,
      motivo,
      descricao
    ]);
    const novaOcorrencia = ocorrenciaResult.rows[0];

    // 4. Inserir a mensagem inicial da conversa aberta pelo cliente
    const insertMensagemQuery = `
      INSERT INTO mensagens (ocorrencia_id, autor, autor_nome, texto)
      VALUES ($1, 'cliente', $2, $3)
    `;
    await client.query(insertMensagemQuery, [novaOcorrencia.id, pedido.cliente_nome, descricao]);

    await client.query('COMMIT');

    // 5. Disparar notificação transacional por e-mail (não bloqueia a resposta se falhar)
    sendEmailNotification({
      to: pedido.cliente_email,
      subject: `[${pedido.loja_nome}] Recebemos sua solicitação ${protocolo}`,
      text: `Olá ${pedido.cliente_nome},\n\nRecebemos a sua solicitação referente ao pedido ${pedido.numero_pedido}.\nSeu protocolo de atendimento é: ${protocolo}.\n\nA loja já está analisando o caso e você receberá atualizações por aqui.`
    }).catch(err => console.error('Erro no disparo de email:', err));

    res.status(201).json({
      protocolo,
      mensagem: 'Solicitação aberta com sucesso! Enviamos a confirmação para seu e-mail.'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao abrir ocorrência:', error);
    res.status(500).json({ mensagem: 'Erro interno ao abrir a solicitação' });
  } finally {
    client.release();
  }
}

// Consultar status e histórico da ocorrência pelo protocolo
// (nunca devolve notas internas, CPF nem e-mail do cliente)
export async function getStatusOcorrencia(req: Request, res: Response): Promise<void> {
  try {
    const { slug, protocolo } = req.params;

    const ocorrenciaQuery = `
      SELECT o.id, o.protocolo, o.status, o.motivo, o.descricao, o.criado_em, o.concluido_em,
             o.tipo_resolucao, o.codigo_rastreio, o.itens_reenviados,
             o.valor_estorno, o.comprovante_estorno, o.orientacao_devolucao,
             p.numero_pedido, p.produto, p.valor AS pedido_valor, p.data_compra, p.cliente_nome
      FROM ocorrencias o
      JOIN lojas l ON l.id = o.loja_id
      JOIN pedidos p ON p.id = o.pedido_id
      WHERE l.slug = $1 AND o.protocolo = $2
    `;
    const ocorrenciaResult = await pool.query(ocorrenciaQuery, [slug, protocolo]);

    if (ocorrenciaResult.rows.length === 0) {
      res.status(404).json({ mensagem: 'Solicitação não encontrada' });
      return;
    }

    const { id, ...ocorrencia } = ocorrenciaResult.rows[0];

    // Buscar histórico de mensagens (sem as notas internas)
    const mensagensResult = await pool.query(
      `SELECT id, autor, autor_nome, texto, enviado_em
       FROM mensagens WHERE ocorrencia_id = $1 AND interna = false ORDER BY id ASC`,
      [id]
    );

    res.status(200).json({
      ...ocorrencia,
      mensagens: mensagensResult.rows
    });
  } catch (error) {
    console.error('Erro ao buscar status da ocorrência:', error);
    res.status(500).json({ mensagem: 'Erro interno ao consultar a solicitação' });
  }
}

// O cliente responde à loja pelo portal
export async function responderOcorrencia(req: Request, res: Response): Promise<void> {
  try {
    const { slug, protocolo } = req.params;
    const { texto } = req.body;

    if (!texto || !String(texto).trim()) {
      res.status(400).json({ mensagem: 'Escreva a mensagem antes de enviar' });
      return;
    }
    if (String(texto).length > 2000) {
      res.status(400).json({ mensagem: 'A mensagem é longa demais. Use até 2000 caracteres' });
      return;
    }

    const ocorrenciaResult = await pool.query(
      `SELECT o.id, p.cliente_nome
       FROM ocorrencias o
       JOIN lojas l ON l.id = o.loja_id
       JOIN pedidos p ON p.id = o.pedido_id
       WHERE l.slug = $1 AND o.protocolo = $2`,
      [slug, protocolo]
    );

    if (ocorrenciaResult.rows.length === 0) {
      res.status(404).json({ mensagem: 'Solicitação não encontrada' });
      return;
    }

    const { id, cliente_nome } = ocorrenciaResult.rows[0];

    const mensagem = await pool.query(
      `INSERT INTO mensagens (ocorrencia_id, autor, autor_nome, texto)
       VALUES ($1, 'cliente', $2, $3)
       RETURNING id, autor, autor_nome, texto, enviado_em`,
      [id, cliente_nome, String(texto).trim()]
    );
    await pool.query('UPDATE ocorrencias SET nao_lida = true WHERE id = $1', [id]);

    res.status(201).json(mensagem.rows[0]);
  } catch (error) {
    console.error('Erro ao responder solicitação:', error);
    res.status(500).json({ mensagem: 'Erro interno ao enviar a resposta' });
  }
}
