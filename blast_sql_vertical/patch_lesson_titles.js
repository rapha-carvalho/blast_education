/**
 * Patch ALL lesson JSON titles (and module titles in courses.json)
 * by scanning every module_X folder and matching by filename.
 */
const fs = require('fs');
const path = require('path');

const contentDir = path.join(__dirname, 'backend', 'content');
const coursesJsonPath = path.join(contentDir, 'courses.json');
const sqlBasicsDir = path.join(contentDir, 'sql_basics');

// Ground-truth: filename (without .json) -> correct PT-BR title
const correctTitles = {
    // Module 1 lessons (inside module_1/)
    lesson_m1_1: 'O que é SQL e por que isso importa?',
    lesson_m1_2: 'O que é um Banco de Dados? Tabelas, Linhas e Colunas',
    lesson_m1_3: 'OLTP vs OLAP: Dois Trabalhos, Dois Tipos de Banco de Dados',
    lesson_m1_4: 'ETL, ELT e Como os Dados Chegam ao Data Warehouse',
    lesson_m1_5: 'Cloud Data Warehouses, Data Lakes e Lakehouses',

    // Module 2 lessons (inside module_2/)
    lesson_m2_1: 'WHERE e Operadores de Comparação',
    lesson_m2_2: 'AND, OR e Parênteses',
    lesson_m2_3: 'BETWEEN e IN',
    lesson_m2_4: 'LIKE e Correspondência de Padrões',
    lesson_m2_5: 'NULL: O Problema Silencioso dos Dados',
    lesson_m2_6: 'ORDER BY, LIMIT e OFFSET',

    // Module 3 lessons (inside module_3/)
    lesson_m3_1: 'Funções de Agregação: COUNT, SUM, AVG, MIN, MAX',
    lesson_m3_2: 'GROUP BY: Agregando por Categoria',
    lesson_m3_3: 'WHERE vs HAVING: Filtros Pré e Pós-Agregação',
    lesson_m3_4: 'COUNT(DISTINCT) e Contagem de Valores Únicos',
    lesson_m3_5: 'Ponto de Verificação B',

    // Module 4 lessons (inside module_4/)
    lesson_m4_1: 'INNER JOIN: Apenas Registros Correspondentes',
    lesson_m4_2: 'LEFT JOIN: Mantenha Tudo à Esquerda',
    lesson_m4_3: 'Depuração de Join: Quando a Contagem de Linhas Está Errada',

    // Module 5 lessons (inside module_5/)
    lesson_m5_1: 'Extraindo e Truncando Datas',
    lesson_m5_2: 'Aritmética de Datas e Diferenças de Tempo',
    lesson_m5_3: 'Comparações de Períodos e Coortes',

    // Module 6 lessons (inside module_6/)
    lesson_m6_1: 'CASE WHEN: Lógica Condicional em SQL',
    lesson_m6_2: 'COALESCE, NULLIF e Tratamento de Dados Ausentes',
    lesson_m6_3: 'Verificações de Qualidade de Dados com SQL',

    // Module 7 lessons (inside module_7/)
    lesson_m7_1: 'Subqueries',
    lesson_m7_2: 'CTEs: Escrevendo SQL que Parece uma História',

    // Module 8 lessons (inside module_8/)
    lesson_m8_1: 'Ranqueando com ROW_NUMBER, RANK, DENSE_RANK',
    lesson_m8_2: 'LAG e LEAD: Comparando Linhas no Tempo',
    lesson_m8_3: 'Totais Móveis (Running Totals) e Médias Móveis',

    // Module 9 lessons (inside module_9/)
    lesson_m9_1: 'Análise de Funil',
    lesson_m9_2: 'Retenção e Churn (Cancelamento / Evasão)',
    lesson_m9_3: 'Relatórios de Lucro e Perda com SQL',

    // Module 10 lessons (inside module_10/)
    lesson_m10_1: 'Escrevendo SQL de Alto Desempenho',
    lesson_m10_2: 'Escrevendo SQL Legível e Sustentável',
    lesson_m9_3_extra: 'Avaliação Final',
};

// Correct module titles
const correctModuleTitles = {
    'module-1': 'SQL e o Mundo de Dados Moderno',
    'module-2': 'Filtrando e Fatiando Dados',
    'module-3': 'Agregando Dados',
    'module-4': 'JOINs: Combinando Tabelas',
    'module-5': 'Análise de Datas e Séries Temporais',
    'module-6': 'Lógica Condicional e Qualidade de Dados',
    'module-7': 'Subqueries e CTEs',
    'module-8': 'Window Functions',
    'module-9': 'Análise de Negócio Avançada',
    'module-10': 'Performance e Boas Práticas de SQL',
};

// ── Scan and patch all lesson JSON files ─────────────────────────────────────
let patched = 0;
const modFolders = fs.readdirSync(sqlBasicsDir).filter(f => f.startsWith('module_'));

for (const modFolder of modFolders) {
    const modDir = path.join(sqlBasicsDir, modFolder);
    const files = fs.readdirSync(modDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
        const lessonId = file.replace('.json', '');
        const correctTitle = correctTitles[lessonId];
        if (!correctTitle) continue;

        const filePath = path.join(modDir, file);
        let data;
        try {
            data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            console.log(`  ERR parsing ${filePath}: ${e.message}`);
            continue;
        }
        data.title = correctTitle;
        data.objective = correctTitle;
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`  Patched: ${modFolder}/${file} → "${correctTitle}"`);
        patched++;
    }
}

// ── Patch courses.json ────────────────────────────────────────────────────────
const courses = JSON.parse(fs.readFileSync(coursesJsonPath, 'utf8'));
for (const course of courses.courses) {
    for (const mod of course.modules) {
        if (correctModuleTitles[mod.id]) {
            mod.title = correctModuleTitles[mod.id];
        }
        // Fix any lesson titles in module's lesson index
        for (const lesson of mod.lessons || []) {
            if (correctTitles[lesson.id]) {
                lesson.title = correctTitles[lesson.id];
            }
        }
    }
}
fs.writeFileSync(coursesJsonPath, JSON.stringify(courses, null, 2), 'utf8');

console.log(`\nTotal patched lesson files: ${patched}`);
console.log('Patched courses.json module and lesson titles.');
