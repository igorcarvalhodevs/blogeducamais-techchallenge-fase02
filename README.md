# BlogEducaMais — Tech Challenge (Fase 02)

API REST em **Node.js + Express** para uma plataforma de blogging educacional, com persistência em **PostgreSQL** via **Prisma ORM**, containerização com **Docker** e CI com **GitHub Actions**.  
O objetivo é permitir que **alunos** consumam conteúdos (listagem/leitura/busca) e que **docentes** façam a gestão dos posts (criar/editar/excluir).

---

## Sumário
- [Contexto do problema](#contexto-do-problema)
- [Escopo e requisitos](#escopo-e-requisitos)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Regras de acesso (aluno x professor)](#regras-de-acesso-aluno-x-professor)
- [Endpoints](#endpoints)
- [Como rodar o projeto](#como-rodar-o-projeto)
  - [Com Docker (recomendado)](#com-docker-recomendado)
  - [Sem Docker (modo local)](#sem-docker-modo-local)
- [Testes e cobertura](#testes-e-cobertura)
- [CI/CD (GitHub Actions)](#cicd-github-actions)
- [Decisões técnicas](#decisões-técnicas)
- [Próximos passos](#próximos-passos)
- [Documentação completa](#documentação-completa)

---

## Contexto do problema

Professores e professoras da rede pública frequentemente não possuem uma plataforma prática e centralizada para publicar aulas e materiais para estudantes.  
Este projeto implementa o **Back-end** de uma aplicação de blogging para escalar nacionalmente, substituindo a solução anterior construída em OutSystems.

---

## Escopo e requisitos

### Requisitos funcionais (REST)
- `GET /posts` — **Lista de posts** (alunos visualizam todos os posts)
- `GET /posts/:id` — **Leitura de post** por ID
- `GET /posts/search?term=...` — **Busca** por termo no título ou conteúdo

Ações de gestão (docentes):
- `POST /posts` — **Criação** de post (title, content, author)
- `PUT /posts/:id` — **Edição** de post
- `DELETE /posts/:id` — **Exclusão** de post

> Observação: o enunciado lista `GET /posts` duas vezes (alunos e professores). Neste projeto, o mesmo endpoint atende ambos, mas a documentação destaca os dois “perfis” de uso.

### Requisitos técnicos
- Node.js + Express
- Banco de dados (SQL): PostgreSQL
- Prisma ORM
- Docker (API + Banco)
- GitHub Actions (CI)
- Testes unitários com pelo menos **20% de cobertura** (neste projeto a cobertura está acima do mínimo)

---

## Arquitetura

### Estrutura do projeto (resumo):

```text
src/
  app.js
  server.js
  config/
    prisma.js
  middlewares/
    requireTeacher.js
  modules/
    posts/
      post.routes.js
      post.controller.js
      post.service.js
      post.validators.js
prisma/
  schema.prisma
  migrations/
tests/
  post.service.test.js
  testSetup.js
  posts.test.js
  validators.test.js
Dockerfile
docker-compose.yml
jest.config.js
```

---

### Fluxo de requisição:

1. `routes` recebem a requisição
2. `middlewares` aplicam regras de acesso (quando necessário)
3. `validators` validam payloads (POST/PUT)
4. `controller` coordena a resposta HTTP
5. `service` acessa o Prisma e o PostgreSQL

---

## Tecnologias
- **Node.js** (runtime)
- **Express** (API REST)
- **PostgreSQL** (persistência)
- **Prisma** (ORM / migrations)
- **Jest + Supertest** (testes)
- **Docker + Docker Compose** (ambiente)
- **GitHub Actions** (CI)

---

## Regras de acesso (aluno x professor)

Este projeto **não implementa autenticação real** (login/roles).  
Para cumprir o requisito do desafio, a permissão é **simulada via header**:

- **Aluno**: pode **listar, ler e buscar** posts  
  → Não precisa header especial
- **Professor**: pode **criar/editar/excluir** posts  
  → Deve enviar o header:
```text
x-user-type: teacher
```

Se esse header não for enviado, as rotas de escrita retornam **403 Forbidden**.

---

## Endpoints

### Leitura (aluno e professor)
- `GET /posts` → lista posts
- `GET /posts/:id` → detalha post por ID
- `GET /posts/search?term=palavra` → busca por termo

### Gestão (somente professor)
- `POST /posts`
- `PUT /posts/:id`
- `DELETE /posts/:id`

DELETE retorna 404 quando o recurso não existe, mantendo coerência REST.

### Exemplo — Criar post (professor)

```bash
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -H "x-user-type: teacher" \
  -d '{
    "title": "Primeira Aula",
    "content": "Introdução ao tema",
    "author": "Prof. Maria"
  }'
```

---

## Códigos de Status Utilizados

```md
- 200 OK → leitura e atualização
- 201 Created → criação
- 204 No Content → exclusão bem-sucedida
- 400 Bad Request → validação falhou
- 403 Forbidden → ausência de permissão
- 404 Not Found → recurso inexistente
```

---

## Como rodar o projeto

### Com Docker (recomendado)

Pré-requisitos:
- Docker
- Docker Compose

1. Subir API + Banco:

```bash
docker compose up --build
```

2. A API estará em:

- http://localhost:3000

- healthcheck: GET http://localhost:3000/health

---

### Sem Docker (modo local)

Pré-requisitos:

- Node 20+

- PostgreSQL rodando localmente

1. Instalar dependências:

```bash
npm ci
```

2. Criar .env (use o .env.example como base)

3. Rodar migrations:

```bash
npx prisma migrate dev
```

4. Subir a aplicação:

```bash
npm run dev
```

---

### Testes e cobertura

Rodar testes:

```bash
npm test
```

Rodar testes com cobertura:

```bash
npm run test:coverage
```

Cobertura atual (Jest):

- Statements: ~87%

- Branches: ~83%

- Functions: 100%

- Lines: ~86%

Relatório HTML:

- coverage/lcov-report/index.html

```md
> Nota: `src/config/prisma.js` pode aparecer com 0% no relatório porque o Prisma é **mockado** nos testes unitários (boa prática para não depender do banco).
```

---

### CI/CD (GitHub Actions)

O pipeline em .github/workflows/ci.yml executa:

- npm ci

- prisma generate

- sobe Postgres como service

- prisma migrate deploy (ou alternativa)

- npm run test:coverage

Isso garante que PRs e pushes sejam validados automaticamente.

---

### Decisões técnicas

- PostgreSQL foi escolhido por ser SQL (requisito) e amplamente utilizado em produção.

- Prisma foi escolhido por produtividade, migrations e tipagem clara do schema.

- Express foi escolhido por simplicidade e adequação ao escopo do desafio.

- Controle de acesso por header foi adotado por ser compatível com o enunciado e manter o projeto objetivo.

---

### Segurança (resumo)

- Validação de payloads antes do acesso ao banco (POST/PUT)
- Controle de acesso simulado via middleware (`x-user-type: teacher`)
- Tratamento explícito de recursos inexistentes (404) e validações (400)
- Preparado para evolução com autenticação real (JWT/RBAC)

---

### Próximos passos

- Autenticação real (JWT / sessions) e RBAC por roles

- Paginação em GET /posts

- Logs estruturados (pino/winston)

- Rate limit e hardening de segurança

- Versionamento de API (ex: /v1/posts)

---

### 📄 Documentação Completa

O relatório técnico detalhado encontra-se em:

👉 `docs/RELATORIO.md`

---

## 🎥 Demonstração da Aplicação

Este vídeo apresenta uma demonstração do funcionamento da API REST
desenvolvida para o projeto BlogEducaMais, incluindo:

- Listagem de postagens
- Busca por palavras-chave
- Criação de postagens (perfil professor)
- Edição de postagens (perfil professor)
- Exclusão de postagens (perfil professor)

📺 Assista ao vídeo:
https://www.youtube.com/watch?v=tTGK9wcJaos

---

### Equipe do Projeto (Tech Challenge)

Projeto desenvolvido para fins acadêmicos e portfólio, com foco em arquitetura lógica, segurança e organização de sistemas.

Integrantes:

- Igor Carvalho 
  GitHub: https://github.com/igorcarvalhodevs

- Igor Dutra Pereira
  GitHub: https://github.com/IgorDutraPereira

- Arthur Cruz
  GitHub: https://github.com/ArthurCruzADS

- Henrique Rodrigues
  GitHub: https://github.com/henri-ralmeida

- Vincenzo Rivelli
  GitHub: https://github.com/Vint000


