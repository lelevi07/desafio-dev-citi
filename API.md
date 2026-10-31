# API Folhagem & Cia

## Visão geral

API REST que substitui a planilha de estoque da loja de plantas Folhagem & Cia. Permite cadastrar, listar, buscar, editar e remover plantas, registrar vendas (com baixa de estoque) e consultar o valor total do estoque.

**Stack:** Node.js, Express, TypeScript, Prisma, PostgreSQL e Docker.

**Organização:** `routes.ts` liga cada URL a uma função do controller; o controller valida os dados e escolhe o status HTTP; o repository é a única camada que conversa com o banco.

## Como rodar

Pré-requisitos: Docker Desktop aberto, Node.js 20+ e Yarn.

```
cp .env.example .env        # no Windows: copy .env.example .env
yarn
docker compose up -d --build
yarn migration
```

A API fica em `http://localhost:3001`. Para conferir, abra a URL no navegador.

## Modelo de dados

### Planta

| Campo | Tipo | Observação |
|---|---|---|
| `id` | Int | Gerado pelo banco |
| `nome` | String | Nome popular. Obrigatório, não vazio |
| `especie` | String | Nome científico. Obrigatório, não vazio |
| `preco` | Int | Em **centavos** (`8990` = R$ 89,90). Maior que zero |
| `estoque` | Int | Vasos disponíveis. Maior ou igual a zero |
| `luminosidade` | Luminosidade | Um dos valores do enum abaixo |
| `petFriendly` | Boolean | Segura para cães e gatos |
| `regaACadaDias` | Int | Intervalo de rega em dias. Mínimo 1 |
| `createdAt` / `updatedAt` | DateTime | Preenchidos automaticamente |

### Enum Luminosidade

`SOMBRA`, `MEIA_SOMBRA`, `SOL_PLENO`

## Rotas

### POST /plantas

Cadastra uma planta. Todos os campos (exceto `id`, `createdAt` e `updatedAt`) são obrigatórios.

Corpo:
```json
{
  "nome": "Samambaia",
  "especie": "Nephrolepis exaltata",
  "preco": 4990,
  "estoque": 10,
  "luminosidade": "MEIA_SOMBRA",
  "petFriendly": true,
  "regaACadaDias": 3
}
```

Resposta `201`:
```json
{
  "id": 1,
  "nome": "Samambaia",
  "especie": "Nephrolepis exaltata",
  "preco": 4990,
  "estoque": 10,
  "luminosidade": "MEIA_SOMBRA",
  "petFriendly": true,
  "regaACadaDias": 3,
  "createdAt": "2026-10-29T21:16:25.482Z",
  "updatedAt": "2026-10-29T21:16:25.482Z"
}
```

### GET /plantas

Lista as plantas. Filtros opcionais, sozinhos ou juntos:

| Parâmetro | Valores aceitos |
|---|---|
| `luminosidade` | `SOMBRA`, `MEIA_SOMBRA`, `SOL_PLENO` |
| `petFriendly` | `true` ou `false` |

Exemplo: `GET /plantas?luminosidade=MEIA_SOMBRA&petFriendly=true`

Resposta `200`: lista de plantas (lista vazia `[]` se nada corresponder).

### GET /plantas/:id

Busca uma planta pelo id. Resposta `200` com a planta.

### PATCH /plantas/:id

Edita só os campos enviados. Os campos enviados passam pelas mesmas regras do cadastro. Campos desconhecidos são ignorados.

Corpo:
```json
{ "preco": 5990 }
```

Resposta `200`: a planta atualizada.

### DELETE /plantas/:id

Remove a planta. Resposta `204`, sem corpo.

### POST /plantas/:id/venda

Registra uma venda e diminui o estoque.

Corpo:
```json
{ "quantidade": 2 }
```

`quantidade` deve ser inteiro maior que zero. Resposta `200`: a planta com o estoque atualizado.

### GET /plantas/estoque/valor-total

Soma `preco × estoque` de todas as plantas e o total de vasos.

Resposta `200`:
```json
{
  "valorTotalEmCentavos": 39920,
  "totalDeVasos": 8
}
```

Com nenhuma planta cadastrada, retorna `0` nos dois campos.

## Erros e status HTTP

Todo erro retorna um JSON com a mensagem: `{ "message": "..." }`.

| Rota | Status | Quando |
|---|---|---|
| `POST /plantas` | `400` | Campo faltando ou inválido (por exemplo, `preco` menor ou igual a zero) |
| `GET /plantas` | `400` | `luminosidade` fora do enum ou `petFriendly` diferente de `true`/`false` |
| `GET /plantas/:id` | `400` | `id` não é um número inteiro positivo |
| | `404` | Planta não existe |
| `PATCH /plantas/:id` | `400` | `id` inválido ou algum campo enviado inválido |
| | `404` | Planta não existe |
| `DELETE /plantas/:id` | `400` | `id` não é um número inteiro positivo |
| | `404` | Planta não existe |
| `POST /plantas/:id/venda` | `400` | `id` inválido, `quantidade` inválida ou estoque insuficiente |
| | `404` | Planta não existe |
| Qualquer rota | `404` | Rota inexistente (`Rota não encontrada`) |
| Qualquer rota | `500` | Erro inesperado no servidor |
