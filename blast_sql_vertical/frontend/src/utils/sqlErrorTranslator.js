/**
 * SQL Error Translator — Converts English DuckDB/SQL engine error messages
 * into Portuguese explanations + actionable suggestions for beginners.
 */

const ERROR_MAP = [
    {
        // "SQL line comments (--) are not allowed"
        pattern: /line comments? \(--\)|--.*not allowed/i,
        title: "Comentários não são permitidos neste editor",
        explanation: "O editor de SQL desta plataforma não aceita linhas que começam com `--` (comentários). Isso é uma restrição de segurança do ambiente de aprendizagem.",
        suggestions: [
            "Remova qualquer linha que comece com `--` do editor.",
            "Escreva diretamente o SQL sem comentários — por exemplo: `SELECT * FROM clientes;`",
            "Se quiser adicionar uma nota, anote fora do editor, no seu caderno.",
        ],
    },
    {
        // "Block comments (/*) are not allowed"
        pattern: /block comments?|\/\*.*not allowed|\*\/.*not allowed/i,
        title: "Comentários de bloco não são permitidos",
        explanation: "O editor não aceita comentários no formato `/* ... */`. Assim como os comentários com `--`, eles estão desativados por segurança.",
        suggestions: [
            "Remova qualquer trecho entre `/*` e `*/` do seu SQL.",
            "Escreva apenas a instrução SQL pura, sem comentários.",
        ],
    },
    {
        // "Only SELECT or WITH statements are allowed"
        pattern: /only select|with statements?|not a select/i,
        title: "Apenas consultas SELECT ou CTEs (WITH) são permitidas",
        explanation: "Nesta plataforma, você só pode usar os comandos `SELECT` ou `WITH` para consultar dados. Comandos que modificam dados (como `INSERT`, `UPDATE`, `DELETE`) não são permitidos.",
        suggestions: [
            "Verifique se sua query começa com `SELECT` ou `WITH`.",
            "Exemplo: `SELECT * FROM clientes;`",
            "Se quiser usar uma CTE, comece com `WITH tabela_temp AS (...) SELECT ...`",
        ],
    },
    {
        // "Forbidden keyword: DROP / DELETE / UPDATE / INSERT / CREATE ..."
        pattern: /forbidden keyword[:\s]+(\w+)/i,
        title: "Palavra-chave não permitida",
        explanation: "Sua query contém um comando que não é permitido neste ambiente. A plataforma aceita apenas consultas de leitura (`SELECT`).",
        suggestions: [
            "Remova palavras como `DROP`, `DELETE`, `UPDATE`, `INSERT` ou `CREATE` da sua query.",
            "Use apenas `SELECT`, `FROM`, `WHERE`, `ORDER BY` e `LIMIT` por enquanto.",
        ],
    },
    {
        // "Table with name X does not exist"
        pattern: /table with name['":\s]+(\S+)['":\s]+does not exist/i,
        title: "Tabela não encontrada",
        explanation: (msg) => {
            const match = msg.match(/table with name['":\s]+(\S+)/i);
            const tableName = match?.[1]?.replace(/['"]/g, "") ?? "desconhecida";
            return `A tabela \`${tableName}\` não existe no banco de dados desta aula. Verifique se você digitou o nome corretamente.`;
        },
        suggestions: [
            "Confirme o nome exato da tabela no enunciado do desafio (ex: `clientes`, `pedidos`).",
            "Nomes de tabelas são sensíveis a maiúsculas/minúsculas em alguns bancos — use letras minúsculas.",
            "Não adicione espaços antes ou depois do nome da tabela.",
        ],
    },
    {
        // "Catalog Error" / "did you mean X"
        pattern: /catalog error|did you mean/i,
        title: "Tabela ou objeto não encontrado",
        explanation: "O banco de dados não reconheceu o nome da tabela ou coluna que você usou. Provavelmente há um erro de digitação.",
        suggestions: [
            "Verifique o nome da tabela no enunciado do desafio e copie exatamente como está.",
            "Confira se não digitou dois pontos, espaços extras ou letras maiúsculas incorretas.",
            "Use o botão 'Show Solution' para ver um exemplo de query correta.",
        ],
    },
    {
        // "Column X not found" / "column does not exist"
        pattern: /column['":\s]+(\S+)['":\s]*(not found|does not exist)|referenced column[^\w]/i,
        title: "Coluna não encontrada",
        explanation: (msg) => {
            const match = msg.match(/column['":\s]+("?[\w.]+"?)/i);
            const col = match?.[1]?.replace(/"/g, "") ?? "desconhecida";
            return `A coluna \`${col}\` não existe nesta tabela. Verifique se o nome está correto.`;
        },
        suggestions: [
            "Confira os nomes das colunas no enunciado do desafio.",
            "Lembre-se: nomes de colunas não levam acentos ou espaços (ex: `first_name` e não `nome`).",
            "Você pode usar `SELECT *` primeiro para ver todos os nomes de colunas disponíveis.",
        ],
    },
    {
        // "Empty query" / "Invalid or empty query"
        pattern: /empty query|invalid.*empty/i,
        title: "Editor vazio",
        explanation: "Você tentou executar uma query, mas o editor está vazio. Escreva seu SQL antes de clicar em Executar ou Verificar.",
        suggestions: [
            "Clique na área do editor e comece a digitar sua query.",
            "Exemplo mínimo: `SELECT * FROM clientes;`",
            "Se precisar de ajuda, clique em 'Dica' para uma dica.",
        ],
    },
    {
        // "Only single statement allowed" / "multiple statements"
        pattern: /only single statement|multiple statements/i,
        title: "Apenas uma instrução por vez",
        explanation: "Você enviou mais de uma query de uma vez (separadas por ponto e vírgula). Este editor aceita apenas uma instrução por execução.",
        suggestions: [
            "Remova todas as queries extras — deixe apenas uma.",
            "Certifique-se de que só há um ponto e vírgula no final da sua instrução.",
        ],
    },
    {
        // Generic syntax error
        pattern: /syntax error|parser error|parse error|unexpected token/i,
        title: "Erro de sintaxe",
        explanation: "Há um erro na estrutura da sua query. O banco de dados não conseguiu entender o que você escreveu.",
        suggestions: [
            "Verifique se as palavras-chave estão na ordem correta: `SELECT ... FROM ... WHERE ... ORDER BY ... LIMIT ...`",
            "Confira se não há vírgulas faltando entre os nomes das colunas.",
            "Certifique-se de que os textos (strings) estão entre aspas simples: `'valor'`.",
            "Use o botão 'Dica' para obter uma dica específica para este desafio.",
        ],
    },
    {
        // "Query exceeds maximum length"
        pattern: /exceeds maximum length/i,
        title: "Query muito longa",
        explanation: "Sua query é maior do que o limite permitido neste editor.",
        suggestions: [
            "Simplifique sua query — para os desafios desta aula, queries curtas são suficientes.",
            "Remova qualquer texto desnecessário do editor.",
        ],
    },
    {
        // "Query could not be parsed"
        pattern: /could not be parsed|could not parse/i,
        title: "Não foi possível interpretar a query",
        explanation: "O editor não conseguiu entender o SQL que você escreveu. Isso geralmente acontece quando há um erro grave de digitação.",
        suggestions: [
            "Comece do zero: apague o conteúdo do editor e escreva uma query simples.",
            "Exemplo: `SELECT * FROM clientes;`",
            "Use o botão 'Dica' para receber uma dica.",
        ],
    },
];

/**
 * @param {string} rawError - The raw English error string from the SQL engine
 * @returns {{ title: string, explanation: string, suggestions: string[] } | null}
 */
export function translateSqlError(rawError) {
    if (!rawError) return null;

    for (const entry of ERROR_MAP) {
        if (entry.pattern.test(rawError)) {
            return {
                title: entry.title,
                explanation:
                    typeof entry.explanation === "function"
                        ? entry.explanation(rawError)
                        : entry.explanation,
                suggestions: entry.suggestions,
                rawError,
            };
        }
    }

    // Fallback: unknown error
    return {
        title: "Erro ao executar a query",
        explanation: `Ocorreu um erro inesperado ao executar sua query. Verifique a sintaxe e tente novamente.`,
        suggestions: [
            "Confira se a query começa com `SELECT`.",
            "Verifique os nomes das tabelas e colunas.",
            "Use o botão 'Dica' para obter uma dica específica.",
        ],
        rawError,
    };
}
