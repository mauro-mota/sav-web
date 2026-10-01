# Savannah Hub — savannah.ag

Site estático (HTML, CSS e JS puros), sem build. A raiz deste repositório é exatamente o que o Cloudflare Pages publica; todo push em `main` vai ao ar em cerca de um minuto.

## Estrutura
- `index.html` — página única: hero, soluções, processo, cases, resultados, contato, rodapé.
- `styles.css` — mobile-first, variáveis em `:root`, breakpoints em 480/600/640/700/900/1024px. Sem frameworks.
- `script.js` — menu, vídeo do hero (troca 1:1 / 16:9 e só toca visível), carrossel de cases, atalho fixo de WhatsApp.
- `config.js` — número e mensagens de WhatsApp (`window.SAVANNAH_CONFIG`). As mensagens começam com "Opa!".
- `assets/` — imagens já otimizadas (WebP); posters e vídeos do hero em `assets/ze-tech/`. Zé no balcão (seção de contato) em três formatos: `ze-balcao-{desktop,mobile}-animado.avif` (preferido, inserido via `script.js` fora de Safari/iOS), `-animado.webp` (fallback) e `ze-balcao-{desktop,mobile}.webp` (estático, para quem reduz movimento). Ao trocar a animação, substitua os seis arquivos mantendo nomes e dimensões (1440×600 e 720×600).
- `robots.txt`, `sitemap.xml` — atualize o `<lastmod>` do sitemap quando o conteúdo mudar.
- `_headers` — cabeçalhos do Cloudflare Pages: segurança em tudo e cache de 1 semana em `/assets/*`. Como os assets mantêm o nome ao serem trocados, visitantes antigos podem ver a versão anterior por até uma semana; para forçar, mude o nome do arquivo ou acrescente `?v=2` na referência.
- `_redirects` — manda para a home os arquivos internos que não devem abrir no site (`CLAUDE.md`, `publicar.command`, `.gitignore`). Ao criar outro arquivo interno na raiz, acrescente-o aqui.
- `publicar.command` — script (Mac) que faz o mesmo fluxo do comando "Publica" com duplo clique. Não altere sem pedido.

## Comando "Publica"
As edições de design chegam como um `site.zip` em `~/Downloads`, com o conteúdo correspondente à raiz deste repositório (às vezes dentro de uma pasta `site/`). Ao receber "Publica" (com ou sem caminho):
1. Se não vier caminho, use o `.zip` mais recente de `~/Downloads` que contenha um `index.html`. Diga qual arquivo escolheu.
2. `git pull --ff-only` antes de tudo, para partir da versão da nuvem.
3. Extraia e copie o conteúdo por cima da raiz (se o zip tiver uma pasta `site/`, use o conteúdo dela). Sobrescreva o que veio; nunca apague arquivos ausentes no zip sem confirmar (ex.: vídeos, este arquivo).
4. Mostre `git diff --stat` e resuma em português, em poucas linhas, o que mudou.
5. Pergunte: "Mensagem do commit? (Enter = usar a minha sugestão: <sugestão curta em pt-BR>)". Use o que o usuário escrever; se ele só confirmar, use a sugestão.
6. `git add -A`, commit com essa mensagem e `git push origin main`. Confirme com uma linha: "No ar em cerca de um minuto."
7. Apague o zip de `~/Downloads` depois do push. Se nada mudou, diga isso e não commite.

## Regras
- Não introduzir build step, frameworks, Tailwind nem dependências — o deploy é a raiz, sem build.
- Manter o visual: paleta em `:root` (`--bg #0A0C0A`, `--green #16B074`, `--mint #3DD898`, `--ink #04130C`, `--white #F4F7F3`), fonte Inter, botões pílula.
- Não renomear classes e ids usados por `script.js`: `.ze-tech`, `.cases-track`, `.case`, `.menu-toggle`, `.menu`, `[data-whatsapp]`, `.mobile-contact`, `#year`.
- Não recomprimir ou trocar assets sem pedido.
- Textos em pt-BR, sem emoji.

## Pendências
- Cases: 6 placeholders `.case-placeholder` em `index.html` aguardam os embeds do VTurb. Ao colar, substitua o `<div class="case-placeholder">…</div>` pelo embed, dentro de `.case-media` (o card já tem `aspect-ratio: 9/16`). O carrossel detecta vídeos tocando com som, inclusive em shadow DOM, e pausa sozinho.

## Pendências
- Cases: 6 placeholders `.case-placeholder` em `index.html` aguardam os embeds do VTurb. Ao colar, substitua o `<div class="case-placeholder">…</div>` pelo embed, dentro de `.case-media` (o card já tem `aspect-ratio: 9/16`). O carrossel detecta vídeos tocando com som, inclusive em shadow DOM, e pausa sozinho.
