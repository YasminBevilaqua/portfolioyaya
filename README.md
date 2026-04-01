# Yasmin Portfólio

Portfólio front-end em **React + Vite + TypeScript** (SPA).

## Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- React Three Fiber / Drei (background e planetas)

## Scripts

- `npm install` — instalar dependências
- `npm run dev` — rodar em modo desenvolvimento
- `npm run build` — gerar build de produção (usar para deploy)
- `npm run preview` — pré-visualizar o build localmente
- `npm run lint` — lint com ESLint
- `npm run test` — testes (Vitest)

## GitHub Pages (deploy)

O site é publicado no GitHub Pages em uma **subpasta**: `https://<usuario>.github.io/portfolioyaya/`.

Para manter o deploy funcionando nesse caminho:
- `vite.config.ts` define `base` durante o build
- o router usa `HashRouter` para evitar problemas com rotas no Pages
- assets como imagens usam `import.meta.env.BASE_URL`

Workflow: o deploy é feito automaticamente por GitHub Actions em cada `push` na branch `main`.

## Observações

Se algum recurso está “antigo” no navegador após atualizar o deploy, faça `Ctrl + F5` (cache).
