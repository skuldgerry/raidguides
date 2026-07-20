# Raid Guides

Guias em Português para as primeiras quatro wings de raids de Guild Wars 2.
O conteúdo foi preservado e está a ser revisto gradualmente; referências a
classes, builds e composições podem estar desatualizadas.

O projeto está dividido em duas aplicações e duas imagens Docker independentes:

- [`raidguides-landing`](./raidguides-landing): landing page estática de
  `www.raidguides.pt`, servida por Nginx.
- [`raidguides-docs`](./raidguides-docs): documentação Fumadocs de
  `docs.raidguides.pt`, incluindo pesquisa e assistente AI.

## Portas do stack

| Serviço | Porta do host | Porta do container | Domínio recomendado |
| --- | ---: | ---: | --- |
| Landing | `3000` | `8080` | `www.raidguides.pt` |
| Documentação | `3001` | `3000` | `docs.raidguides.pt` |

O reverse proxy deve encaminhar cada domínio para a respetiva porta. Não é
necessário routing por hostname dentro da aplicação Next.js.

## Deploy

O [`docker-compose.yml`](./docker-compose.yml) funciona como base para o stack
privado do Portainer. As credenciais do OpenRouter devem existir apenas nesse
stack privado; nunca no repositório público.

As duas imagens podem ser versionadas e atualizadas separadamente. Uma mudança
na landing não obriga a reconstruir a documentação, e uma atualização às guias
não altera o container público de `www`.

## Desenvolvimento local

### Landing page

```powershell
cd raidguides-landing
node preview.mjs
```

A landing fica disponível em `http://localhost:3000`.

### Documentação

```powershell
cd raidguides-docs
npm install
npm run dev -- --port 3001
```

Cria um `.env` a partir de `raidguides-docs/.env.example` apenas se quiseres
testar o assistente AI. A pesquisa e a leitura das guias funcionam sem uma chave
do OpenRouter.

## Conteúdo fora do repositório

Os dumps históricos do WordPress, backups e ficheiros de migração não fazem
parte do projeto publicado. Permanecem guardados localmente e estão excluídos
pelo `.gitignore` da raiz.
