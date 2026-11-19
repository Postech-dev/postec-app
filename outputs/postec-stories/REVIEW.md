# Revisão final — PosTec Stories

Arquivo: postec_stories_1080x1920.mp4. 25,000 s, 1080×1920, 60 fps, 1.500 frames. H.264, yuv420p, faixa limitada BT.709; AAC estéreo 48 kHz. 2.859.439 bytes. Metadados e SHA-256 em metadata.json.

## Verificações realizadas

- [x] Roteiro: problema → organização → resolução → acompanhamento → chamada para conhecer a PosTec.
- [x] Identidade: logo fornecido, Manrope/DM Sans locais, laranja e fundo da landing page. Capturas reais da aplicação com dados fictícios explicitamente identificados.
- [x] Layout: 250 instantes, a 10 amostras/segundo; nenhuma sobreposição de texto, texto fora da área segura ou imagem cortada pelo quadro.
- [x] Quadros: 12 momentos de storyboard e 12 instantes nas transições (4,88; 5,06; 5,30; 9,88; 10,06; 10,30; 14,88; 15,06; 15,30; 19,88; 20,06; 20,30 s), além das folhas do MP4 decodificado a 1 e 4 fps.
- [x] Leitura em tamanho de celular: hierarquia e textos principais verificados na folha de 390 px. Dados secundários de interface não são a mensagem principal.
- [x] Arquivo final: zero quadros próximos de preto absoluto/branco absoluto pelo detector; decodificação sem erros; duração e dimensões conferidas.
- [x] Áudio: música e efeitos sintetizados com seed fixa, eventos em 5/10/15/20 s e clique em 12,16 s. Loudness medido em −14,49 LUFS; pico real −4,56 dBTP. Verificação técnica de áudio, sem avaliação auditiva humana.

## Ajustes feitos

1. O avanço de câmera inicialmente ultrapassava a borda segura; passou a ir de 99,2% a 100%.
2. A entrada da coluna de ocorrências foi atrasada até o título terminar sua revelação.
3. O logo recebeu composição de fundo para retirar a borda preta visível sobre o cinza.
4. Os textos de apoio passaram a 34 px.
5. A exportação foi normalizada para yuv420p/BT.709 e faixa limitada; o renderizador reutilizável recebeu os mesmos parâmetros e foi validado em uma exportação de 1 segundo.

## Observações

O detector de imobilidade sinalizou a cartela final após 21,05 s e 23,33 s. É uma pausa intencional para leitura da marca, chamada e endereço. A música continua e encerra com fade. Não há fala; por isso, transcrição e legendas não se aplicam. As fichas do início são elementos editoriais; as telas das três cenas seguintes são capturas da UI real.

Revisão técnica e visual feita pelo agente. Feedback humano ainda não recebido para esta versão. O arquivo foi preparado para revisão e publicação manual; nenhuma publicação foi realizada.
