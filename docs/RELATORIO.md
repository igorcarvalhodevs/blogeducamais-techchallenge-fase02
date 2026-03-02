# Relatório Técnico — BlogEducaMais (Tech Challenge Fase 02)

## 1. Visão geral do projeto

O BlogEducaMais é uma API REST construída em Node.js para suportar uma plataforma educacional de publicações (blog) com foco na rede pública.  
O sistema permite que:
- **Alunos** consumam conteúdo: listagem, leitura e busca.
- **Docentes** gerenciem o conteúdo: criação, edição e exclusão de posts.

O projeto atende requisitos técnicos de:
- Persistência em banco SQL (PostgreSQL)
- Containerização (Docker)
- Automação (GitHub Actions)
- Testes com cobertura mínima (>= 20%)

---

## 2. Requisitos implementados

### 2.1 Endpoints REST

Leitura (alunos e professores):
- `GET /posts`
- `GET /posts/:id`
- `GET /posts/search?term=...`

Gestão (docentes):
- `POST /posts`
- `PUT /posts/:id`
- `DELETE /posts/:id`

No DELETE, quando o recurso não existe, a API retorna 404 (coerência REST).

### 2.2 Observação sobre duplicidade no enunciado
O enunciado lista `GET /posts` duas vezes:
- uma para alunos (listagem pública)
- outra para professores (gestão)

Neste projeto, **o mesmo endpoint atende ambos**, pois do ponto de vista técnico é a mesma ação (listar posts).  
A diferença é o “perfil de uso”, documentada e testada via regras de acesso para as rotas de escrita.

---

## 3. Arquitetura e organização do código

### 3.1 Padrão modular
A aplicação foi organizada por “módulos” para facilitar manutenção e escalabilidade.

Camadas:
- **routes**: definem endpoints e pipelines de middleware
- **middlewares**: regras transversais (ex.: simulação de permissão de professor)
- **validators**: validação de payload (POST/PUT)
- **controllers**: camada HTTP (req/res)
- **services**: regras de acesso ao banco (Prisma)
- **config**: inicialização do Prisma Client

### 3.2 Fluxo de uma requisição (exemplo: POST /posts)
1. request chega na rota `POST /posts`
2. middleware `requireTeacher` valida header `x-user-type`
3. validator valida `title/content/author`
4. controller chama service para persistir
5. service usa Prisma para gravar no PostgreSQL
6. resposta HTTP retorna `201`

### 3.3 Boas práticas aplicadas

- Separação de responsabilidades (Controller x Service)
- Injeção indireta de dependências via mock nos testes
- Testes unitários isolando camada de banco
- Tratamento explícito de erros do Prisma (P2025)
- Simulação de RBAC via middleware dedicado

---

## 4. Persistência e modelagem

### 4.1 Banco
- PostgreSQL 16 (Docker e CI)
- Prisma ORM gerencia schema e migrations

### 4.2 Entidade Post (resumo lógico)
Campos típicos:
- `id` (string/uuid ou int)
- `title` (string)
- `content` (string)
- `author` (string)
- `createdAt` / `updatedAt` (datas)

---

## 5. Controle de acesso (aluno x professor)

### 5.1 Motivação
O enunciado pede comportamentos diferentes para alunos e docentes, mas não exige autenticação.  
Para cumprir isso de forma objetiva e testável, foi adotada uma simulação por header.

### 5.2 Regra aplicada
- Rotas de **leitura**: liberadas para todos.
- Rotas de **escrita** (POST/PUT/DELETE): exigem `x-user-type: teacher`

Caso contrário:
- retorna `403 Forbidden`

> Nota: isso não substitui autenticação real; é uma simulação de permissão adequada ao escopo do desafio.

---

## 6. Containerização (Docker)

### 6.1 Dockerfile
A imagem:
- usa `node:20-alpine`
- instala dependências
- executa `prisma generate`
- inicia a API

### 6.2 docker-compose
Orquestra:
- serviço `db` (Postgres)
- serviço `api` (Node)
- `depends_on` com healthcheck para evitar subir a API antes do banco
- comando da API executa migrations antes de iniciar (boas práticas)

Isso garante consistência entre ambientes.

---

## 7. CI com GitHub Actions

O workflow:
- faz checkout do repo
- configura Node 20
- sobe Postgres como service
- executa install
- prisma generate
- roda migrations
- roda testes com cobertura

Benefícios:
- validações automáticas em push/PR
- reduz risco de regressões
- garante que o projeto roda em ambiente limpo (sem “dependência do computador do dev”)

---

## 8. Testes e cobertura

### 8.1 Ferramentas
- Jest (test runner)
- Supertest (requisições HTTP para testar endpoints)

### 8.2 Estratégia de testes
- Testes de acesso:
  - sem header teacher → 403
  - com header teacher → 201/200/204
- Testes de validação:
  - payload inválido → 400
- Testes de busca:
  - sem term → 400
  - com term → 200 e array

### 8.3 Cobertura
O projeto supera o mínimo de 20%.  
A cobertura é verificada via:
- terminal (resumo)
- relatório HTML em `coverage/lcov-report/index.html`

Os testes foram divididos em três categorias:

1. Testes de integração leve (Supertest) — validam fluxo HTTP.
2. Testes unitários de service — com Prisma mockado.
3. Testes de validação — garantem bloqueio de payload inválido.

A estratégia de mock evita dependência real de banco, garantindo determinismo e velocidade.

---

### 8.4 Tratamento de erros

- Erros de validação retornam 400.
- Falta de permissão retorna 403.
- Recurso inexistente retorna 404.
- Erros inesperados são tratados como 500.

No service, erros específicos do Prisma (como P2025) são capturados e convertidos em retorno booleano para controle explícito no controller.

---

### 8.5 Segurança

- Validação de payloads antes do acesso ao banco
- Separação de camadas para evitar lógica de negócio na rota
- Simulação de controle de acesso
- Estrutura preparada para futura implementação de autenticação JWT

---

## 9. Desafios enfrentados e como foram resolvidos

### 9.1 Duplicidade de endpoint no enunciado
**Desafio:** `GET /posts` aparece duas vezes com descrições diferentes.  
**Solução:** manter um único endpoint e documentar o “perfil de uso”, restringindo apenas rotas de escrita.

### 9.2 Erros 500 durante os testes
**Desafio:** erro 500 no endpoint de busca.  
**Causa comum:** função implementada mas não exportada no service, ou controller chamando objeto errado.  
**Solução:** garantir que `searchPosts` esteja em `module.exports` e que o controller chame `postService.searchPosts`.

### 9.3 Validação não bloqueando criação
**Desafio:** POST retornando 201 mesmo com body inválido.  
**Solução:** aplicar validators como middleware antes do controller (pipeline de rota).

### 9.4 Padronização de ambientes (local x CI x Docker)
**Desafio:** “no meu PC funciona”, mas no CI falha por falta de migrations.  
**Solução:** adicionar migrations no pipeline e no start do container, garantindo reprodutibilidade.

---

## 10. Conclusão

O BlogEducaMais entrega uma base sólida de API REST, com persistência, automação e testes, alinhada ao enunciado.  
Além do cumprimento dos requisitos, o projeto foi organizado para facilitar evolução futura (autenticação real, paginação, logging, segurança).

---

## 11. Próximas melhorias (fora do escopo do desafio)
- autenticação real (JWT) + RBAC
- paginação e filtros avançados
- observabilidade (logs estruturados)
- rate limiting e medidas de segurança
- versionamento da API