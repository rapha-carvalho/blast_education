## CurrÃ­culo Atualizado

---

### NÃVEL 1 â Fundamentos

> **Objetivo**: Entender o que Ã© SQL, por que ele existe, onde ele se encaixa no mundo moderno e escrever suas primeiras queries reais.

---

#### MÃ³dulo 1: SQL e o Mundo de Dados Moderno

**Por que este mÃ³dulo existe**: Antes de escrever uma Ãºnica linha de SQL, os alunos precisam entender o cenÃ¡rio. Este Ã© o mÃ³dulo de "orientaÃ§Ã£o" â onde os dados ficam, como eles se movem e onde o SQL se encaixa?

**Objetivos de Aprendizado**:
1. Explicar o que Ã© SQL e por que as empresas o usam em vez de apenas planilhas.
2. Descrever o que Ã© um banco de dados e como as tabelas, linhas e colunas se relacionam entre si.
3. Diferenciar OLTP de OLAP com um exemplo de negÃ³cio real.
4. Explicar ETL vs ELT e por que ELT se tornou o padrÃ£o moderno.
5. Nomear as categorias de infraestrutura de dados moderna (cloud warehouse, data lake, lakehouse) e descrever o que cada uma faz.
6. Explicar como o SQL se conecta a resultados analÃ­ticos, como dashboards, relatÃ³rios e funis.

---

##### Aula 1.1 â O que Ã© SQL e por que isso importa?

**Contexto de negÃ³cio**: Todas as empresas â de uma startup de entrega de comida a uma grande varejista â operam com dados armazenados em bancos de dados. O SQL Ã© a linguagem universal que os analistas usam para fazer perguntas a esses bancos de dados.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Explicar o SQL em linguagem simples para um colega nÃ£o tÃ©cnico.
- Descrever a diferenÃ§a entre "clicar em filtros no Excel" vs "escrever uma query".
- Explicar o que significa "linguagem declarativa" sem jargÃµes tÃ©cnicos.
- Identificar trÃªs tipos de perguntas de negÃ³cio que exigem SQL.

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

##### Aula 1.2 â O que Ã© um Banco de Dados? Tabelas, Linhas e Colunas

**Contexto de negÃ³cio**: A GrooveCommerce tem um banco de dados com tabelas para clientes, pedidos, produtos e campanhas de marketing. Entender o que cada peÃ§a significa Ã© o primeiro passo para fazer perguntas Ãºteis.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Descrever a diferenÃ§a entre um banco de dados, uma tabela, uma linha e uma coluna.
- Explicar o que Ã© uma chave primÃ¡ria (o ID exclusivo para cada linha).
- Explicar o que Ã© uma chave estrangeira (uma coluna que conecta uma tabela a outra).
- Descrever por que os tipos de dados (texto, nÃºmero, data) sÃ£o importantes ao escrever queries.

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

##### Aula 1.3 â OLTP vs OLAP: Dois Trabalhos, Dois Tipos de Banco de Dados

**Contexto de negÃ³cio**: A GrooveCommerce usa dois sistemas diferentes: um processa pedidos de clientes ao vivo em tempo real (OLTP) e outro Ã© usado pela equipe de anÃ¡lise para executar relatÃ³rios e dashboards (OLAP). Saber qual sistema vocÃª estÃ¡ consultando muda a forma como vocÃª escreve queries.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Explicar o que o OLTP faz e dar trÃªs exemplos do mundo real.
- Explicar o que o OLAP faz e dar trÃªs exemplos do mundo real.
- Descrever por que vocÃª nÃ£o executa queries analÃ­ticas pesadas no banco de dados OLTP de produÃ§Ã£o.
- Identificar em qual sistema um analista geralmente trabalha.

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

> â ï¸ **Aviso de Erro Comum**: VocÃª ainda nÃ£o aprendeu `GROUP BY` â nÃ£o se preocupe com a sintaxe. O objetivo aqui Ã© *ver* como Ã© uma query analÃ­tica e como ela Ã© diferente de uma pesquisa de uma Ãºnica linha. VocÃª dominarÃ¡ o `GROUP BY` em mÃ³dulos futuros.

---

##### Aula 1.4 â ETL, ELT e Como os Dados Chegam ao Data Warehouse

**Contexto de negÃ³cio**: Os dados nÃ£o aparecem magicamente no data warehouse de anÃ¡lise. AlguÃ©m (ou alguma ferramenta) precisa movÃª-los para lÃ¡ a partir dos sistemas ao vivo. Entender esse pipeline ajuda os analistas a saberem *por que* os dados Ã s vezes parecem diferentes no data warehouse em comparaÃ§Ã£o com o aplicativo ao vivo.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Explicar ETL (Extract, Transform, Load) e onde as transformaÃ§Ãµes acontecem.
- Explicar ELT (Extract, Load, Transform) e por que agora Ã© a abordagem dominante na nuvem.
- Nomear dois tipos de ferramentas que executam ELT (ex: Fivetran/Airbyte para extraÃ§Ã£o; dbt para transformaÃ§Ã£o).
- Explicar por que um analista pode ver tabelas "brutas" vs tabelas "transformadas" em um data warehouse.

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

##### Aula 1.5 â Cloud Data Warehouses, Data Lakes e Lakehouses

**Contexto de negÃ³cio**: Em uma empresa moderna, a equipe de anÃ¡lise quase nunca trabalha diretamente no banco de dados de produÃ§Ã£o. Eles trabalham em um cloud data warehouse (como Snowflake, BigQuery ou Redshift) e, cada vez mais, em um lakehouse. Saber o que sÃ£o essas coisas â mesmo de forma conceitual â torna vocÃª um analista mais inteligente.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Descrever o que Ã© um cloud data warehouse e nomear trÃªs exemplos (como categorias, nÃ£o endossos de fornecedores).
- Explicar o que Ã© um data lake e por que ele existe ao lado de um data warehouse.
- Explicar o que Ã© um lakehouse e por que ele surgiu (combinando o melhor dos dois).
- Descrever por que o SQL ainda funciona nos trÃªs ambientes.

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

#### â Ponto de VerificaÃ§Ã£o A â RevisÃ£o de Fundamentos

**PropÃ³sito**: Confirmar que os alunos entendem *por que* eles estÃ£o aprendendo SQL antes de se aprofundarem. Este Ã© um ponto de verificaÃ§Ã£o conceitual + SQL leve.

**Habilidades testadas**: Aula 1.1â1.5 (PropÃ³sito do SQL, estrutura de banco de dados, OLTP/OLAP, ETL/ELT, conceitos de infraestrutura, SELECT bÃ¡sico).

**Desafios do Ponto de VerificaÃ§Ã£o**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---
### NÃVEL 2 â SQL AnalÃ­tico Central

> **Objetivo**: Filtrar, resumir e combinar dados em vÃ¡rias tabelas. Este Ã© o trabalho diÃ¡rio de um analista financeiro, de marketing ou analista de dados jÃºnior.

---

#### MÃ³dulo 2: Filtrando e Fatiando Dados

**Por que este mÃ³dulo existe**: A anÃ¡lise quase sempre comeÃ§a com um filtro. "Mostre-me os pedidos do Ãºltimo trimestre." "Mostre-me os clientes no Brasil que nÃ£o compram hÃ¡ 60 dias." A clÃ¡usula `WHERE` Ã© o principal bisturi do analista.

**Objetivos de Aprendizado**:
1. Filtrar linhas usando `WHERE` com operadores de comparaÃ§Ã£o.
2. Combinar mÃºltiplas condiÃ§Ãµes com `AND`, `OR` e parÃªnteses.
3. Filtrar intervalos com `BETWEEN` e conjuntos com `IN`.
4. Buscar padrÃµes de texto usando `LIKE`.
5. Lidar corretamente com valores ausentes usando `IS NULL` e `IS NOT NULL`.
6. Ordenar e limitar resultados usando `ORDER BY` e `LIMIT`.

---

##### Aula 2.1 â WHERE e Operadores de ComparaÃ§Ã£o

**Contexto de negÃ³cio**: A equipe financeira da GrooveCommerce precisa encontrar pedidos grandes para reconciliaÃ§Ã£o. Seu trabalho Ã© filtrar a tabela de pedidos para trazer as linhas relevantes.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Escrever uma clÃ¡usula `WHERE` usando `=`, `!=`, `>`, `<`, `>=`, `<=`.
- Explicar a diferenÃ§a entre `=` e `!=` em linguagem simples.
- Filtrar uma coluna de data usando um operador de comparaÃ§Ã£o.
- Combinar o filtro de uma coluna com uma ordenaÃ§Ã£o.

> â ï¸ **Aviso de Erro Comum**: `WHERE status = NULL` nunca retornarÃ¡ linhas. NULL nÃ£o Ã© um valor â Ã© a *ausÃªncia* de um valor. Use sempre `IS NULL`. VocÃª praticarÃ¡ isso corretamente na Aula 2.5.

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

##### Aula 2.2 â AND, OR e ParÃªnteses

**Contexto de negÃ³cio**: O marketing precisa de clientes que estejam nos EUA E tenham um endereÃ§o de e-mail. O financeiro precisa de pedidos que foram cancelados OU reembolsados. Combinar condiÃ§Ãµes com precisÃ£o Ã© essencial.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Combinar dois filtros usando `AND`.
- Combinar dois filtros usando `OR`.
- Usar parÃªnteses para controlar a ordem lÃ³gica (`AND` antes de `OR` sem parÃªnteses pode causar bugs).
- Descrever o que acontece quando `AND` e `OR` sÃ£o misturados sem parÃªnteses.

> â ï¸ **Aviso de Erro Comum**: `WHERE status = 'cancelado' OR status = 'reembolsado' AND valor_total > 100` NÃO funciona como a maioria das pessoas espera. O SQL avalia o `AND` antes do `OR` (como a multiplicaÃ§Ã£o antes da adiÃ§Ã£o). Use parÃªnteses: `WHERE (status = 'cancelado' OR status = 'reembolsado') AND valor_total > 100`.

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

##### Aula 2.3 â BETWEEN e IN

**Contexto de negÃ³cio**: RelatÃ³rios frequentemente exigem filtros de intervalo ("pedidos no 1Âº trimestre") e filtros de lista ("clientes nestes paÃ­ses"). `BETWEEN` e `IN` tornam isso mais limpo do que encadear vÃ¡rias condiÃ§Ãµes `AND`/`OR`.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Filtrar um intervalo numÃ©rico usando `BETWEEN`.
- Filtrar um intervalo de datas usando `BETWEEN`.
- Filtrar uma coluna contendo uma lista de valores usando `IN`.
- Combinar `IN` com `AND` para filtragem de mÃºltiplas condiÃ§Ãµes.

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

##### Aula 2.4 â LIKE e CorrespondÃªncia de PadrÃµes

**Contexto de negÃ³cio**: O marketing estÃ¡ limpando a lista de e-mails de clientes. Eles precisam encontrar registros com domÃ­nios de e-mail especÃ­ficos ou clientes cujos nomes comeÃ§am com certas letras. O `LIKE` possibilita a correspondÃªncia de padrÃµes de texto.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Usar `LIKE` com `%` para padrÃµes "comeÃ§a com", "termina com" e "contÃ©m".
- Usar `LIKE` com `_` para correspondÃªncia de caractere Ãºnico.
- Combinar `LIKE` com outras condiÃ§Ãµes usando `AND`.
- Explicar quando `NOT LIKE` Ã© Ãºtil.

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

##### Aula 2.5 â NULL: O Problema Silencioso dos Dados

**Contexto de negÃ³cio**: Alguns clientes nÃ£o preencheram o nÃºmero de telefone. Alguns pedidos ainda nÃ£o tÃªm data de entrega. NULL nÃ£o Ã© zero, nem uma string vazia â Ã© a ausÃªncia de dados. Tratar isso de forma errada Ã© um dos erros mais comuns dos analistas.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Explicar o que significa NULL (nÃ£o Ã© zero, nÃ£o estÃ¡ em branco â Ã© ausÃªncia de um valor).
- Filtrar corretamente por NULL usando `IS NULL`.
- Filtrar por valores nÃ£o nulos usando `IS NOT NULL`.
- Explicar por que `WHERE coluna = NULL` sempre retorna zero linhas (e por que isso Ã© um bug silencioso).

> â ï¸ **Aviso de Erro Comum**: `WHERE telefone = NULL` nunca retornarÃ¡ linhas. NULL nÃ£o pode ser igual a nada â incluindo ele mesmo. `NULL = NULL` Ã© avaliado como NULL, nÃ£o TRUE. Use sempre `IS NULL` ou `IS NOT NULL`.

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

##### Aula 2.6 â ORDER BY, LIMIT e OFFSET

**Contexto de negÃ³cio**: O CEO pede os "10 principais produtos por receita". O diretor financeiro quer ver os 20 pedidos mais caros. Ordenar e limitar Ã© a forma como vocÃª traz os dados mais relevantes rapidamente Ã  tona.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Ordenar os resultados de forma crescente (`ASC`) e decrescente (`DESC`).
- Ordenar por mÃºltiplas colunas.
- Limitar os resultados Ã s N primeiras linhas.
- Usar `OFFSET` para paginaÃ§Ã£o bÃ¡sica.

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---
#### MÃ³dulo 3: Agregando Dados â COUNT, SUM, GROUP BY, HAVING

**Por que este mÃ³dulo existe**: Este Ã© o coraÃ§Ã£o do SQL analÃ­tico. Todos os dashboards, relatÃ³rios financeiros e resumos de marketing sÃ£o construÃ­dos sobre agregaÃ§Ãµes. `GROUP BY` Ã© o conceito isolado mais importante deste curso.

**Objetivos de Aprendizado**:
1. Usar `COUNT`, `SUM`, `AVG`, `MIN` e `MAX` para resumir dados.
2. Agrupar resultados por uma ou mais colunas usando `GROUP BY`.
3. Filtrar resultados agregados usando `HAVING`.
4. Explicar a diferenÃ§a entre `WHERE` (filtra linhas antes da agregaÃ§Ã£o) e `HAVING` (filtra depois).
5. Usar `COUNT(DISTINCT ...)` para contar valores exclusivos.
6. Combinar agregaÃ§Ãµes com `ORDER BY` para criar resumos classificados.

---

##### Aula 3.1 â FunÃ§Ãµes de AgregaÃ§Ã£o: COUNT, SUM, AVG, MIN, MAX

**Contexto de negÃ³cio**: A equipe financeira pergunta: "Quanta receita geramos no mÃªs passado? Qual Ã© o tamanho mÃ©dio do pedido? Qual foi o maior pedido Ãºnico?" Todas essas perguntas exigem funÃ§Ãµes de agregaÃ§Ã£o.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Usar `COUNT(*)` para contar todas as linhas e `COUNT(coluna)` para contar valores nÃ£o nulos.
- Usar `SUM` para somar uma coluna numÃ©rica.
- Usar `AVG`, `MIN` e `MAX` em colunas numÃ©ricas e de data.
- Explicar por que `COUNT(*)` e `COUNT(coluna)` podem retornar nÃºmeros diferentes.

> â ï¸ **Aviso de Erro Comum**: `COUNT(coluna)` ignora NULLs. `COUNT(*)` conta todas as linhas, incluindo NULLs. Se vocÃª quiser saber quantos clientes tÃªm um endereÃ§o de e-mail, use `COUNT(email)` â nÃ£o `COUNT(*)`.

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

##### Aula 3.2 â GROUP BY: Agregando por Categoria

**Contexto de negÃ³cio**: A equipe de merchandising deseja ver a receita desdobrada por categoria de produto. A equipe de operaÃ§Ãµes quer contar quantos pedidos existem em cada status. `GROUP BY` Ã© como vocÃª adiciona "por categoria" a qualquer agregaÃ§Ã£o.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Escrever uma query `GROUP BY` com uma coluna de agrupamento.
- Escrever uma query `GROUP BY` com mÃºltiplas colunas de agrupamento.
- Explicar a regra: cada coluna no `SELECT` deve estar no `GROUP BY` ou dentro de uma funÃ§Ã£o de agregaÃ§Ã£o.
- Ordenar os resultados agrupados pelo valor da agregaÃ§Ã£o.

> â ï¸ **Aviso de Erro Comum**: Todas as colunas no seu `SELECT` que NÃO estiverem dentro de um agregado (`SUM`, `COUNT`, etc.) DEVEM aparecer no `GROUP BY`. Se nÃ£o estiverem, a maioria dos bancos de dados retornarÃ¡ um erro. Alguns (como o MySQL) retornarÃ£o dados errados silenciosamente â o que Ã© pior.

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

##### Aula 3.3 â WHERE vs HAVING: Filtros PrÃ© e PÃ³s-AgregaÃ§Ã£o

**Contexto de negÃ³cio**: VocÃª deseja ver apenas as categorias de produtos onde a receita total excede $ 10.000. VocÃª nÃ£o pode usar `WHERE` para isso porque o valor da receita nÃ£o existe atÃ© que o `GROUP BY` seja executado. Ã exatamente para isso que serve o `HAVING`.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Filtrar linhas antes da agregaÃ§Ã£o usando `WHERE`.
- Filtrar resultados agregados usando `HAVING`.
- Combinar `WHERE` e `HAVING` em uma Ãºnica query.
- Explicar por que `WHERE SUM(valor_total) > 1000` gera um erro.

> â ï¸ **Aviso de Erro Comum**: `WHERE SUM(valor_total) > 1000` sempre falharÃ¡ â vocÃª nÃ£o pode usar funÃ§Ãµes de agregaÃ§Ã£o dentro de uma clÃ¡usula `WHERE`. O `WHERE` Ã© executado antes do `GROUP BY` e ainda nÃ£o sabe o que Ã© a soma. Use `HAVING` para filtros pÃ³s-agregaÃ§Ã£o.

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

##### Aula 3.4 â COUNT(DISTINCT) e Contagem de Valores Ãnicos

**Contexto de negÃ³cio**: O marketing quer saber quantos clientes *Ãºnicos* fizeram pedidos no mÃªs passado â nÃ£o quantos pedidos ocorreram. Estes sÃ£o nÃºmeros muito diferentes. `COUNT(DISTINCT)` Ã© a resposta.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Usar `COUNT(DISTINCT coluna)` para contar valores exclusivos.
- Explicar a diferenÃ§a entre `COUNT(*)`, `COUNT(coluna)` e `COUNT(DISTINCT coluna)`.
- Aplicar `COUNT(DISTINCT)` em uma query com `GROUP BY`.
- UsÃ¡-lo para detectar dados duplicados em um conjunto de dados.

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

#### â Ponto de VerificaÃ§Ã£o B â RevisÃ£o do SQL AnalÃ­tico Central

**PropÃ³sito**: Os alunos agora devem ser capazes de filtrar, agregar e refletir sobre os dados. Este ponto de verificaÃ§Ã£o usa cenÃ¡rios de negÃ³cios com vÃ¡rias etapas.

**Desafios do Ponto de VerificaÃ§Ã£o**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---
#### MÃ³dulo 4: Juntando Tabelas (Joins)

**Por que este mÃ³dulo existe**: Uma Ãºnica tabela quase nunca contÃ©m tudo o que vocÃª precisa. QuestÃµes de negÃ³cios reais exigem a combinaÃ§Ã£o de dados de duas, trÃªs ou mais tabelas. Joins sÃ£o onde os iniciantes costumam errar de forma silenciosa e custosa.

**Objetivos de Aprendizado**:
1. Explicar o que um `JOIN` faz conceitualmente (combina linhas de duas tabelas usando uma chave de correspondÃªncia).
2. Escrever um `INNER JOIN` e explicar quais linhas ele exclui.
3. Escrever um `LEFT JOIN` e explicar o que acontece com as linhas nÃ£o correspondentes.
4. Depurar um join que produz mais linhas do que o esperado (a armadilha da duplicaÃ§Ã£o).
5. Juntar trÃªs tabelas em uma Ãºnica query.
6. Distinguir quando usar `INNER JOIN` vs `LEFT JOIN`.

---

##### Aula 4.1 â INNER JOIN: Apenas Registros Correspondentes

**Contexto de negÃ³cio**: VocÃª deseja ver os pedidos junto com os nomes dos clientes. Ambas as informaÃ§Ãµes vivem em tabelas separadas (`pedidos` e `clientes`). Um `INNER JOIN` conecta ambas â mas retorna apenas linhas onde hÃ¡ uma correspondÃªncia em ambos os lados.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Escrever um `INNER JOIN` de duas tabelas com uma clÃ¡usula `ON`.
- Usar apelidos (aliases) de tabela para tornar as queries fÃ¡ceis de ler.
- Explicar que o `INNER JOIN` exclui linhas sem correspondÃªncia (isso pode perder dados silenciosamente).
- Selecionar colunas especÃ­ficas de cada tabela usando a sintaxe `tabela.coluna`.

> â ï¸ **Aviso de Erro Comum**: `INNER JOIN` remove silenciosamente linhas sem correspondÃªncia. Se um pedido nÃ£o tiver cliente (porque o cliente foi excluÃ­do), ele desaparece dos seus resultados. Isso pode fazer com que seus nÃºmeros fiquem errados. Sempre pergunte: "Quais linhas eu posso estar perdendo?"

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

##### Aula 4.2 â LEFT JOIN: Mantenha Tudo Ã  Esquerda

**Contexto de negÃ³cio**: VocÃª quer uma lista de todos os clientes e quantos pedidos cada um fez. Alguns clientes nunca pediram nada. O `INNER JOIN` os faria desaparecer. O `LEFT JOIN` os mantÃ©m â com `NULL` nas colunas do pedido.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Escrever um `LEFT JOIN` e explicar o que os `NULL`s significam no resultado.
- Usar um `LEFT JOIN` + `WHERE tabela_direita.id IS NULL` para encontrar linhas "sem correspondÃªncia" (por exemplo, clientes que nunca fizeram um pedido).
- Explicar a diferenÃ§a entre `LEFT JOIN` e `INNER JOIN` com um exemplo concreto.
- Descrever quando o `RIGHT JOIN` Ã© redundante (basta inverter a ordem das tabelas e usar o `LEFT JOIN`).

> â ï¸ **Aviso de Erro Comum**: Se vocÃª adicionar um filtro `WHERE` para a tabela do lado direito em um `LEFT JOIN`, vocÃª secretamente o transformou em um `INNER JOIN`. `LEFT JOIN pedidos ON ... WHERE pedidos.status = 'entregue'` removerÃ¡ todas as linhas `NULL`. Mova os filtros para a clÃ¡usula `ON` se desejar manter as linhas sem correspondÃªncia.

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

##### Aula 4.3 â DepuraÃ§Ã£o de Join: Quando a Contagem de Linhas EstÃ¡ Errada

**Contexto de negÃ³cio**: VocÃª executa um join e, de repente, o relatÃ³rio de receita mostra o dobro do total esperado. Este Ã© um dos bugs mais comuns e perigosos no SQL analÃ­tico. Aprender a diagnosticar e corrigir isso Ã© uma habilidade de trabalho fundamental.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Identificar a duplicaÃ§Ã£o de linhas (multiplicaÃ§Ã£o) causada por um join "um para muitos".
- Usar `COUNT(*)` antes e depois de um join para detectar explosÃ£o de linhas.
- Corrigir a duplicaÃ§Ã£o com agregaÃ§Ã£o ou reestruturando a query.
- Descrever como se parece o erro de multiplicaÃ§Ã£o cruzada ("fan-out") em um relatÃ³rio real.

> â ï¸ **Aviso de Erro Comum**: Quando vocÃª junta uma tabela de lado "um" a uma tabela de lado "muitos" (por exemplo, um cliente para muitos pedidos) e entÃ£o agrega no lado "um", suas agregaÃ§Ãµes serÃ£o multiplicadas pelo nÃºmero de linhas no lado "muitos". Sempre conte as linhas em cada etapa ao depurar joins.

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

### NÃVEL 3 â SQL IntermediÃ¡rio

> **Objetivo**: Escrever queries reais de vÃ¡rias etapas. Lidar com datas, transformar dados bagunÃ§ados, escrever SQL legÃ­vel com CTEs e usar funÃ§Ãµes de janela (Window Functions).

---

#### MÃ³dulo 5: Datas e Tempo em SQL

**Por que este mÃ³dulo existe**: Quase toda questÃ£o analÃ­tica envolve tempo. "Receita deste mÃªs x mÃªs passado." "Safras de clientes por trimestre de cadastro." "UsuÃ¡rios ativos mÃ³veis em 30 dias." Dominar funÃ§Ãµes de data Ã© um diferencial chave para candidatos a analistas.

**Objetivos de Aprendizado**:
1. Extrair partes de uma data (ano, mÃªs, dia, dia da semana) usando funÃ§Ãµes de data.
2. Truncar datas para perÃ­odos padrÃ£o (dia, semana, mÃªs, trimestre, ano).
3. Calcular diferenÃ§as de tempo entre duas datas.
4. Filtrar intervalos de datas corretamente sem perder dados nos limites do perÃ­odo.
5. Construir comparaÃ§Ãµes de mÃªs a mÃªs e semana a semana.
6. Entender por que os fusos horÃ¡rios sÃ£o importantes conceitualmente (e o que significa o padrÃ£o UTC).

---

##### Aula 5.1 â Extraindo e Truncando Datas

**Contexto de negÃ³cio**: A Ã¡rea financeira precisa de uma tabela de receita mensal. O marketing precisa de uma contagem semanal de inscriÃ§Ãµes/cadastros. A coluna `data_criacao` armazena carimbos de data/hora (`timestamps`) completos â vocÃª precisa "arredondÃ¡-los" para o perÃ­odo que lhe interessa.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Usar `DATE_TRUNC` para arredondar um timestamp para o mÃªs, semana, trimestre ou ano.
- Usar `EXTRACT` (ou `DATE_PART`) para extrair os nÃºmeros de ano, mÃªs, dia e dia da semana.
- Explicar por que `DATE_TRUNC('month', data_criacao)` Ã© mais seguro do que `EXTRACT(month FROM data_criacao)` para agrupamento (preserva o ano).
- Agrupar pedidos por mÃªs e contar/somar os mesmos.

> â ï¸ **Aviso de Erro Comum**: Agrupar por `EXTRACT(month FROM data_criacao)` SEM o ano significa que Janeiro de 2023 e Janeiro de 2024 serÃ£o combinados no mesmo balde. Sempre use `DATE_TRUNC('month', data_criacao)` ou `EXTRACT(year FROM ...) + EXTRACT(month FROM ...)` juntos.

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

##### Aula 5.2 â AritmÃ©tica de Datas e DiferenÃ§as de Tempo

**Contexto de negÃ³cio**: Quantos dias se passaram entre um pedido sendo feito e entregue? Quantos clientes se cadastraram nos Ãºltimos 30 dias? A aritmÃ©tica de datas Ã© a maneira de responder a essas perguntas.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Subtrair duas datas para obter o nÃºmero de dias entre elas.
- Usar `CURRENT_DATE` ou `NOW()` para significar "hoje".
- Filtrar os registros dentro dos Ãºltimos `N` dias.
- Calcular mÃ©tricas baseadas em idade (dias desde o registro/cadastro, tempo de entrega).

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

##### Aula 5.3 â ComparaÃ§Ãµes de PerÃ­odos e Coortes (Cohorts)

**Contexto de negÃ³cio**: O CFO pergunta: "A receita estÃ¡ crescendo de um mÃªs para o outro?" O marketing pergunta: "Dos clientes que se inscreveram em Janeiro de 2024, quantos fizeram pedidos em seu primeiro mÃªs?" Essas sÃ£o as perguntas analÃ­ticas mais comuns em qualquer empresa.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Definir o que Ã© uma coorte (grupo de usuÃ¡rios que compartilham um evento e perÃ­odo de inÃ­cio).
- Construir uma tabela bÃ¡sica de coorte de cadastro usando `DATE_TRUNC`.
- Escrever uma query de mÃªs a mÃªs (uma prÃ©via â as window functions completas estarÃ£o no MÃ³dulo 7).
- Explicar por que a anÃ¡lise de coorte Ã© importante para churn (taxa de cancelamento) e retenÃ§Ã£o.

[INSERIR INFOGRAFICO/IMAGEM AQUI: GrÃ¡fico mostrando uma linha do tempo de coortes (por exemplo, novos cadastros em janeiro versus fevereiro) e como a retenÃ§Ã£o Ã© acompanhada ao longo dos meses seguintes.]

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

#### MÃ³dulo 6: Transformando e Limpando Dados

**Por que este mÃ³dulo existe**: Os dados do mundo real sÃ£o bagunÃ§ados. Os campos sÃ£o `NULL` quando nÃ£o deveriam ser. Os cÃ³digos de status precisam de rÃ³tulos. Os valores precisam ser categorizados. Limpar e transformar dados em SQL Ã© uma tarefa diÃ¡ria do analista e tambÃ©m Ã© uma entrada fundamental para o monitoramento da qualidade dos dados.

**Objetivos de Aprendizado**:
1. Usar `CASE WHEN` para criar colunas e segmentos condicionais.
2. Usar `COALESCE` para substituir valores `NULL` por padrÃµes.
3. Usar `NULLIF` para converter valores especÃ­ficos em `NULL`.
4. Aplicar funÃ§Ãµes bÃ¡sicas de strings (`UPPER`, `LOWER`, `TRIM`, `CONCAT`, `SPLIT_PART`).
5. Escrever verificaÃ§Ãµes de qualidade de dados usando SQL (duplicatas, valores ausentes, integridade referencial).
6. Converter tipos de colunas corretamente usando `CAST` ou `::`.

---

##### Aula 6.1 â CASE WHEN: LÃ³gica Condicional em SQL

**Contexto de negÃ³cio**: O marketing quer segmentar clientes em "Alto Valor", "MÃ©dio Valor" e "Baixo Valor" com base em seus gastos totais. Os dados tÃªm nÃºmeros â vocÃª precisa de rÃ³tulos. `CASE WHEN` Ã© o equivalente em SQL a um `SE-ENTÃO-SENÃO` (IF-THEN-ELSE).

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Escrever um bloco `CASE WHEN / THEN / ELSE / END`.
- Criar uma nova coluna com rÃ³tulos categÃ³ricos a partir de limites numÃ©ricos.
- Aninhar o `CASE WHEN` dentro de funÃ§Ãµes de agregaÃ§Ã£o (por exemplo, contar clientes por segmento).
- Usar `CASE WHEN` para lidar com valores `NULL` de uma forma legÃ­vel.

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

##### Aula 6.2 â COALESCE, NULLIF e Tratamento de Dados Ausentes

**Contexto de negÃ³cio**: Um relatÃ³rio mostra "NULL" na coluna de canal para alguns clientes. Uma soma de receita retorna `NULL` porque uma linha tem um valor `NULL`. Estes sÃ£o problemas de dados silenciosos â `COALESCE` e `NULLIF` ajudam vocÃª a lidar com eles de forma explÃ­cita.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Usar `COALESCE` para substituir os `NULL`s por um valor alternativo.
- Usar `NULLIF` para converter um valor especÃ­fico para `NULL` (Ãºtil para evitar a divisÃ£o por zero).
- Explicar por que `SUM(receita)` com apenas uma linha `NULL` ainda funciona (`SUM` ignora `NULL`s).
- Usar `COALESCE` para criar colunas de contagem "seguras para zero".

> â ï¸ **Aviso de Erro Comum**: `SUM(a) / SUM(b)` gerarÃ¡ um erro de divisÃ£o por zero se `SUM(b) = 0`. Use `SUM(a) / NULLIF(SUM(b), 0)` para retornar pacatamente `NULL` em vez de causar falha (crash).

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

##### Aula 6.3 â VerificaÃ§Ãµes de Qualidade de Dados com SQL

**Contexto de negÃ³cio**: Antes de construir um dashboard ou enviar um relatÃ³rio a um vice-presidente, vocÃª precisa saber se seus dados estÃ£o limpos. Analistas que proativamente rodam verificaÃ§Ãµes de qualidade de dados usando SQL sÃ£o muito mais confiÃ¡veis do que aqueles que apenas reportam os nÃºmeros Ã s cegas.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Verificar se hÃ¡ linhas duplicadas usando `GROUP BY` + `HAVING COUNT > 1`.
- Verificar a integridade referencial (por exemplo, itens de pedido referenciando produtos inexistentes).
- Verificar taxas de `NULL` inesperadas em colunas crÃ­ticas.
- Resumir as questÃµes de qualidade dos dados em uma Ãºnica query de diagnÃ³stico.

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

#### MÃ³dulo 7: CTEs e Subqueries â Escrevendo um SQL LegÃ­vel

**Por que este mÃ³dulo existe**: Analistas juniores que sÃ³ conseguem escrever queries planas de 100 linhas sÃ£o mais difÃ­ceis de trabalhar e mais difÃ­ceis de revisar. CTEs (ExpressÃµes de Tabela Comuns) sÃ£o a maior e melhor evoluÃ§Ã£o de legibilidade no SQL â e as empresas esperam que as use em qualquer ambiente profissional.

**Objetivos de Aprendizado**:
1. Escrever uma subquery na clÃ¡usula `FROM` (tabela derivada).
2. Escrever uma subquery na clÃ¡usula `WHERE`.
3. Escrever um CTE usando `WITH` e explicar quando ele Ã© melhor que uma subquery.
4. Encadejar mÃºltiplos CTEs para construir uma anÃ¡lise de vÃ¡rias etapas.
5. Explicar o que significa "legibilidade" de query e por que ela importa no ambiente equipe.
6. Refatorar uma query aninhada convertendo-a para um CTE.

---

##### Aula 7.1 â Subqueries

**Contexto de negÃ³cio**: VocÃª precisa encontrar todos os clientes cujos gastos totais estejam acima da mÃ©dia. Isso exige saber a mÃ©dia primeiro, e entÃ£o filtrar de acordo com ela. As subqueries permitem usar o resultado de uma query dentro de outra.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Escrever uma subquery na clÃ¡usula `WHERE` para filtrar por um valor dinÃ¢mico.
- Escrever uma subquery na clÃ¡usula `FROM` como sendo uma "tabela virtual".
- Explicar por que subqueries profundamente agrupadas podem ser difÃ­ceis de ler.
- Usar uma subquery escalar (retorna um Ãºnico valor) na lista do `SELECT`.

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```
```sql
-- (editor vazio)
```

---

##### Aula 7.2 â CTEs: Escrevendo SQL que parece uma histÃ³ria

**Contexto de negÃ³cio**: Um analista de marketing precisa de uma query de vÃ¡rias etapas: primeiramente calcular o desempenho da campanha, em seguida ranquear as campanhas e entÃ£o filtrar os melhores desempenhos. Um CTE permite escrever cada etapa em seu prÃ³prio bloco nomeado â tornando a lÃ³gica fÃ¡cil de seguir, testar e repassar.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Escrever um CTE usando `WITH nome_cte AS (...) SELECT ... FROM nome_cte`.
- Encadeiar dois ou mais CTEs em uma Ãºnica query.
- Explicar quando usar um CTE vs uma subquery.
- Refatorar uma subquery aninhada em um CTE.

[INSERIR INFOGRAFICO/IMAGEM AQUI: ComparaÃ§Ã£o lado a lado de uma subquery profundamente aninhada (bagunÃ§ada, de dentro para fora) versus um CTE (ordenado, sequencial de cima para baixo).]

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

#### â Ponto de VerificaÃ§Ã£o C â RevisÃ£o do SQL IntermediÃ¡rio

**Desafios do Ponto de VerificaÃ§Ã£o**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

#### MÃ³dulo 8: FunÃ§Ãµes de Janela (Window Functions)

**Por que este mÃ³dulo existe**: As window functions (funÃ§Ãµes de janela) sÃ£o a ferramenta mais poderosa no kit SQL de um analista â e aquela que falta Ã  maioria dos iniciantes. Elas permitem calcular totais contÃ­nuos, rankings, comparaÃ§Ãµes perÃ­odo a perÃ­odo e mÃ©dias mÃ³veis sem colapsar os dados da forma como o `GROUP BY` faz.

**Objetivos de Aprendizado**:
1. Explicar a diferenÃ§a entre window functions e `GROUP BY` (window functions nÃ£o colapsam linhas).
2. Usar `ROW_NUMBER`, `RANK` e `DENSE_RANK` para classificaÃ§Ã£o.
3. Usar `LAG` e `LEAD` para comparar uma linha com sua linha anterior ou seguinte.
4. Usar `SUM` OVER e `AVG` OVER para totais mÃ³veis (running totals) e mÃ©dias mÃ³veis.
5. Usar `PARTITION BY` para reiniciar o cÃ¡lculo da janela por grupo.
6. Usar `ORDER BY` dentro de `OVER` para definir a sequÃªncia de linhas.

---

##### Aula 8.1 â Ranqueando com ROW_NUMBER, RANK, DENSE_RANK

**Contexto de negÃ³cio**: A equipe de vendas quer ranquear clientes por seus gastos totais. A equipe de produtos quer classificar produtos dentro de cada categoria por receita. O ranqueamento (ranking) Ã© um dos casos de uso mais comuns de window functions.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Usar `ROW_NUMBER() OVER (ORDER BY ...)` para atribuir um nÃºmero de linha Ãºnico.
- Usar `RANK()` e explicar a diferenÃ§a do `ROW_NUMBER` (empates recebem a mesma classificaÃ§Ã£o, a prÃ³xima classificaÃ§Ã£o Ã© pulada).
- Usar `DENSE_RANK` (empates recebem a mesma classificaÃ§Ã£o, sem pulo numÃ©rico).
- Usar `PARTITION BY` para redefinir o ranking dentro de um grupo.

> â ï¸ **Aviso de Erro Comum**: `ROW_NUMBER` sempre atribui nÃºmeros Ãºnicos â mesmo em casos de empate. `RANK` dÃ¡ o mesmo nÃºmero aos empates, mas pula o prÃ³ximo (1, 1, 3). `DENSE_RANK` dÃ¡ o mesmo nÃºmero aos empates e nÃ£o pula (1, 1, 2). Escolha com base no que a pergunta de negÃ³cio realmente precisa.

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

##### Aula 8.2 â LAG e LEAD: Comparando Linhas no Tempo

**Contexto de negÃ³cio**: O CFO quer uma tabela de receita mÃªs a mÃªs (Month-over-Month) mostrando a receita do mÃªs atual, a receita do mÃªs anterior e a variaÃ§Ã£o. `LAG` traz o valor da linha anterior â tornando as comparaÃ§Ãµes de tempo triviais.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Usar `LAG(coluna, 1)` para obter o valor da linha anterior.
- Usar `LEAD(coluna, 1)` para obter o valor da prÃ³xima linha.
- Combinar `LAG` com `ORDER BY` dentro de `OVER` para criar comparaÃ§Ãµes ordenadas no tempo.
- Calcular a variaÃ§Ã£o absoluta e percentual entre os perÃ­odos.

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```
```sql
-- Use NULLIF para evitar a divisÃ£o por zero.

WITH receita_mensal AS (
  SELECT
    DATE_TRUNC('month', data_criacao) AS mes_pedido,
    SUM(valor_total)                  AS receita_mensal
  FROM pedidos
  GROUP BY 1
),
com_lag AS (
  SELECT
    mes_pedido,
    receita_mensal,
    LAG(receita_mensal) OVER (ORDER BY mes_pedido) AS receita_mes_anterior
  FROM receita_mensal
)
SELECT
  mes_pedido,
  receita_mensal,
  receita_mes_anterior,
  ROUND(
    (receita_mensal - receita_mes_anterior)::numeric /
    NULLIF(receita_mes_anterior, 0) * 100, 1
  ) AS variacao_percentual
FROM com_lag
ORDER BY mes_pedido;
```

```sql
-- (editor vazio)
```

---

##### Aula 8.3 â Totais MÃ³veis (Running Totals) e MÃ©dias MÃ³veis

**Contexto de negÃ³cio**: O setor financeiro quer um total mÃ³vel (running total) da receita ao longo do ano. A equipe de crescimento quer uma mÃ©dia mÃ³vel de 7 dias das inscriÃ§Ãµes diÃ¡rias para suavizar o ruÃ­do dos finais de semana. Ambas sÃ£o agregaÃ§Ãµes de janela.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Usar `SUM(...) OVER (ORDER BY ...)` para um total mÃ³vel.
- Usar `AVG(...) OVER (ORDER BY ... ROWS BETWEEN ...)` para uma mÃ©dia mÃ³vel.
- Usar `PARTITION BY` + total mÃ³vel para redefinir por grupo (por exemplo, por cliente).
- Explicar a diferenÃ§a entre um agregado de janela e um agregado `GROUP BY`.

[INSERIR INFOGRAFICO/IMAGEM AQUI: ComparaÃ§Ã£o visual mostrando como um TOTAL MÃVEL preserva cada linha individual de dados enquanto adiciona os valores passo a passo, diferente de um GROUP BY que colapsa todas as linhas num Ãºnico sumÃ¡rio.]

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

### NÃVEL 4 â Kit de Ferramentas Pronto para o Trabalho

> **Objetivo**: Aplicar tudo aos padrÃµes analÃ­ticos que aparecem em entrevistas reais e no trabalho real. Adicionar consciÃªncia de desempenho e contexto de infraestrutura moderna.

---

#### MÃ³dulo 9: PadrÃµes AnalÃ­ticos Reais

**Por que este mÃ³dulo existe**: Este mÃ³dulo faz a ponte entre as habilidades de SQL e as entregas reais â os dashboards, relatÃ³rios e anÃ¡lises ad-hoc que analistas financeiros, de marketing e de produto produzem todos os dias.

**Objetivos de Aprendizado**:
1. Construir uma query de anÃ¡lise de funil mostrando as taxas de conversÃ£o passo a passo.
2. Construir uma tabela de retenÃ§Ã£o / churn de clientes.
3. Construir uma query de atribuiÃ§Ã£o de marketing de primeiro toque e Ãºltimo toque (first e last-touch).
4. Construir um resumo de receita no estilo DRE (P&L) com custo dos produtos vendidos e margem bruta.
5. Identificar padrÃµes comuns Ã  relatoria financeira (comparaÃ§Ã£o de perÃ­odos, orÃ§ado x realizado).
6. Ler e explicar uma query escrita por outra pessoa (compreensÃ£o de SQL).

---

##### Aula 9.1 â AnÃ¡lise de Funil

**Contexto de negÃ³cio**: O marketing veicula campanhas que atraem visitantes para o site da GrooveCommerce. Esses visitantes podem ter a sessÃ£o de navegaÃ§Ã£o â visualizar produtos â adicionar ao carrinho â concluir o pedido. Uma query de funil mede quantos usuÃ¡rios passam por cada etapa.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Definir um funil de conversÃ£o e cada uma de suas etapas.
- Escrever uma query de funil usando `COUNT(DISTINCT)` por etapa.
- Calcular taxas de conversÃ£o entre etapas sucessivas.
- Explicar o que uma etapa de "vazamento" (quebra) parece nos dados.

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

##### Aula 9.2 â RetenÃ§Ã£o e Churn (Cancelamento/EvasÃ£o)

**Contexto de negÃ³cio**: A equipe de crescimento quer saber: "Dos clientes que fizeram pedido em janeiro de 2024, quantos voltaram e compraram em fevereiro?" Isso Ã© a retenÃ§Ã£o. O seu inverso Ã© o "churn". Estas sÃ£o as mÃ©tricas mais essenciais num negÃ³cio de assinaturas ou compras recorrentes.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Construir uma matriz de retenÃ§Ã£o de clientes de um mÃªs para o outro (month-over-month).
- Definir "retido", "cancelado" (churned) e "reativado" usando SQL.
- Calcular a taxa de retenÃ§Ã£o mensal.
- Explicar a diferenÃ§a entre a retenÃ§Ã£o no nÃ­vel do usuÃ¡rio e retenÃ§Ã£o no nÃ­vel de coorte.

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

##### Aula 9.3 â Receita e RelatÃ³rios no Estilo DRE (P&L)

**Contexto de negÃ³cio**: Como um analista financeiro, muitas vezes serÃ¡ pedido que vocÃª produza um resumo detalhado no padrÃ£o DRE (Demonstrativo do Resultado do ExercÃ­cio / P&L): receita bruta, descontos, receita lÃ­quida e margem bruta. Esta aula constrÃ³i esse padrÃ£o usando SQL.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Construir um resumo de receitas com receita bruta, descontos concedidos e receita lÃ­quida final.
- Incorporar dados do custo unitÃ¡rio para calcular e reportar a margem bruta.
- Produzir uma comparaÃ§Ã£o entre diferentes perÃ­odos (period-over-period) em sumÃ¡rio gerencial do tipo usado por CFOs.
- Formatar os nÃºmeros de modo adequado e compreensÃ­vel num output `SELECT`.

**Desafios**:

```sql
-- (editor vazio)
```
```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

#### MÃ³dulo 10: NoÃ§Ãµes BÃ¡sicas de Desempenho e Aprofundamento em Infraestrutura Moderna

**Por que este mÃ³dulo existe**: Escrever SQL correto Ã© necessÃ¡rio. Escrever SQL *eficiente* Ã© ser profissional. Este mÃ³dulo apresenta os conceitos â Ã­ndices, particionamento, custo de query â que separam um analista jÃºnior de um analista capaz, e revisita o cenÃ¡rio da infraestrutura de dados com o contexto completo do curso agora disponÃ­vel.

**Objetivos de Aprendizado**:
1. Explicar o que Ã© um Ã­ndice conceitualmente e por que ele acelera as queries.
2. Explicar o que significam particionamento e clusterizaÃ§Ã£o no contexto de um cloud warehouse.
3. Descrever o que significa "custo de query" ou "bytes escaneados" em um cloud warehouse.
4. Escrever um SQL legÃ­vel e bem formatado que um colega possa revisar.
5. Aplicar o pipeline ETL/ELT â warehouse â dashboard a um modelo mental completo.
6. Reconhecer quais padrÃµes de query sÃ£o custosos versus baratos.

---

##### Aula 10.1 â Conceitos de Ãndice e PartiÃ§Ã£o

**Contexto de negÃ³cio**: Sua query em 100 milhÃµes de linhas de pedidos leva 4 minutos. A query idÃªntica do seu colega nos mesmos dados leva 3 segundos. A diferenÃ§a Ã© se a tabela Ã© particionada por data e se a coluna certa estÃ¡ indexada. VocÃª nÃ£o gerencia isso â mas precisa entender como funciona.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Explicar um Ã­ndice usando uma analogia nÃ£o tÃ©cnica (por exemplo, o Ã­ndice de um livro versus ler todas as pÃ¡ginas).
- Explicar como uma query em uma tabela particionada por data evita escanear todo o histÃ³rico de dados.
- Descrever o que significa clusterizaÃ§Ã£o (linhas classificadas fisicamente para buscas rÃ¡pidas em intervalo).
- Escrever queries que aproveitem as tabelas particionadas (sempre filtre na coluna de partiÃ§Ã£o).

[INSERIR INFOGRAFICO/IMAGEM AQUI: ComparaÃ§Ã£o de uma busca varrendo uma tabela inteira (sem Ã­ndice/partiÃ§Ã£o) versus uma busca direcionada onde a tabela Ã© "fatiada" por datas (particionamento).]

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

##### Aula 10.2 â Escrevendo um Bom SQL: Legibilidade e PadrÃµes do Mundo Real

**Contexto de negÃ³cio**: VocÃª escreverÃ¡ queries que outros analistas vÃ£o ler, manter e aprimorar. Um SQL difÃ­cil de ler Ã© um passivo. Esta aula Ã© sobre os hÃ¡bitos que o tornam uma pessoa fÃ¡cil de trabalhar.

**ApÃ³s esta aula, o aluno serÃ¡ capaz de**:
- Formatar uma query com recuos (indentaÃ§Ã£o) e quebras de linha consistentes.
- Escrever apelidos (aliases) significativos para cada tabela e coluna.
- Adicionar comentÃ¡rios integrados `inline` para explicar a lÃ³gica nÃ£o Ã³bvia.
- Explicar a regra: uma unidade lÃ³gica por CTE, usar nomes significativos em vez de `q1` ou `temp`.

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

#### â Ponto de VerificaÃ§Ã£o Final â AvaliaÃ§Ã£o "Pronto para o Trabalho"

**PropÃ³sito**: IntegraÃ§Ã£o total de todas as habilidades do curso em um cenÃ¡rio de negÃ³cios realista. Estes desafios espelham o que vocÃª verÃ¡ em entrevistas tÃ©cnicas e na sua primeira semana de trabalho.

**Desafios do Ponto de VerificaÃ§Ã£o Final**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```


---

## Esquema de Banco de Dados de Prática

**Domínio**: GrooveCommerce — uma plataforma de e-commerce onde os clientes pesquisam, adicionam ao carrinho e compram produtos físicos. A empresa também executa campanhas de marketing e rastreia sessões da web.

**Por que esse domínio?** Ele suporta os três perfis principais simultaneamente:
- **Analista Financeiro**: Receita, reembolsos, análise de descontos, métricas de P&L, comparações de períodos.
- **Analista de Marketing**: Desempenho de campanhas, análise de funil, atribuição de canais, coortes.
- **Analista de Dados Júnior**: Joins entre várias tabelas, qualidade de dados, agregações, funções de janela (window functions).

---

### Definições de Tabela

---

#### `clientes`
Armazena uma linha por cliente registrado.

| Coluna | Tipo | Notas |
|---|---|---|
| `customer_id` | INTEGER | **Chave Primária** |
| `first_name` | VARCHAR | — |
| `last_name` | VARCHAR | — |
| `email` | VARCHAR | Único, anulável (alguns registros podem estar incompletos) |
| `phone` | VARCHAR | Anulável |
| `created_at` | TIMESTAMP | Quando o cliente se registrou |
| `acquisition_channel` | VARCHAR | ex: 'organic_search', 'paid_social', 'referral', 'email', NULL |
| `country` | VARCHAR | ex: 'US', 'BR', 'UK' |

---

#### `pedidos`
Uma linha por pedido feito.

| Coluna | Tipo | Notas |
|---|---|---|
| `order_id` | INTEGER | **Chave Primária** |
| `customer_id` | INTEGER | **FK → clientes.customer_id** |
| `created_at` | TIMESTAMP | Horário em que o pedido foi feito |
| `status_code` | INTEGER | 1=pendente, 2=confirmado, 3=enviado, 4=entregue, 5=cancelado |
| `order_total` | DECIMAL | Soma de todos os itens (antes do desconto aplicado no checkout) |
| `discount_amount` | DECIMAL | Anulável — desconto aplicado ao pedido |
| `delivery_date` | DATE | Anulável — preenchido quando entregue |
| `shipping_address_country` | VARCHAR | País de destino |

---

#### `itens_pedido`
Uma linha por produto dentro de um pedido. Um pedido com 3 produtos diferentes = 3 linhas.

| Coluna | Tipo | Notas |
|---|---|---|
| `order_item_id` | INTEGER | **Chave Primária** |
| `order_id` | INTEGER | **FK → pedidos.order_id** |
| `product_id` | INTEGER | **FK → produtos.product_id** |
| `quantity` | INTEGER | Unidades pedidas |
| `unit_price` | DECIMAL | Preço no momento da compra (pode diferir do preço atual do catálogo) |

---

#### `produtos`
Catálogo de todos os produtos disponíveis na plataforma.

| Coluna | Tipo | Notas |
|---|---|---|
| `product_id` | INTEGER | **Chave Primária** |
| `product_name` | VARCHAR | — |
| `category_id` | INTEGER | **FK → categorias_produto.category_id** |
| `price` | DECIMAL | Preço atual do catálogo |
| `unit_cost` | DECIMAL | Custo das mercadorias (para cálculos de margem) |
| `is_active` | BOOLEAN | Se o produto está listado atualmente |
| `created_at` | TIMESTAMP | Quando foi adicionado ao catálogo |

---

#### `categorias_produto`
Tabela de pesquisa mapeando IDs de categoria para nomes.

| Coluna | Tipo | Notas |
|---|---|---|
| `category_id` | INTEGER | **Chave Primária** |
| `category_name` | VARCHAR | — |
| `parent_category_id` | INTEGER | Anulável — para hierarquia de subcategorias |

---

#### `campanhas_marketing`
Uma linha por campanha de marketing executada pela equipe.

| Coluna | Tipo | Notas |
|---|---|---|
| `campaign_id` | INTEGER | **Chave Primária** |
| `campaign_name` | VARCHAR | — |
| `channel` | VARCHAR | ex: 'paid_search', 'paid_social', 'email', 'influencer' |
| `start_date` | DATE | — |
| `end_date` | DATE | — |
| `budget` | DECIMAL | Orçamento total alocado |
| `clicks` | INTEGER | Total de cliques |
| `conversions` | INTEGER | Total de conversões atribuídas |

---

#### `eventos_campanha`
Dados em nível de evento: uma linha por interação de campanha (impressão, clique, conversão).

| Coluna | Tipo | Notas |
|---|---|---|
| `event_id` | INTEGER | **Chave Primária** |
| `campaign_id` | INTEGER | **FK → campanhas_marketing.campaign_id** |
| `customer_id` | INTEGER | **FK → clientes.customer_id** — anulável (visitantes anônimos) |
| `event_type` | VARCHAR | 'impression', 'click', 'conversion' |
| `event_at` | TIMESTAMP | Quando o evento ocorreu |

---

#### `sessoes`
Dados em nível de sessão da web: uma linha por evento de sessão (visualização de página, adicionar ao carrinho, compra).

| Coluna | Tipo | Notas |
|---|---|---|
| `session_id` | VARCHAR | **Chave Primária** (geralmente um UUID) |
| `customer_id` | INTEGER | **FK → clientes.customer_id** — anulável (anônimo) |
| `event_type` | VARCHAR | 'page_view', 'add_to_cart', 'purchase' |
| `page` | VARCHAR | Caminho da URL, ex: '/products/201' |
| `event_at` | TIMESTAMP | Quando o evento ocorreu |
| `device_type` | VARCHAR | 'mobile', 'desktop', 'tablet' |

---

#### `reembolsos`
Uma linha por reembolso emitido em um pedido ou item de pedido.

| Coluna | Tipo | Notas |
|---|---|---|
| `refund_id` | INTEGER | **Chave Primária** |
| `order_id` | INTEGER | **FK → pedidos.order_id** |
| `order_item_id` | INTEGER | **FK → itens_pedido.order_item_id** — anulável (reembolso do pedido inteiro) |
| `refund_amount` | DECIMAL | — |
| `refund_reason` | VARCHAR | ex: 'defective', 'wrong_item', 'customer_changed_mind' |
| `refunded_at` | TIMESTAMP | — |
