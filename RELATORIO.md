# Relatório do Desafio Back-End — Folhagem & Cia

## O que foi feito

A missão principal foi aposentar a antiga planilha da Folhagem & Cia e construir uma API robusta, à prova de falhas de estoque e dados inválidos.

**CRUD Completo de Plantas:**

- POST /plantas: Cadastra novas plantas.
- GET /plantas: Lista todas as plantas com suporte a filtros combinados (luminosidade e petFriendly).
- GET /plantas/:id: Busca os detalhes de uma planta específica pelo ID.
- PATCH /plantas/:id: Atualização parcial das informações de uma planta.
- DELETE /plantas/:id: Remove uma planta do catálogo.

**Regras de Negócio e Financeiras:**

- POST /plantas/:id/venda: Decrementa o estoque de forma segura sem permitir valores negativos.
- GET /plantas/estoque/valor-total: Calcula a soma do valor total em centavos (preco * estoque) e o total de vasos disponíveis.

## Como foi feito (As analogias do Nosso JARDIM)

Para entender a arquitetura da aplicação, pensei em cada camada do projeto como um setor do funcionamento da nossa Floricultura Física:

**A arquitetura da Floricultura:**

- **O Balcão de Atendimento (Routes):** É onde o cliente chega com o pedido. As rotas apenas direcionam o pedido para o atendente correto (o Controller) dependendo da plaqueta na porta.
- **O Atendente Especializado (Controller):** Recebe o pedido do cliente. Ele inspeciona se o cliente preencheu a ficha corretamente (validação de dados), confere as regras da loja (se o valor não é negativo, se o tipo de luz existe) e chama o estoque.
- **O Gerente do Estoque (Repository):** É o único que tem a chave do galpão. Ele fala a língua do sistema do galpão (o Prisma) para buscar, criar ou atualizar as caixas de plantas no banco de dados.
- **O Sistema Central de Arquivos (Prisma + PostgreSQL):** É o banco de dados onde todas as informações ficam guardadas em gavetas organizadas (tabelas e modelos).

**Preço Guarda-Moedas (A Regra dos Centavos Inteiros):**

Em formato simples: Computadores às vezes "se confundem" quando tentam somar moedas quebradas e podem dizer que R$ 0,10 + R$ 0,20 dá R$ 0,30000000000000004! Para evitar essa "confusão" e não errar o caixa, guardamos os preços sempre em centavos inteiros (R$ 89,90 vira 8990).

**Planta sem Estoque Não é Planta inválida:**

Se a loja não tem mais a planta no estoque (estoque: 0), ela continua existindo no nosso sistema, só está esgotada! Da mesma forma, se a planta não é amigável para animais (petFriendly: false), o cadastro continua sendo aceito. O sistema foi ensinado a diferenciar quando uma informação veio com o valor zero de quando alguém simplesmente esqueceu de preencher.

**Entendendo as perguntas dos clientes (req.query):**

Quando alguém pesquisa por "plantas para pet" na internet, o site envia a palavra "true" escrita em texto puro. O nosso sistema foi ajustado para entender o que é um texto e o que é uma resposta do tipo "sim ou não" verdadeira, sem misturar os filtros.

**A fila do balcão (vender sem faltar estoque):**

Em formato simples: Se restam 2 vasos no estoque e chegam dois clientes ao mesmo tempo tentando levar 2 vasos cada um, o primeiro que fechar a compra leva, e o segundo recebe um aviso amigável de que o produto acabou, sem deixar o estoque negativo. O sistema dá a baixa no estoque exatamente no momento da compra e impede que a loja venda o que não tem.

## Principais dificuldades

**PowerShell bloqueando scripts:**

- **O Problema:** Ao instalar o Yarn, o `npm` não rodou e o PowerShell avisou que a execução de scripts estava desabilitada no sistema.
- **A Solução:** Liberei scripts locais só para o meu usuário, com `Set-ExecutionPolicy RemoteSigned`.

**Docker pedindo o WSL:**

- **O Problema:** O Docker Desktop não iniciava e avisava que o WSL não estava instalado e, depois, que estava desatualizado.
- **A Solução:** Rodei `wsl --update` como administrador, reiniciei o computador e o Docker subiu.

**A API que caiu ao testar as rotas novas:**

- **O Problema:** A primeira requisição de cadastro falhou com "a conexão subjacente estava fechada". O cliente do Prisma dentro do container tinha sido gerado antes de existir a tabela Planta.
- **A Solução:** Gerei o cliente de novo dentro do container (`docker compose exec server yarn generate`) e reiniciei a API.

**git push rejeitado:**

- **O Problema:** O Git avisou que o GitHub tinha um commit que eu não tinha localmente, e o `pull` recusou porque havia arquivos modificados (só diferenças de fim de linha).
- **A Solução:** Descartei essas mudanças com `git restore`, fiz `git pull --rebase` e o push passou.

**tsconfig.json alterado sozinho:**

- **O Problema:** O Git mostrou o `tsconfig.json` como modificado sem eu ter mexido nele: o `baseUrl` tinha sido removido, o que poderia quebrar os atalhos como `@controllers`.
- **A Solução:** Desfiz com `git restore tsconfig.json` e conferi com o `yarn typecheck` e uma nova requisição.

## Uso de Inteligência Artificial

**Ferramenta Utilizada:** Claude (Anthropic).

**Como foi utilizada:** Usei o Claude como primeiro contato com a stack do projeto, para me guiar na instalação do ambiente, para gerar todo o código da API (repository, controller e rotas), que colei no projeto, e para entender os erros que apareceram. Também pedi explicações sobre o fluxo da arquitetura em camadas e sobre as regras do desafio.

**Validação e Aprendizado:** Testei as rotas e os casos de erro manualmente pelo PowerShell (Invoke-RestMethod) e rodei o `yarn typecheck`. Aprendi o fluxo rota, controller, repository e banco, a diferença entre os status 400, 404 e 500 e por que a venda confere e baixa o estoque numa única operação. Ainda estou aprendendo a explicar o código sozinha, principalmente as rotas e os status.