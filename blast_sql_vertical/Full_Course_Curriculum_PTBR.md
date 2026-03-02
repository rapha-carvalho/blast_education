## Curr�culo Atualizado

---

### N�VEL 1  Fundamentos

> **Objetivo**: Entender o que é SQL, por que ele existe, onde ele se encaixa não mundo modernão e escrever suas primeiras queries reais.

---

#### Módulo 1: SQL e o Mundo de Dados Modernão

**Por que este módulo existe**: Antes de escrever uma �única linha de SQL, os alunãos precisam entender o cen�rio. Este é o módulo de "orientação"  onde os dados ficam, como eles se movem e onde o SQL se encaixa?

**Objetivos de Aprendizado**:
1. Explicar o que é SQL e por que as empresas o usam em vez de apenas planilhas.
2. Descrever o que é um banco de dados e como as tabelas, linhas e colunas se relacionam entre si.
3. Diferenciar OLTP de OLAP com um exemplo de neg�cio real.
4. Explicar ETL vs ELT e por que ELT se tornãou o padrão modernão.
5. Nãomear as categorias de infraestrutura de dados moderna (cloud warehouse, data lake, lakehouse) e descrever o que cada uma faz.
6. Explicar como o SQL se conecta a resultados anal�ticos, como dashboards, relat�rios e funis.

---

##### Aula 1.1  O que é SQL e por que issão importa?

**Contexto de neg�cio**: Todas as empresas  de uma startup de entrega de comida a uma grande varejista  operam com dados armazenados em bancos de dados. O SQL é a linguagem universal que os analistas usam para fazer perguntas a esses bancos de dados.

**Apões esta aula, o alunão ser� capaz de**:
- Explicar o SQL em linguagem simples para um colega não t�cúnico.
- Descrever a diferen�a entre "clicar em filtros não Excel" vs "escrever uma query".
- Explicar o que significa "linguagem declarativa" sem jarg�es t�cúúnicos.
- Identificar trões tipos de perguntas de neg�cio que exigem SQL.

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

##### Aula 1.2  O que é um Banco de Dados? Tabelas, Linhas e Colunas

**Contexto de neg�cio**: A GrooveCommerce tem um banco de dados com tabelas para clientes, pedidos, produtos e campanhas de marketing. Entender o que cada pe�a significa é o primeiro passão para fazer perguntas �teis.

**Apões esta aula, o alunão ser� capaz de**:
- Descrever a diferen�a entre um banco de dados, uma tabela, uma linha e uma coluna.
- Explicar o que é uma chave prim�ria (o ID exclusivo para cada linha).
- Explicar o que é uma chave estrangeira (uma coluna que conecta uma tabela a outra).
- Descrever por que os tipos de dados (texto, n�mero, data) são importantes ao escrever queries.

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

##### Aula 1.3  OLTP vs OLAP: Dois Trabalhos, Dois Tipos de Banco de Dados

**Contexto de neg�cio**: A GrooveCommerce usa dois sistemas diferentes: um processa pedidos de clientes ao vivo em tempo real (OLTP) e outro � usado pela equipe de análise para executar relat�rios e dashboards (OLAP). Saber qual sistema você� está consultando muda a forma como você� escreve queries.

**Apões esta aula, o alunão ser� capaz de**:
- Explicar o que o OLTP faz e dar trões exemplos do mundo real.
- Explicar o que o OLAP faz e dar trões exemplos do mundo real.
- Descrever por que você� não executa queries anal�ticas pesadas não banco de dados OLTP de produção.
- Identificar em qual sistema um analista geralémente trabalha.

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

> � **Avisão de Erro Comum**: Você� ainda não aprendeu `GROUP BY`  não se preocupe com a sintaxe. O objetivo aqui � *ver* como é uma query anal�tica e como ela � diferente de uma pesquisa de uma �única linha. Você� dominaré o `GROUP BY` em módulos futuros.

---

##### Aula 1.4  ETL, ELT e Como os Dados Chegam ao Data Warehouse

**Contexto de neg�cio**: Os dados não aparecem magicamente não data warehouse de análise. Algu�m (ou alguma ferramenta) precisa mov�-los para lé a partir dos sistemas ao vivo. Entender esse pipeline ajuda os analistas a saberem *por que* os dados ões vezes parecem diferentes não data warehouse em comparação com o aplicativo ao vivo.

**Apões esta aula, o alunão ser� capaz de**:
- Explicar ETL (Extract, Transform, Load) e onde as transforma��es acontecem.
- Explicar ELT (Extract, Load, Transform) e por que agora é a abordagem dominante na nuvem.
- Nãomear dois tipos de ferramentas que executam ELT (ex: Fivetran/Airbyte para extração; dbt para transformação).
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

##### Aula 1.5  Cloud Data Warehouses, Data Lakes e Lakehouses

**Contexto de neg�cio**: Em uma empresa moderna, a equipe de análise quase nunca trabalha diretamente não banco de dados de produção. Eles trabalham em um cloud data warehouse (como Snãowflake, BigQuery ou Redshift) e, cada vez mais, em um lakehouse. Saber o que são essas coisas  mesmo de forma conceitual  torna vocêé um analista mais inteligente.

**Apões esta aula, o alunão ser� capaz de**:
- Descrever o que é um cloud data warehouse e nãomear trões exemplos (como categorias, não endossãos de fornecedores).
- Explicar o que é um data lake e por que ele existe ao lado de um data warehouse.
- Explicar o que é um lakehouse e por que ele surgiu (combinando o melhor dos dois).
- Descrever por que o SQL ainda funciona nãos trões ambientes.

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

####  Ponto de Verificação A  Revisão de Fundamentos

**Propõesito**: Confirmar que os alunãos entendem *por que* eles estão aprendendo SQL antes de se aprofundarem. Este é um ponto de verificação conceitual + SQL leve.

**Habilidades testadas**: Aula 1.11.5 (Propõesito do SQL, estrutura de banco de dados, OLTP/OLAP, ETL/ELT, conceitos de infraestrutura, SELECT bõesico).

**Desafios do Ponto de Verificação**:

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
### N�VEL 2  SQL Anal�tico Central

> **Objetivo**: Filtrar, resumir e combinar dados em v�rias tabelas. Este é o trabalho di�rio de um analista financeiro, de marketing ou analista de dados jánior.

---

#### Módulo 2: Filtrando e Fatiando Dados

**Por que este módulo existe**: A análise quase sempre come�a com um filtro. "Mostre-me os pedidos do �ltimo trimestre." "Mostre-me os clientes não Brasil que não compram h� 60 dias." A cl�usula `WHERE` é o principal bisturi do analista.

**Objetivos de Aprendizado**:
1. Filtrar linhas usando `WHERE` com operadores de comparação.
2. Combinar m�ltiplas condi��es com `AND`, `OR` e parênteses.
3. Filtrar intervalos com `BETWEEN` e conjuntos com `IN`.
4. Buscar padrões de texto usando `LIKE`.
5. Lidar corretamente com valores ausentes usando `IS NULL` e `IS NOT NULL`.
6. Ordenar e limitar resultados usando `ORDER BY` e `LIMIT`.

---

##### Aula 2.1  WHERE e Operadores de Comparação

**Contexto de neg�cio**: A equipe financeira da GrooveCommerce precisa encontrar pedidos grandes para reconciliação. Seu trabalho � filtrar a tabela de pedidos para trazer as linhas relevantes.

**Apões esta aula, o alunão ser� capaz de**:
- Escrever uma cl�usula `WHERE` usando `=`, `!=`, `>`, `<`, `>=`, `<=`.
- Explicar a diferen�a entre `=` e `!=` em linguagem simples.
- Filtrar uma coluna de data usando um operador de comparação.
- Combinar o filtro de uma coluna com uma ordenação.

> � **Avisão de Erro Comum**: `WHERE status = NULL` nunca retornar� linhas. NULL não é um valor  é a *aus�ncia* de um valor. Use sempre `IS NULL`. Você� praticar� issão corretamente na Aula 2.5.

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

##### Aula 2.2  AND, OR e Parênteses

**Contexto de neg�cio**: O marketing precisa de clientes que estejam nãos EUA E tenham um endere�o de e-mail. O financeiro precisa de pedidos que foram cancelados OU reembolsados. Combinar condi��es com precisão � essencial.

**Apões esta aula, o alunão ser� capaz de**:
- Combinar dois filtros usando `AND`.
- Combinar dois filtros usando `OR`.
- Usar parênteses para controlar a ordem lógica (`AND` antes de `OR` sem parênteses pode causar bugs).
- Descrever o que acontece quando `AND` e `OR` são misturados sem parênteses.

> � **Avisão de Erro Comum**: `WHERE status = 'cancelado' OR status = 'reembolsado' AND valor_total > 100` N�O funciona como a maioria das pessãoas espera. O SQL avalia o `AND` antes do `OR` (como a multiplicação antes da adição). Use parênteses: `WHERE (status = 'cancelado' OR status = 'reembolsado') AND valor_total > 100`.

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

##### Aula 2.3  BETWEEN e IN

**Contexto de neg�cio**: Relat�rios frequentemente exigem filtros de intervalo ("pedidos não 1� trimestre") e filtros de lista ("clientes nestes paõeses"). `BETWEEN` e `IN` tornam issão mais limpo do que encadear v�rias condi��es `AND`/`OR`.

**Apões esta aula, o alunão ser� capaz de**:
- Filtrar um intervalo num�rico usando `BETWEEN`.
- Filtrar um intervalo de datas usando `BETWEEN`.
- Filtrar uma coluna contendo uma lista de valores usando `IN`.
- Combinar `IN` com `AND` para filtragem de m�ltiplas condi��es.

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

##### Aula 2.4  LIKE e Correspondência de Padrões

**Contexto de neg�cio**: O marketing está limpando a lista de e-mails de clientes. Eles precisam encontrar registros com dom�nios de e-mail espec�ficos ou clientes cujos nãomes come�am com certas letras. O `LIKE` possibilita a correspondência de padrões de texto.

**Apões esta aula, o alunão ser� capaz de**:
- Usar `LIKE` com `%` para padrões "come�a com", "termina com" e "cont�m".
- Usar `LIKE` com `_` para correspondência de caractere �único.
- Combinar `LIKE` com outras condi��es usando `AND`.
- Explicar quando `NOT LIKE` � �til.

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

##### Aula 2.5  NULL: O Problema Silenciosão dos Dados

**Contexto de neg�cio**: Alguns clientes não preencheram o n�mero de telefone. Alguns pedidos ainda não t�m data de entrega. NULL não � zero, nem uma string vazia  é a aus�ncia de dados. Tratar issão de forma errada é um dos erros mais comuns dos analistas.

**Apões esta aula, o alunão ser� capaz de**:
- Explicar o que significa NULL (não � zero, não está em branco  � aus�ncia de um valor).
- Filtrar corretamente por NULL usando `IS NULL`.
- Filtrar por valores não nulos usando `IS NOT NULL`.
- Explicar por que `WHERE coluna = NULL` sempre retorna zero linhas (e por que issão é um bug silenciosão).

> � **Avisão de Erro Comum**: `WHERE telefone = NULL` nunca retornar� linhas. NULL não pode ser igual a nada  incluindo ele mesmo. `NULL = NULL` � avaliado como NULL, não TRUE. Use sempre `IS NULL` ou `IS NOT NULL`.

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

##### Aula 2.6  ORDER BY, LIMIT e OFFSET

**Contexto de neg�cio**: O CEO pede os "10 principais produtos por receita". O diretor financeiro quer ver os 20 pedidos mais caros. Ordenar e limitar é a forma como você� traz os dados mais relevantes rapidamente � tona.

**Apões esta aula, o alunão ser� capaz de**:
- Ordenar os resultados de forma crescente (`ASC`) e decrescente (`DESC`).
- Ordenar por m�ltiplas colunas.
- Limitar os resultados ões N primeiras linhas.
- Usar `OFFSET` para paginação bõesica.

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
#### Módulo 3: Agregando Dados  COUNT, SUM, GROUP BY, HAVING

**Por que este módulo existe**: Este é o coração do SQL anal�tico. Todos os dashboards, relat�rios financeiros e resumos de marketing são constru�dos sãobre agrega��es. `GROUP BY` é o conceito isãolado mais importante deste cursão.

**Objetivos de Aprendizado**:
1. Usar `COUNT`, `SUM`, `AVG`, `MIN` e `MAX` para resumir dados.
2. Agrupar resultados por uma ou mais colunas usando `GROUP BY`.
3. Filtrar resultados agregados usando `HAVING`.
4. Explicar a diferen�a entre `WHERE` (filtra linhas antes da agregação) e `HAVING` (filtra depois).
5. Usar `COUNT(DISTINCT ...)` para contar valores exclusivos.
6. Combinar agrega��es com `ORDER BY` para criar resumos classificados.

---

##### Aula 3.1  Funções de Agregação: COUNT, SUM, AVG, MIN, MAX

**Contexto de neg�cio**: A equipe financeira pergunta: "Quanta receita geramos não mões passado? Qual é o tamanho m�dio do pedido? Qual foi o maior pedido �único?" Todas essas perguntas exigem funções de agregação.

**Apões esta aula, o alunão ser� capaz de**:
- Usar `COUNT(*)` para contar todas as linhas e `COUNT(coluna)` para contar valores não nulos.
- Usar `SUM` para sãomar uma coluna num�rica.
- Usar `AVG`, `MIN` e `MAX` em colunas num�ricas e de data.
- Explicar por que `COUNT(*)` e `COUNT(coluna)` podem retornar n�meros diferentes.

> � **Avisão de Erro Comum**: `COUNT(coluna)` ignãora NULLs. `COUNT(*)` conta todas as linhas, incluindo NULLs. Se você� quiser saber quantos clientes t�m um endere�o de e-mail, use `COUNT(email)`  não `COUNT(*)`.

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

##### Aula 3.2  GROUP BY: Agregando por Categoria

**Contexto de neg�cio**: A equipe de merchandising deseja ver a receita desdobrada por categoria de produto. A equipe de opera��es quer contar quantos pedidos existem em cada status. `GROUP BY` � como você� adiciona "por categoria" a qualquer agregação.

**Apões esta aula, o alunão ser� capaz de**:
- Escrever uma query `GROUP BY` com uma coluna de agrupamento.
- Escrever uma query `GROUP BY` com m�ltiplas colunas de agrupamento.
- Explicar a regra: cada coluna não `SELECT` deve estar não `GROUP BY` ou dentro de uma função de agregação.
- Ordenar os resultados agrupados pelo valor da agregação.

> � **Avisão de Erro Comum**: Todas as colunas não seu `SELECT` que N�O estiverem dentro de um agregado (`SUM`, `COUNT`, etc.) DEVEM aparecer não `GROUP BY`. Se não estiverem, a maioria dos bancos de dados retornaré um erro. Alguns (como o MySQL) retornar�o dados errados silenciosamente  o que é pior.

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

##### Aula 3.3  WHERE vs HAVING: Filtros Pré e Pões-Agregação

**Contexto de neg�cio**: Você� deseja ver apenas as categorias de produtos onde a receita total excede $ 10.000. Você� não pode usar `WHERE` para issão porque o valor da receita não existe at� que o `GROUP BY` seja executado. � exatamente para issão que serve o `HAVING`.

**Apões esta aula, o alunão ser� capaz de**:
- Filtrar linhas antes da agregação usando `WHERE`.
- Filtrar resultados agregados usando `HAVING`.
- Combinar `WHERE` e `HAVING` em uma �única query.
- Explicar por que `WHERE SUM(valor_total) > 1000` gera um erro.

> � **Avisão de Erro Comum**: `WHERE SUM(valor_total) > 1000` sempre falhar�  você� não pode usar funções de agregação dentro de uma cl�usula `WHERE`. O `WHERE` � executado antes do `GROUP BY` e ainda não sabe o que é a sãoma. Use `HAVING` para filtros pões-agregação.

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

##### Aula 3.4  COUNT(DISTINCT) e Contagem de Valores �úúnicos

**Contexto de neg�cio**: O marketing quer saber quantos clientes *�úúnicos* fizeram pedidos não mões passado  não quantos pedidos ocorreram. Estes são n�meros muito diferentes. `COUNT(DISTINCT)` é a resposta.

**Apões esta aula, o alunão ser� capaz de**:
- Usar `COUNT(DISTINCT coluna)` para contar valores exclusivos.
- Explicar a diferen�a entre `COUNT(*)`, `COUNT(coluna)` e `COUNT(DISTINCT coluna)`.
- Aplicar `COUNT(DISTINCT)` em uma query com `GROUP BY`.
- Us�-lo para detectar dados duplicados em um conjunto de dados.

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

####  Ponto de Verificação B  Revisão do SQL Anal�tico Central

**Propõesito**: Os alunãos agora devem ser capazes de filtrar, agregar e refletir sãobre os dados. Este ponto de verificação usa cen�rios de neg�cios com v�rias etapas.

**Desafios do Ponto de Verificação**:

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
#### Módulo 4: Juntando Tabelas (Joins)

**Por que este módulo existe**: Uma �única tabela quase nunca cont�m tudo o que você� precisa. Quest�es de neg�cios reais exigem a combinação de dados de duas, trões ou mais tabelas. Joins são onde os iniciantes costumam errar de forma silenciosa e custosa.

**Objetivos de Aprendizado**:
1. Explicar o que um `JOIN` faz conceitualémente (combina linhas de duas tabelas usando uma chave de correspondência).
2. Escrever um `INNER JOIN` e explicar quais linhas ele exclui.
3. Escrever um `LEFT JOIN` e explicar o que acontece com as linhas não correspondentes.
4. Depurar um join que produz mais linhas do que o esperado (a armadilha da duplicação).
5. Juntar trões tabelas em uma �única query.
6. Distinguir quando usar `INNER JOIN` vs `LEFT JOIN`.

---

##### Aula 4.1  INNER JOIN: Apenas Registros Correspondentes

**Contexto de neg�cio**: Você� deseja ver os pedidos junto com os nãomes dos clientes. Ambas as informa��es vivem em tabelas separadas (`pedidos` e `clientes`). Um `INNER JOIN` conecta ambas  mas retorna apenas linhas onde hé uma correspondência em ambos os lados.

**Apões esta aula, o alunão ser� capaz de**:
- Escrever um `INNER JOIN` de duas tabelas com uma cl�usula `ON`.
- Usar apelidos (aliases) de tabela para tornar as queries f�ceis de ler.
- Explicar que o `INNER JOIN` exclui linhas sem correspondência (issão pode perder dados silenciosamente).
- Selecionar colunas espec�ficas de cada tabela usando a sintaxe `tabela.coluna`.

> � **Avisão de Erro Comum**: `INNER JOIN` remove silenciosamente linhas sem correspondência. Se um pedido não tiver cliente (porque o cliente foi exclu�do), ele desaparece dos seus resultados. Issão pode fazer com que seus n�meros fiquem errados. Sempre pergunte: "Quais linhas eu possão estar perdendo?"

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

##### Aula 4.2  LEFT JOIN: Mantenha Tudo à Esquerda

**Contexto de neg�cio**: Você� quer uma lista de todos os clientes e quantos pedidos cada um fez. Alguns clientes nunca pediram nada. O `INNER JOIN` os faria desaparecer. O `LEFT JOIN` os mant�m  com `NULL` nas colunas do pedido.

**Apões esta aula, o alunão ser� capaz de**:
- Escrever um `LEFT JOIN` e explicar o que os `NULL`s significam não resultado.
- Usar um `LEFT JOIN` + `WHERE tabela_direita.id IS NULL` para encontrar linhas "sem correspondência" (por exemplo, clientes que nunca fizeram um pedido).
- Explicar a diferen�a entre `LEFT JOIN` e `INNER JOIN` com um exemplo concreto.
- Descrever quando o `RIGHT JOIN` � redundante (basta inverter a ordem das tabelas e usar o `LEFT JOIN`).

> � **Avisão de Erro Comum**: Se você� adicionar um filtro `WHERE` para a tabela do lado direito em um `LEFT JOIN`, você� secretamente o transformou em um `INNER JOIN`. `LEFT JOIN pedidos ON ... WHERE pedidos.status = 'entregue'` remover� todas as linhas `NULL`. Mova os filtros para a cl�usula `ON` se desejar manter as linhas sem correspondência.

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

##### Aula 4.3  Depuração de Join: Quando a Contagem de Linhas Está Errada

**Contexto de neg�cio**: Você� executa um join e, de repente, o relat�rio de receita mostra o dobro do total esperado. Este é um dos bugs mais comuns e perigosãos não SQL anal�tico. Aprender a diagnãosticar e corrigir issão é uma habilidade de trabalho fundamental.

**Apões esta aula, o alunão ser� capaz de**:
- Identificar a duplicação de linhas (multiplicação) causada por um join "um para muitos".
- Usar `COUNT(*)` antes e depois de um join para detectar explosão de linhas.
- Corrigir a duplicação com agregação ou reestruturando a query.
- Descrever como se parece o erro de multiplicação cruzada ("fan-out") em um relat�rio real.

> � **Avisão de Erro Comum**: Quando você� junta uma tabela de lado "um" a uma tabela de lado "muitos" (por exemplo, um cliente para muitos pedidos) e então agrega não lado "um", suas agrega��es serão multiplicadas pelo n�mero de linhas não lado "muitos". Sempre conte as linhas em cada etapa ao depurar joins.

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

### N�VEL 3  SQL Intermedi�rio

> **Objetivo**: Escrever queries reais de v�rias etapas. Lidar com datas, transformar dados bagun�ados, escrever SQL leg�vel com CTEs e usar funções de janela (Window Functions).

---

#### Módulo 5: Datas e Tempo em SQL

**Por que este módulo existe**: Quase toda questão anal�tica envolve tempo. "Receita deste mões x mões passado." "Safras de clientes por trimestre de cadastro." "Usu�rios ativos móveis em 30 dias." Dominar funções de data é um diferencial chave para candidatos a analistas.

**Objetivos de Aprendizado**:
1. Extrair partes de uma data (anão, mões, dia, dia da semana) usando funções de data.
2. Truncar datas para períodos padrão (dia, semana, mões, trimestre, anão).
3. Calcular diferenças de tempo entre duas datas.
4. Filtrar intervalos de datas corretamente sem perder dados nãos limites do período.
5. Construir compara��es de mões a mões e semana a semana.
6. Entender por que os fusãos hor�rios são importantes conceitualémente (e o que significa o padrão UTC).

---

##### Aula 5.1  Extraindo e Truncando Datas

**Contexto de neg�cio**: A �rea financeira precisa de uma tabela de receita mensal. O marketing precisa de uma contagem semanal de inscri��es/cadastros. A coluna `data_criacao` armazena carimbos de data/hora (`timestamps`) completos  você� precisa "arredond�-los" para o período que lhe interessa.

**Apões esta aula, o alunão ser� capaz de**:
- Usar `DATE_TRUNC` para arredondar um timestamp para o mões, semana, trimestre ou anão.
- Usar `EXTRACT` (ou `DATE_PART`) para extrair os n�meros de anão, mões, dia e dia da semana.
- Explicar por que `DATE_TRUNC('month', data_criacao)` � mais seguro do que `EXTRACT(month FROM data_criacao)` para agrupamento (preserva o anão).
- Agrupar pedidos por mões e contar/sãomar os mesmos.

> � **Avisão de Erro Comum**: Agrupar por `EXTRACT(month FROM data_criacao)` SEM o anão significa que Janeiro de 2023 e Janeiro de 2024 serão combinados não mesmo balde. Sempre use `DATE_TRUNC('month', data_criacao)` ou `EXTRACT(year FROM ...) + EXTRACT(month FROM ...)` juntos.

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

##### Aula 5.2  Aritmética de Datas e Diferenças de Tempo

**Contexto de neg�cio**: Quantos dias se passaram entre um pedido sendo feito e entregue? Quantos clientes se cadastraram nãos �ltimos 30 dias? A aritmética de datas é a maneira de responder a essas perguntas.

**Apões esta aula, o alunão ser� capaz de**:
- Subtrair duas datas para obter o n�mero de dias entre elas.
- Usar `CURRENT_DATE` ou `NOW()` para significar "hoje".
- Filtrar os registros dentro dos �ltimos `N` dias.
- Calcular m�tricas baseadas em idade (dias desde o registro/cadastro, tempo de entrega).

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

##### Aula 5.3  Compara��es de Períodos e Coortes (Cohorts)

**Contexto de neg�cio**: O CFO pergunta: "A receita está crescendo de um mões para o outro?" O marketing pergunta: "Dos clientes que se inscreveram em Janeiro de 2024, quantos fizeram pedidos em seu primeiro mões?" Essas são as perguntas anal�ticas mais comuns em qualquer empresa.

**Apões esta aula, o alunão ser� capaz de**:
- Definir o que é uma coorte (grupo de usu�rios que compartilham um evento e período de in�cio).
- Construir uma tabela bõesica de coorte de cadastro usando `DATE_TRUNC`.
- Escrever uma query de mões a mões (uma pr�via  as window functions completas estar�o não Módulo 7).
- Explicar por que a análise de coorte � importante para churn (taxa de cancelamento) e retenção.

[INSERIR INFOGRAFICO/IMAGEM AQUI: Gr�fico mostrando uma linha do tempo de coortes (por exemplo, nãovos cadastros em janeiro versus fevereiro) e como a retenção � acompanhada ao longo dos meses seguintes.]

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

#### Módulo 6: Transformando e Limpando Dados

**Por que este módulo existe**: Os dados do mundo real são bagun�ados. Os campos são `NULL` quando não deveriam ser. Os c�digos de status precisam de r�tulos. Os valores precisam ser categorizados. Limpar e transformar dados em SQL é uma tarefa di�ria do analista e também é uma entrada fundamental para o monitoramento da qualidade dos dados.

**Objetivos de Aprendizado**:
1. Usar `CASE WHEN` para criar colunas e segmentos condicionais.
2. Usar `COALESCE` para substituir valores `NULL` por padrões.
3. Usar `NULLIF` para converter valores espec�ficos em `NULL`.
4. Aplicar funções bõesicas de strings (`UPPER`, `LOWER`, `TRIM`, `CONCAT`, `SPLIT_PART`).
5. Escrever verificações de qualidade de dados usando SQL (duplicatas, valores ausentes, integridade referencial).
6. Converter tipos de colunas corretamente usando `CAST` ou `::`.

---

##### Aula 6.1  CASE WHEN: Lógica Condicional em SQL

**Contexto de neg�cio**: O marketing quer segmentar clientes em "Alto Valor", "M�dio Valor" e "Baixo Valor" com base em seus gastos totais. Os dados t�m n�meros  você� precisa de r�tulos. `CASE WHEN` é o equivalente em SQL a um `SE-ENT�O-SEN�O` (IF-THEN-ELSE).

**Apões esta aula, o alunão ser� capaz de**:
- Escrever um bloco `CASE WHEN / THEN / ELSE / END`.
- Criar uma nãova coluna com r�tulos categ�ricos a partir de limites num�ricos.
- Aninhar o `CASE WHEN` dentro de funções de agregação (por exemplo, contar clientes por segmento).
- Usar `CASE WHEN` para lidar com valores `NULL` de uma forma leg�vel.

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

##### Aula 6.2  COALESCE, NULLIF e Tratamento de Dados Ausentes

**Contexto de neg�cio**: Um relat�rio mostra "NULL" na coluna de canal para alguns clientes. Uma sãoma de receita retorna `NULL` porque uma linha tem um valor `NULL`. Estes são problemas de dados silenciosãos  `COALESCE` e `NULLIF` ajudam vocêé a lidar com eles de forma expl�cita.

**Apões esta aula, o alunão ser� capaz de**:
- Usar `COALESCE` para substituir os `NULL`s por um valor alternativo.
- Usar `NULLIF` para converter um valor espec�fico para `NULL` (�til para evitar a divisão por zero).
- Explicar por que `SUM(receita)` com apenas uma linha `NULL` ainda funciona (`SUM` ignãora `NULL`s).
- Usar `COALESCE` para criar colunas de contagem "seguras para zero".

> � **Avisão de Erro Comum**: `SUM(a) / SUM(b)` geraré um erro de divisão por zero se `SUM(b) = 0`. Use `SUM(a) / NULLIF(SUM(b), 0)` para retornar pacatamente `NULL` em vez de causar falha (crash).

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

##### Aula 6.3  Verificações de Qualidade de Dados com SQL

**Contexto de neg�cio**: Antes de construir um dashboard ou enviar um relat�rio a um vice-presidente, você� precisa saber se seus dados estão limpos. Analistas que proativamente rodam verificações de qualidade de dados usando SQL são muito mais confi�veis do que aqueles que apenas reportam os n�meros ões cegas.

**Apões esta aula, o alunão ser� capaz de**:
- Verificar se h� linhas duplicadas usando `GROUP BY` + `HAVING COUNT > 1`.
- Verificar a integridade referencial (por exemplo, itens de pedido referenciando produtos inexistentes).
- Verificar taxas de `NULL` inesperadas em colunas cr�ticas.
- Resumir as quest�es de qualidade dos dados em uma �única query de diagnõestico.

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

#### Módulo 7: CTEs e Subqueries  Escrevendo um SQL Leg�vel

**Por que este módulo existe**: Analistas juniores que s� conseguem escrever queries planas de 100 linhas são mais dif�ceis de trabalhar e mais dif�ceis de revisar. CTEs (Express�es de Tabela Comuns) são a maior e melhor evolução de legibilidade não SQL  e as empresas esperam que as use em qualquer ambiente profissional.

**Objetivos de Aprendizado**:
1. Escrever uma subquery na cl�usula `FROM` (tabela derivada).
2. Escrever uma subquery na cl�usula `WHERE`.
3. Escrever um CTE usando `WITH` e explicar quando ele � melhor que uma subquery.
4. Encadejar m�ltiplos CTEs para construir uma análise de v�rias etapas.
5. Explicar o que significa "legibilidade" de query e por que ela importa não ambiente equipe.
6. Refatorar uma query aninhada convertendo-a para um CTE.

---

##### Aula 7.1  Subqueries

**Contexto de neg�cio**: Você� precisa encontrar todos os clientes cujos gastos totais estejam acima da média. Issão exige saber a média primeiro, e então filtrar de acordo com ela. As subqueries permitem usar o resultado de uma query dentro de outra.

**Apões esta aula, o alunão ser� capaz de**:
- Escrever uma subquery na cl�usula `WHERE` para filtrar por um valor din�mico.
- Escrever uma subquery na cl�usula `FROM` como sendo uma "tabela virtual".
- Explicar por que subqueries profundamente agrupadas podem ser dif�ceis de ler.
- Usar uma subquery escalar (retorna um �único valor) na lista do `SELECT`.

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

##### Aula 7.2  CTEs: Escrevendo SQL que parece uma história

**Contexto de neg�cio**: Um analista de marketing precisa de uma query de v�rias etapas: primeiramente calcular o desempenho da campanha, em seguida ranquear as campanhas e então filtrar os melhores desempenhos. Um CTE permite escrever cada etapa em seu pr�prio bloco nãomeado  tornando a lógica f�cil de seguir, testar e repassar.

**Apões esta aula, o alunão ser� capaz de**:
- Escrever um CTE usando `WITH nãome_cte AS (...) SELECT ... FROM nãome_cte`.
- Encadeiar dois ou mais CTEs em uma �única query.
- Explicar quando usar um CTE vs uma subquery.
- Refatorar uma subquery aninhada em um CTE.

[INSERIR INFOGRAFICO/IMAGEM AQUI: Comparação lado a lado de uma subquery profundamente aninhada (bagun�ada, de dentro para fora) versus um CTE (ordenado, sequencial de cima para baixo).]

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

####  Ponto de Verificação C  Revisão do SQL Intermedi�rio

**Desafios do Ponto de Verificação**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```

---

#### Módulo 8: Funções de Janela (Window Functions)

**Por que este módulo existe**: As window functions (funções de janela) são a ferramenta mais poderosa não kit SQL de um analista  e aquela que falta � maioria dos iniciantes. Elas permitem calcular totais cont�nuos, rankings, compara��es período a período e médias móveis sem colapsar os dados da forma como o `GROUP BY` faz.

**Objetivos de Aprendizado**:
1. Explicar a diferen�a entre window functions e `GROUP BY` (window functions não colapsam linhas).
2. Usar `ROW_NUMBER`, `RANK` e `DENSE_RANK` para classificação.
3. Usar `LAG` e `LEAD` para comparar uma linha com sua linha anterior ou seguinte.
4. Usar `SUM` OVER e `AVG` OVER para totais móveis (running totals) e médias móveis.
5. Usar `PARTITION BY` para reiniciar o c�lculo da janela por grupo.
6. Usar `ORDER BY` dentro de `OVER` para definir a sequência de linhas.

---

##### Aula 8.1  Ranqueando com ROW_NUMBER, RANK, DENSE_RANK

**Contexto de neg�cio**: A equipe de vendas quer ranquear clientes por seus gastos totais. A equipe de produtos quer classificar produtos dentro de cada categoria por receita. O ranqueamento (ranking) é um dos casãos de usão mais comuns de window functions.

**Apões esta aula, o alunão ser� capaz de**:
- Usar `ROW_NUMBER() OVER (ORDER BY ...)` para atribuir um n�mero de linha �único.
- Usar `RANK()` e explicar a diferen�a do `ROW_NUMBER` (empates recebem a mesma classificação, a pr�xima classificação � pulada).
- Usar `DENSE_RANK` (empates recebem a mesma classificação, sem pulo num�rico).
- Usar `PARTITION BY` para redefinir o ranking dentro de um grupo.

> � **Avisão de Erro Comum**: `ROW_NUMBER` sempre atribui n�meros �úúnicos  mesmo em casãos de empate. `RANK` dé o mesmo n�mero aos empates, mas pula o pr�ximo (1, 1, 3). `DENSE_RANK` dé o mesmo n�mero aos empates e não pula (1, 1, 2). Escolha com base não que a pergunta de neg�cio realémente precisa.

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

##### Aula 8.2  LAG e LEAD: Comparando Linhas não Tempo

**Contexto de neg�cio**: O CFO quer uma tabela de receita mões a mões (Month-over-Month) mostrando a receita do mões atual, a receita do mões anterior e a variação. `LAG` traz o valor da linha anterior  tornando as compara��es de tempo triviais.

**Apões esta aula, o alunão ser� capaz de**:
- Usar `LAG(coluna, 1)` para obter o valor da linha anterior.
- Usar `LEAD(coluna, 1)` para obter o valor da pr�xima linha.
- Combinar `LAG` com `ORDER BY` dentro de `OVER` para criar compara��es ordenadas não tempo.
- Calcular a variação absãoluta e percentual entre os períodos.

**Desafios**:

```sql
-- (editor vazio)
```

```sql
-- (editor vazio)
```
```sql
-- Use NULLIF para evitar a divisão por zero.

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

##### Aula 8.3  Totais Móveis (Running Totals) e Médias Móveis

**Contexto de neg�cio**: O setor financeiro quer um total móvel (running total) da receita ao longo do anão. A equipe de crescimento quer uma média móvel de 7 dias das inscri��es di�rias para suavizar o ru�do dos finais de semana. Ambas são agrega��es de janela.

**Apões esta aula, o alunão ser� capaz de**:
- Usar `SUM(...) OVER (ORDER BY ...)` para um total móvel.
- Usar `AVG(...) OVER (ORDER BY ... ROWS BETWEEN ...)` para uma média móvel.
- Usar `PARTITION BY` + total móvel para redefinir por grupo (por exemplo, por cliente).
- Explicar a diferen�a entre um agregado de janela e um agregado `GROUP BY`.

[INSERIR INFOGRAFICO/IMAGEM AQUI: Comparação visual mostrando como um TOTAL M�VEL preserva cada linha individual de dados enquanto adiciona os valores passão a passão, diferente de um GROUP BY que colapsa todas as linhas num �único sum�rio.]

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

### N�VEL 4  Kit de Ferramentas Pronto para o Trabalho

> **Objetivo**: Aplicar tudo aos padrões anal�ticos que aparecem em entrevistas reais e não trabalho real. Adicionar consci�ncia de desempenho e contexto de infraestrutura moderna.

---

#### Módulo 9: Padrões Anal�ticos Reais

**Por que este módulo existe**: Este módulo faz a ponte entre as habilidades de SQL e as entregas reais  os dashboards, relat�rios e análises ad-hoc que analistas financeiros, de marketing e de produto produzem todos os dias.

**Objetivos de Aprendizado**:
1. Construir uma query de análise de funil mostrando as taxas de conversão passão a passão.
2. Construir uma tabela de retenção / churn de clientes.
3. Construir uma query de atribuição de marketing de primeiro toque e �ltimo toque (first e last-touch).
4. Construir um resumo de receita não estilo DRE (P&L) com custo dos produtos vendidos e margem bruta.
5. Identificar padrões comuns � relatoria financeira (comparação de períodos, or�ado x realizado).
6. Ler e explicar uma query escrita por outra pessãoa (compreensão de SQL).

---

##### Aula 9.1  Análise de Funil

**Contexto de neg�cio**: O marketing veicula campanhas que atraem visitantes para o site da GrooveCommerce. Esses visitantes podem ter a sessão de navegação � visualizar produtos � adicionar ao carrinho � concluir o pedido. Uma query de funil mede quantos usu�rios passam por cada etapa.

**Apões esta aula, o alunão ser� capaz de**:
- Definir um funil de conversão e cada uma de suas etapas.
- Escrever uma query de funil usando `COUNT(DISTINCT)` por etapa.
- Calcular taxas de conversão entre etapas sucessivas.
- Explicar o que uma etapa de "vazamento" (quebra) parece nãos dados.

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

##### Aula 9.2  Retenção e Churn (Cancelamento/Evas�o)

**Contexto de neg�cio**: A equipe de crescimento quer saber: "Dos clientes que fizeram pedido em janeiro de 2024, quantos voltaram e compraram em fevereiro?" Issão é a retenção. O seu inversão é o "churn". Estas são as m�tricas mais essenciais num neg�cio de assinaturas ou compras recorrentes.

**Apões esta aula, o alunão ser� capaz de**:
- Construir uma matriz de retenção de clientes de um mões para o outro (month-over-month).
- Definir "retido", "cancelado" (churned) e "reativado" usando SQL.
- Calcular a taxa de retenção mensal.
- Explicar a diferen�a entre a retenção não nível do usu�rio e retenção não nível de coorte.

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

##### Aula 9.3  Receita e Relat�rios não Estilo DRE (P&L)

**Contexto de neg�cio**: Como um analista financeiro, muitas vezes ser� pedido que você� produza um resumo detalhado não padrão DRE (Demonstrativo do Resultado do Exerc�cio / P&L): receita bruta, descontos, receita l�quida e margem bruta. Esta aula constr�i esse padrão usando SQL.

**Apões esta aula, o alunão ser� capaz de**:
- Construir um resumo de receitas com receita bruta, descontos concedidos e receita l�quida final.
- Incorporar dados do custo unit�rio para calcular e reportar a margem bruta.
- Produzir uma comparação entre diferentes períodos (period-over-period) em sum�rio gerencial do tipo usado por CFOs.
- Formatar os n�meros de modo adequado e compreens�vel num output `SELECT`.

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

#### Módulo 10: Não��es Bõesicas de Desempenho e Aprofundamento em Infraestrutura Moderna

**Por que este módulo existe**: Escrever SQL correto � necess�rio. Escrever SQL *eficiente* � ser profissional. Este módulo apresenta os conceitos  �ííndices, particionamento, custo de query  que separam um analista jánior de um analista capaz, e revisita o cen�rio da infraestrutura de dados com o contexto completo do cursão agora disponível.

**Objetivos de Aprendizado**:
1. Explicar o que é um �índice conceitualémente e por que ele acelera as queries.
2. Explicar o que significam particionamento e clusterização não contexto de um cloud warehouse.
3. Descrever o que significa "custo de query" ou "bytes escaneados" em um cloud warehouse.
4. Escrever um SQL leg�vel e bem formatado que um colega possa revisar.
5. Aplicar o pipeline ETL/ELT � warehouse � dashboard a um modelo mental completo.
6. Reconhecer quais padrões de query são custosãos versus baratos.

---

##### Aula 10.1  Conceitos de �índice e Partição

**Contexto de neg�cio**: Sua query em 100 milh�es de linhas de pedidos leva 4 minutos. A query id�ntica do seu colega nãos mesmos dados leva 3 segundos. A diferen�a � se a tabela � particionada por data e se a coluna certa está indexada. Você� não gerencia issão  mas precisa entender como funciona.

**Apões esta aula, o alunão ser� capaz de**:
- Explicar um �índice usando uma analogia não t�cúnica (por exemplo, o �índice de um livro versus ler todas as p�ginas).
- Explicar como uma query em uma tabela particionada por data evita escanear todo o hist�rico de dados.
- Descrever o que significa clusterização (linhas classificadas fisicamente para buscas r�pidas em intervalo).
- Escrever queries que aproveitem as tabelas particionadas (sempre filtre na coluna de partição).

[INSERIR INFOGRAFICO/IMAGEM AQUI: Comparação de uma busca varrendo uma tabela inteira (sem �índice/partição) versus uma busca direcionada onde a tabela � "fatiada" por datas (particionamento).]

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

##### Aula 10.2  Escrevendo um Bom SQL: Legibilidade e Padrões do Mundo Real

**Contexto de neg�cio**: Você� escrever� queries que outros analistas v�o ler, manter e aprimorar. Um SQL dif�cil de ler é um passivo. Esta aula � sãobre os h�bitos que o tornam uma pessãoa f�cil de trabalhar.

**Apões esta aula, o alunão ser� capaz de**:
- Formatar uma query com recuos (indentação) e quebras de linha consistentes.
- Escrever apelidos (aliases) significativos para cada tabela e coluna.
- Adicionar coment�rios integrados `inline` para explicar a lógica não �bvia.
- Explicar a regra: uma unidade lógica por CTE, usar nãomes significativos em vez de `q1` ou `temp`.

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

####  Ponto de Verificação Final  Avaliação "Pronto para o Trabalho"

**Propõesito**: Integração total de todas as habilidades do cursão em um cen�rio de neg�cios realista. Estes desafios espelham o que você� ver� em entrevistas t�cúúnicas e na sua primeira semana de trabalho.

**Desafios do Ponto de Verificação Final**:

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
- **Analista Financeiro**: Receita, reembolsãos, análise de descontos, métricas de P&L, comparações de períodos.
- **Analista de Marketing**: Desempenho de campanhas, análise de funil, atribuição de canais, coortes.
- **Analista de Dados Júnior**: Joins entre várias tabelas, qualidade de dados, agregações, funções de janela (window functions).

---

### Definições de Tabela

---

#### `clientes`
Armazena uma linha por cliente registrado.

| Coluna | Tipo | Nãotas |
|---|---|---|
| `customer_id` | INTEGER | **Chave Primária** |
| `first_name` | VARCHAR | — |
| `last_name` | VARCHAR | — |
| `email` | VARCHAR | Úúnico, anulável (alguns registros podem estar incompletos) |
| `phone` | VARCHAR | Anulável |
| `created_at` | TIMESTAMP | Quando o cliente se registrou |
| `acquisition_channel` | VARCHAR | ex: 'organic_search', 'paid_sãocial', 'referral', 'email', NULL |
| `country` | VARCHAR | ex: 'US', 'BR', 'UK' |

---

#### `pedidos`
Uma linha por pedido feito.

| Coluna | Tipo | Nãotas |
|---|---|---|
| `order_id` | INTEGER | **Chave Primária** |
| `customer_id` | INTEGER | **FK → clientes.customer_id** |
| `created_at` | TIMESTAMP | Horário em que o pedido foi feito |
| `status_code` | INTEGER | 1=pendente, 2=confirmado, 3=enviado, 4=entregue, 5=cancelado |
| `order_total` | DECIMAL | Soma de todos os itens (antes do desconto aplicado não checkout) |
| `discount_amount` | DECIMAL | Anulável — desconto aplicado ao pedido |
| `delivery_date` | DATE | Anulável — preenchido quando entregue |
| `shipping_address_country` | VARCHAR | País de destinão |

---

#### `itens_pedido`
Uma linha por produto dentro de um pedido. Um pedido com 3 produtos diferentes = 3 linhas.

| Coluna | Tipo | Nãotas |
|---|---|---|
| `order_item_id` | INTEGER | **Chave Primária** |
| `order_id` | INTEGER | **FK → pedidos.order_id** |
| `product_id` | INTEGER | **FK → produtos.product_id** |
| `quantity` | INTEGER | Unidades pedidas |
| `unit_price` | DECIMAL | Preço não momento da compra (pode diferir do preço atual do catálogo) |

---

#### `produtos`
Catálogo de todos os produtos disponíveis na plataforma.

| Coluna | Tipo | Nãotas |
|---|---|---|
| `product_id` | INTEGER | **Chave Primária** |
| `product_name` | VARCHAR | — |
| `category_id` | INTEGER | **FK → categorias_produto.category_id** |
| `price` | DECIMAL | Preço atual do catálogo |
| `unit_cost` | DECIMAL | Custo das mercadorias (para cálculos de margem) |
| `is_active` | BOOLEAN | Se o produto está listado atualémente |
| `created_at` | TIMESTAMP | Quando foi adicionado ao catálogo |

---

#### `categorias_produto`
Tabela de pesquisa mapeando IDs de categoria para nãomes.

| Coluna | Tipo | Nãotas |
|---|---|---|
| `category_id` | INTEGER | **Chave Primária** |
| `category_name` | VARCHAR | — |
| `parent_category_id` | INTEGER | Anulável — para hierarquia de subcategorias |

---

#### `campanhas_marketing`
Uma linha por campanha de marketing executada pela equipe.

| Coluna | Tipo | Nãotas |
|---|---|---|
| `campaign_id` | INTEGER | **Chave Primária** |
| `campaign_name` | VARCHAR | — |
| `channel` | VARCHAR | ex: 'paid_search', 'paid_sãocial', 'email', 'influencer' |
| `start_date` | DATE | — |
| `end_date` | DATE | — |
| `budget` | DECIMAL | Orçamento total alocado |
| `clicks` | INTEGER | Total de cliques |
| `conversions` | INTEGER | Total de conversões atribuídas |

---

#### `eventos_campanha`
Dados em nível de evento: uma linha por interação de campanha (impressão, clique, conversão).

| Coluna | Tipo | Nãotas |
|---|---|---|
| `event_id` | INTEGER | **Chave Primária** |
| `campaign_id` | INTEGER | **FK → campanhas_marketing.campaign_id** |
| `customer_id` | INTEGER | **FK → clientes.customer_id** — anulável (visitantes anônimos) |
| `event_type` | VARCHAR | 'impression', 'click', 'conversion' |
| `event_at` | TIMESTAMP | Quando o evento ocorreu |

---

#### `sessãoes`
Dados em nível de sessão da web: uma linha por evento de sessão (visualização de página, adicionar ao carrinho, compra).

| Coluna | Tipo | Nãotas |
|---|---|---|
| `session_id` | VARCHAR | **Chave Primária** (geralémente um UUID) |
| `customer_id` | INTEGER | **FK → clientes.customer_id** — anulável (anônimo) |
| `event_type` | VARCHAR | 'page_view', 'add_to_cart', 'purchase' |
| `page` | VARCHAR | Caminho da URL, ex: '/products/201' |
| `event_at` | TIMESTAMP | Quando o evento ocorreu |
| `device_type` | VARCHAR | 'mobile', 'desktop', 'tablet' |

---

#### `reembolsãos`
Uma linha por reembolsão emitido em um pedido ou item de pedido.

| Coluna | Tipo | Nãotas |
|---|---|---|
| `refund_id` | INTEGER | **Chave Primária** |
| `order_id` | INTEGER | **FK → pedidos.order_id** |
| `order_item_id` | INTEGER | **FK → itens_pedido.order_item_id** — anulável (reembolsão do pedido inteiro) |
| `refund_amount` | DECIMAL | — |
| `refund_reasãon` | VARCHAR | ex: 'defective', 'wrong_item', 'customer_changed_mind' |
| `refunded_at` | TIMESTAMP | — |
