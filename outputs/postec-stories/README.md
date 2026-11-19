# PosTec — Stories vertical

Vídeo: `postec_stories_1080x1920.mp4` — 25 segundos, 1080×1920 (9:16), 60 fps, H.264/AAC. Textos em português, telas reais do produto com dados fictícios, música instrumental sintetizada e efeitos. Sem narração. A publicação no Instagram não foi realizada.

## Editar e renderizar

- `source/scenes.js`: texto, posições, cores e animação.
- `source/timeline.html`: composição gerada e reproduzível; abrir com `?ar=9x16&play=1` para prévia da animação (sem som).
- `source/audio.py` e `source/sfx.py`: música original sintetizada, sem samples de terceiros.
- `assets/`: capturas da interface, logo e fontes locais.
- `SPEC.md`: roteiro e especificação. `brand.md`: fontes e limites das alegações.
- `review/`: quadros inspecionados e relatório técnico.

Ferramentas: Python, FFmpeg e Playwright Chromium. Dependências usadas: numpy 2.5.4, Pillow 13.0.0, Playwright 1.64.1. Instale em um ambiente virtual, sem alterar as dependências da aplicação:

```sh
python3 -m venv .venv
.venv/bin/pip install -r source/requirements.txt
.venv/bin/python -m playwright install chromium
.venv/bin/python source/build.py
.venv/bin/python source/audio.py
.venv/bin/python source/render_stream.py source/timeline.html source/sound.wav postec_stories_revisado.mp4 --ar 9x16 --fps 60
```

O renderizador envia cada frame diretamente ao FFmpeg e não acumula imagens temporárias. Não substitui um MP4 existente sem a opção `--overwrite`. É possível renderizar um teste com `--duration 1 --scale .5 --fps 30`.

A skill adaptada foi instalada em `~/.codex/skills/motion-designer`. O entrypoint original do autor está preservado em `references/upstream-workflow.md`; os templates, referências e scripts continuam disponíveis. Origem: https://github.com/gabrielgreco1/skills/tree/main/motion-designer.

## Capturas

`source/capture_product.py` usa a aplicação em `http://127.0.0.1:5187`, com as respostas da API interceptadas no navegador. Clientes, pedidos e mensagens são fictícios. O código da aplicação não foi alterado. As telas são recortadas para legibilidade no celular; os nomes não representam clientes reais.
