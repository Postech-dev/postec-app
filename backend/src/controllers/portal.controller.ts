import { Request, Response } from 'express';
import pool from '../database';
import { sendEmailNotification } from '../services/email.service';

// Consultar pedido pelo slug da loja, número do pedido e CPF do cliente
export async function consultarPedido(req: Request, res: Response): Promise<void> {
  try {
    const { slug } = req.params;
    const { numero_pedido, cpf } = req.body;

    if (!numero_pedido || !cpf) {
      res.status(400).json({ mensagem: 'Número do pedido e CPF são obrigatórios' });
      return;
    }

    // Normaliza CPF removendo pontuações
    const cpfLimpo = cpf.toString().replace(/\D/g, '');

    const query = `
      SELECT p.id AS pedido_id, p.numero_pedido, p.cliente_nome, p.cliente_email, p.produto, p.valor
      FROM pedidos p
      JOIN lojas l ON l.id = p.loja_id
      WHERE l.slug = $1 
        AND p.numero_pedido = $2 
        AND regexp_replace(p.cliente_cpf, '\\D', '', 'g') = $3
    `;
    const result = await pool.query(query, [slug, numero_pedido, cpfLimpo]);

    if (result.rows.length === 0) {
      res.status(404).json({ mensagem: 'Pedido não encontrado para esses dados' });
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

    // 3. Criar a ocorrência
    const insertOcorrenciaQuery = `
      INSERT INTO ocorrencias (loja_id, pedido_id, protocolo, status, motivo, descricao)
      VALUES ($1, $2, $3, 'Novo', $4, $5)
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
      INSERT INTO mensagens (ocorrencia_id, autor, texto)
      VALUES ($1, 'cliente', $2)
    `;
    await client.query(insertMensagemQuery, [novaOcorrencia.id, descricao]);

    await client.query('COMMIT');

    // 5. Disparar notificação transacional por e-mail (não bloqueia a resposta se falhar)
    sendEmailNotification({
      to: pedido.cliente_email,
      subject: `[${pedido.loja_nome}] Ocorrência ${protocolo} Recebida!`,
      text: `Olá ${pedido.cliente_nome},\n\nRecebemos a sua solicitação referente ao pedido ${pedido.numero_pedido}.\nSeu protocolo de atendimento é: ${protocolo}.\n\nNossa equipe já está analisando o caso e você receberá atualizações em breve!`
    }).catch(err => console.error('Erro no disparo de email:', err));

    res.status(201).json({
      protocolo,
      mensagem: 'Ocorrência aberta com sucesso! Enviamos a confirmação para seu e-mail.'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao abrir ocorrência:', error);
    res.status(500).json({ mensagem: 'Erro interno ao abrir ocorrência' });
  } finally {
    client.release();
  }
}

// Consultar status e histórico da ocorrência pelo protocolo
export async function getStatusOcorrencia(req: Request, res: Response): Promise<void> {
  try {
    const { slug, protocolo } = req.params;

    const ocorrenciaQuery = `
      SELECT o.id, o.protocolo, o.status, o.motivo, o.tipo_resolucao, o.codigo_rastreio, 
             o.valor_estorno, o.comprovante_estorno, o.criado_em,
             p.numero_pedido, p.produto, p.cliente_nome
      FROM ocorrencias o
      JOIN lojas l ON l.id = o.loja_id
      JOIN pedidos p ON p.id = o.pedido_id
      WHERE l.slug = $1 AND o.protocolo = $2
    `;
    const ocorrenciaResult = await pool.query(ocorrenciaQuery, [slug, protocolo]);

    if (ocorrenciaResult.rows.length === 0) {
      res.status(404).json({ mensagem: 'Ocorrência não encontrada' });
      return;
    }

    const ocorrencia = ocorrenciaResult.rows[0];

    // Buscar histórico de mensagens
    const mensagensResult = await pool.query(
      'SELECT autor, texto, enviado_em FROM mensagens WHERE ocorrencia_id = $1 ORDER BY id ASC',
      [ocorrencia.id]
    );

    res.status(200).json({
      protocolo: ocorrencia.protocolo,
      status: ocorrencia.status,
      motivo: ocorrencia.motivo,
      tipo_resolucao: ocorrencia.tipo_resolucao,
      codigo_rastreio: ocorrencia.codigo_rastreio,
      valor_estorno: ocorrencia.valor_estorno,
      comprovante_estorno: ocorrencia.comprovante_estorno,
      mensagens: mensagensResult.rows.map(m => ({
        autor: m.autor,
        texto: m.texto,
        enviado_em: m.enviado_em
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar status da ocorrência:', error);
    res.status(500).json({ mensagem: 'Erro interno ao consultar ocorrência' });
  }
}
