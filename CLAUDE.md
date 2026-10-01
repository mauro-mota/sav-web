# Savannah Hub — savannah.ag

Site estático (HTML, CSS e JS puros), sem build. A raiz deste repositório é exatamente o que o Cloudflare Pages publica; todo push em `main` vai ao ar em cerca de um minuto.

## Estrutura
- `index.html` — página única: hero, soluções, processo, cases, resultados, contato, rodapé.
- `styles.css` — mobile-first, variáveis em `:root`, breakpoints em 480/600/640/700/900/1024px. Sem frameworks.
- `script.js` — menu, vídeo do hero (troca 1:1 / 16:9 e só toca visível), carrossel de cases, atalho fixo de WhatsApp.
- `config.js` — número e mensagens de WhatsApp (`window.SAVANNAH_CONFIG`). As mensagens começam com "Opa!".
- `assets/` — imagens já otimizadas (WebP); posters e vídeos do hero em `assets/ze-tech/`.
- `robots.txt`, `sitemap.xml` — atualize o `<lastmod>` do sitemap quando o conteúdo mudar.
- `publicar.command` — script (Mac) que aplica o `site.zip` mais novo de ~/Downloads por cima deste repositório, commita e dá push. Não altere sem pedido.

## Comando "Publica <zip>"
As edições de design chegam como um `site.zip` cujo conteúdo (pasta `site/`) corresponde à raiz deste repositório. Ao receber "Publica <caminho do zip>":
1. Extraia e copie o conteúdo por cima da raiz (se o zip tiver uma pasta `site/`, use o conteúdo dela). Sobrescreva o que veio; não apague arquivos ausentes no zip sem confirmar (ex.: vídeos, este arquivo).
2. Mostre `git diff --stat` e resuma em português o que mudou.
3. Commit com mensagem descritiva em português (ex.: "Hero: centraliza descrição no desktop") e `git push origin main`.
4. Se nada mudou, diga isso e não commite.

## Regras
- Não introduzir build step, frameworks, Tailwind nem dependências — o deploy é a raiz, sem build.
- Manter o visual: paleta em `:root` (`--bg #0A0C0A`, `--green #16B074`, `--mint #3DD898`, `--ink #04130C`, `--white #F4F7F3`), fonte Inter, botões pílula.
- Não renomear classes e ids usados por `script.js`: `.ze-tech`, `.cases-track`, `.case`, `.menu-toggle`, `.menu`, `[data-whatsapp]`, `.mobile-contact`, `#year`.
- Não recomprimir ou trocar assets sem pedido.
- Textos em pt-BR, sem emoji.

## Pendências
- Cases: 6 placeholders `.case-placeholder` em `index.html` aguardam os embeds do VTurb. Ao colar, substitua o `<div class="case-placeholder">…</div>` pelo embed, dentro de `.case-media` (o card já tem `aspect-ratio: 9/16`). O carrossel detecta vídeos tocando com som, inclusive em shadow DOM, e pausa sozinho.
