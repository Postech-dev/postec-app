// Dados sintéticos, restritos à loja explicitamente indicada. Reexecutar não duplica a demo.
const { Pool } = require('pg');
const { connectionOptions } = require('../db-options.cjs');
const fs = require('node:fs/promises');
const path = require('node:path');
const PREFIX = 'DEMO-NOV26-';
const names = ['Mariana Alves','Camila Ribeiro','Juliana Costa','Beatriz Martins','Fernanda Lima','Larissa Rocha','Rafael Souza','Gabriel Oliveira','Lucas Ferreira','Amanda Santos','Bruna Carvalho','Carolina Mendes','Daniela Moreira','Eduardo Almeida','Isabela Teixeira'];
const products = [['Camiseta Básica Algodão Branca','M',59.9],['Calça Jeans Reta Azul','40',159.9],['Vestido Midi Floral','P',189.9],['Bolsa Transversal Caramelo','Único',129.9],['Tênis Casual Branco','38',219.9]];
const cases = [
  ['Novo','Tamanho Errado','portal','A camiseta ficou pequena. Gostaria de trocar pelo tamanho G.',0],
  ['Novo','Produto com Defeito','email','A costura lateral abriu no primeiro uso. Posso enviar fotos para análise?',1],
  ['Novo','Item Faltante','instagram','Comprei duas unidades e recebi somente uma na embalagem.',2],
  ['Em Triagem','Produto Diferente','telefone','O modelo recebido é diferente do escolhido no pedido.',3],
  ['Em Triagem','Atraso na Entrega','reclame_aqui','O prazo terminou e o rastreamento não atualiza há três dias.',4],
  ['Aguardando Devolução','Tamanho Errado','loja_fisica','Quero trocar a peça por um tamanho maior. A etiqueta está preservada.',5],
  ['Aguardando Devolução','Arrependimento','portal','A compra não atendeu à minha expectativa e solicito a devolução.',6],
  ['Reenvio Solicitado','Produto com Defeito','email','A análise confirmou o defeito e aguardo o envio de uma nova peça.',7],
  ['Reenvio Solicitado','Produto Diferente','outro','O item incorreto já retornou. Aguardo o produto correto.',8],
  ['Estorno Solicitado','Arrependimento','portal','A devolução foi recebida e aguardo a confirmação do reembolso.',9],
  ['Estorno Solicitado','Item Faltante','telefone','Prefiro o reembolso proporcional da unidade não recebida.',10],
  ['Concluído','Tamanho Errado','portal','Troca concluída. Recebi o tamanho correto e ficou ótimo.',11,'Reenvio'],
  ['Concluído','Produto com Defeito','email','O produto devolvido foi analisado e o reembolso integral foi registrado.',12,'Estorno'],
  ['Concluído','Item Faltante','instagram','Recebi o reembolso da unidade faltante e a solicitação foi resolvida.',13,'Estorno'],
];
function cpf(i) { let s=String(910000000+i*139); for(let n=0;n<2;n++){ const r=[...s].reduce((a,v,j)=>a+Number(v)*(s.length+1-j),0)*10%11;s+=r===10?'0':String(r); } return s; }
async function main() {
  const lojaId = Number(process.argv[2]);
  if (!Number.isSafeInteger(lojaId) || lojaId<1) throw Error('Informe o ID da loja.');
  const pool = new Pool(connectionOptions(process.env.DATABASE_URL));
  const c = await pool.connect();
  const manifest = { sintetico:true, lojaId, criadoEm:new Date().toISOString(), pedidos:[], casos:[] };
  try {
    await c.query('BEGIN');
    await c.query('SELECT pg_advisory_xact_lock(4000,$1)',[lojaId]);
    const loja=(await c.query('SELECT nome,slug FROM lojas WHERE id=$1 FOR UPDATE',[lojaId])).rows[0];
    if (!loja || loja.slug !== 'luiz-shop') throw Error('A loja não corresponde à Luiz_Shop autorizada.');
    const now = new Date();
    const hour=3600000;
    for(let i=0;i<30;i++) {
      const person=i%15, p=products[i%5], qty=i%6===0||[2,10,13].includes(i)?2:1;
      const days=Math.max(3+(i%25),i>=11&&i<14?12+(i-11)*5:0);
      const date=new Date(now.getTime()-days*24*hour).toISOString().slice(0,10);
      const numero=PREFIX+String(i+1).padStart(3,'0');
      let row=(await c.query('SELECT id,cliente_email FROM pedidos WHERE loja_id=$1 AND numero_pedido=$2',[lojaId,numero])).rows[0];
      if (row && !row.cliente_email.endsWith('@example.com')) throw Error('Colisão com pedido não sintético.');
      if (!row) row=(await c.query(`INSERT INTO pedidos(loja_id,numero_pedido,cliente_nome,cliente_cpf,cliente_email,produto,valor,data_compra,quantidade,tamanho,origem) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'manual') RETURNING id`,[lojaId,numero,names[person],cpf(person+1),`demo.nov26.${person+1}@example.com`,p[0],(p[2]*qty).toFixed(2),date,qty,p[1]])).rows[0];
      manifest.pedidos.push({id:row.id,numero,cliente:names[person],cpf:cpf(person+1),produto:p[0],quantidade:qty,valor:Number((p[2]*qty).toFixed(2))});
    }
    for(let i=0;i<cases.length;i++) {
      const [status,motivo,canal,relato,index,resolucao]=cases[i];
      const pedido=manifest.pedidos[index];
      const existing=(await c.query("SELECT id,protocolo FROM ocorrencias WHERE loja_id=$1 AND pedido_id=$2 AND descricao LIKE '[DEMO NOV26]%'",[lojaId,pedido.id])).rows[0];
      if(existing) {manifest.casos.push({...existing,status,pedido:pedido.numero});continue;}
      const age=i<3?i*2+1:i<11?24+(i-3)*18:24*9+(i-11)*24*5;
      const opened=new Date(now.getTime()-age*hour);
      const ended=status==='Concluído'?new Date(opened.getTime()+(i===11?30:48)*hour):null;
      const refund=resolucao==='Estorno'?Number((pedido.valor*(i===13?0.5:1)).toFixed(2)):null;
      const instruction=['Aguardando Devolução','Reenvio Solicitado','Estorno Solicitado','Concluído'].includes(status)?'Demonstração: embale o produto com a etiqueta e informe a postagem pelo portal. Autorização fictícia DEMO-DEV-'+(i+1)+'.':null;
      const row=(await c.query(`INSERT INTO ocorrencias(loja_id,pedido_id,protocolo,status,motivo,descricao,tipo_resolucao,codigo_rastreio,itens_reenviados,valor_estorno,comprovante_estorno,concluido_em,canal,responsavel,nao_lida,orientacao_devolucao,criado_em) VALUES($1,$2,'POS-'||nextval('ocorrencias_protocolo_seq'),$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id,protocolo`,[lojaId,pedido.id,status,motivo,'[DEMO NOV26] '+relato,resolucao||null,resolucao==='Reenvio'?'DEMO-RASTREIO-001':null,resolucao==='Reenvio'?'1 unidade — '+pedido.produto:null,refund,refund?'DEMO-ESTORNO-'+(i+1):null,ended,canal,status==='Novo'?null:'Equipe Demo',status==='Novo'||i===4,instruction,opened])).rows[0];
      const messages=[['sistema','Sistema','Solicitação de demonstração criada.',false,0],['cliente',names[index%15],relato,false,1]];
      if(status!=='Novo') {
        messages.push(['sistema','Sistema','Equipe Demo iniciou a triagem.',false,15]);
        messages.push(['atendente','Equipe Demo','Olá! Recebemos sua solicitação e estamos conferindo os detalhes do pedido para orientar a solução.',false,25+i*3]);
        messages.push(['atendente','Equipe Demo','[DEMO NOV26] Conferência interna: pedido e itens analisados. Registro fictício para apresentação.',true,40+i*3]);
        if(instruction) messages.push(['atendente','Equipe Demo',instruction,false,65+i*3]);
        if(i===4) messages.push(['cliente',names[index%15],'Conseguem confirmar uma previsão? Ainda não recebi a atualização.',false,120]);
        if(resolucao) messages.push(['sistema','Sistema',resolucao==='Reenvio'?'Caso concluído com reenvio. Rastreio fictício DEMO-RASTREIO-001.':`Caso concluído com estorno registrado de R$ ${refund.toFixed(2)}. Comprovante fictício DEMO-ESTORNO-${i+1}.`,false,(ended-opened)/60000]);
      }
      for(const [autor,nome,texto,interna,minutes] of messages) await c.query('INSERT INTO mensagens(ocorrencia_id,autor,autor_nome,texto,interna,enviado_em) VALUES($1,$2,$3,$4,$5,$6)',[row.id,autor,nome,texto,interna,new Date(opened.getTime()+minutes*60000)]);
      manifest.casos.push({...row,status,motivo,canal,pedido:pedido.numero,resolucao:resolucao||null});
    }
    await c.query('COMMIT');
    const output=path.resolve(__dirname,'../../outputs/demo-postec');
    await fs.mkdir(output,{recursive:true});
    await fs.writeFile(path.join(output,'demo-novembro-manifesto.json'),JSON.stringify(manifest,null,2));
    console.log(JSON.stringify({loja:loja.nome,pedidos:manifest.pedidos.length,ocorrencias:manifest.casos.length,porStatus:manifest.casos.reduce((r,x)=>(r[x.status]=(r[x.status]||0)+1,r),{})}));
  } catch(e) {await c.query('ROLLBACK');throw e;} finally {c.release();await pool.end();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
