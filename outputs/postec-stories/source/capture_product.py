"""Capture the actual local PosTec UI with isolated, fictional API fixtures."""
import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'
ASSETS.mkdir(exist_ok=True)
BASE = 'http://127.0.0.1:5187'
ITEMS = []
for i, (name, status, motivo) in enumerate([
    ('Ana Lima', 'Novo', 'Produto com defeito'),
    ('Bruno Silva', 'Novo', 'Troca de tamanho'),
    ('Clara Souza', 'Em Triagem', 'Troca de tamanho'),
    ('Diego Alves', 'Aguardando Devolução', 'Produto divergente'),
    ('Elisa Costa', 'Reenvio Solicitado', 'Produto com defeito'),
    ('Felipe Rocha', 'Estorno Solicitado', 'Devolução'),
]):
    ITEMS.append(dict(id=i+1, protocolo=f'PTC-2026-{i+1:04}', status=status,
        motivo=motivo, descricao='Gostaria de trocar o tamanho do produto.',
        pedido_id=i+1, numero_pedido=f'#{1042+i}', cliente_nome=name,
        cliente_email=f'demo{i+1}@example.com', cliente_cpf='',
        produto='Camiseta Essential - Tam M (1 un.)', pedido_valor=89.90,
        criado_em='2026-10-30T12:20:00', data_compra='2026-10-27',
        ultima_atividade='2026-10-30T14:20:00', ultimo_autor='cliente',
        canal='portal', nao_lida=False, responsavel='Equipe PosTec'))
MESSAGES = [
    dict(id=1, autor='cliente', autor_nome='Clara Souza', texto='Olá! Preciso trocar a camiseta pelo tamanho G.', enviado_em='2026-10-30T12:20:00'),
    dict(id=2, autor='atendente', autor_nome='Equipe PosTec', texto='Olá, Clara! Vamos ajudar com a troca. Seu pedido já está em análise.', enviado_em='2026-10-30T12:25:00'),
    dict(id=3, autor='cliente', autor_nome='Clara Souza', texto='Obrigada! Aguardo as orientações.', enviado_em='2026-10-30T12:28:00'),
]

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={'width':1440,'height':1000}, device_scale_factor=2)
        await ctx.add_init_script("""localStorage.setItem('postec:sessao', JSON.stringify({token:'video-demo-only',usuario:{id:1,nome:'Equipe PosTec',email:'demo@example.com',papel:'Administradora',lojaNome:'Loja Demo',lojaId:1,lojaSlug:'loja-demo',lojaPlano:'pro'}}));""")
        async def api(route):
            path = route.request.url.split('/api',1)[1]
            if path == '/painel/contagens': data = {'novas':2,'nao_lidas':0}
            elif path == '/painel/ocorrencias': data = ITEMS
            elif path.endswith('/lida'): data = {}
            elif path.startswith('/painel/ocorrencias/'):
                data = dict(ITEMS[2], mensagens=MESSAGES)
            elif path == '/portal/loja-demo':
                data = dict(id=1,nome='Loja Demo',slug='loja-demo',email='demo@example.com',plano='pro',prazo_resposta_dias=2,endereco_devolucao='Endereço de demonstração')
            else: data = []
            await route.fulfill(json=data)
        await ctx.route('**/api/**', api)
        page = await ctx.new_page()
        await page.goto(BASE+'/ocorrencias/kanban')
        await page.get_by_text('Seu pós-venda, sob controle.').wait_for()
        await page.evaluate('document.fonts.ready')
        await page.screenshot(path=str(ASSETS/'painel.png'))
        await page.locator('.kanban-coluna').nth(0).screenshot(path=str(ASSETS/'coluna-novos.png'))
        await page.locator('.kanban-coluna').nth(1).screenshot(path=str(ASSETS/'coluna-triagem.png'))
        column = await page.locator('.kanban-coluna').nth(0).bounding_box()
        last = await page.locator('.kanban-coluna').nth(0).locator('.kanban-cartao').last.bounding_box()
        column['height'] = last['y'] + last['height'] - column['y'] + 12
        await page.screenshot(path=str(ASSETS/'kanban-focus.png'), clip=column)
        await page.goto(BASE+'/ocorrencias/PTC-2026-0003')
        await page.get_by_text('Como vamos resolver?').wait_for()
        await page.evaluate('document.fonts.ready')
        await page.screenshot(path=str(ASSETS/'caso.png'))
        await page.locator('.detalhe-acao').screenshot(path=str(ASSETS/'acoes.png'))
        await page.locator('.detalhe-historico-wrap').screenshot(path=str(ASSETS/'conversa.png'))
        await page.set_viewport_size({'width':390,'height':844})
        await page.goto(BASE+'/portal/loja-demo')
        await page.get_by_text('Consultar pedido',exact=False).first.wait_for()
        await page.evaluate('document.fonts.ready')
        await page.screenshot(path=str(ASSETS/'portal.png'))
        await page.locator('.pc-bloco').nth(1).locator('..').screenshot(path=str(ASSETS/'portal-acompanhar.png'))
        await browser.close()
    (ASSETS/'fixtures.json').write_text(json.dumps({'note':'Fictional demo data. All API calls intercepted; no production access.','items':ITEMS,'messages':MESSAGES},ensure_ascii=False,indent=2))
    print('Captured actual PosTec screens:', ', '.join(x.name for x in ASSETS.glob('*.png')))

asyncio.run(main())
