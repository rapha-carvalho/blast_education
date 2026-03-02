const fs = require('fs');
const path = require('path');

// The file was corrupted: all accented chars were replaced by U+FFFD (U+FFFD = ef bf bd in UTF-8)
// We need to replace them using full-word context matches
// Strategy: read the file as UTF-8, replace FULL WORDS that contain U+FFFD with their correct forms

const REPLACEMENT = '\uFFFD';
const R = REPLACEMENT; // shorthand

const mdPath = path.join(__dirname, 'Full_Course_Curriculum_PTBR.md');
let text = fs.readFileSync(mdPath, 'utf8');

// ── Contextual word-level replacements ──────────────────────────────────────
// Each entry is [broken_form, correct_form]. Longer/more-specific patterns first.
const wordFixes = [
    // lesson title patterns – most critical
    [`Compara${R}${R}o`, 'Comparação'],
    [`compara${R}${R}o`, 'comparação'],
    [`Fun${R}${R}es`, 'Funções'],
    [`fun${R}${R}es`, 'funções'],
    [`Agrega${R}${R}o`, 'Agregação'],
    [`agrega${R}${R}o`, 'agregação'],
    [`Verifica${R}${R}es`, 'Verificações'],
    [`verifica${R}${R}es`, 'verificações'],
    [`Verifica${R}${R}o`, 'Verificação'],
    [`verifica${R}${R}o`, 'verificação'],
    [`Depura${R}${R}o`, 'Depuração'],
    [`depura${R}${R}o`, 'depuração'],
    [`Reten${R}${R}o`, 'Retenção'],
    [`reten${R}${R}o`, 'retenção'],
    [`Evas${R}${R}o`, 'Evasão'],
    [`evas${R}${R}o`, 'evasão'],
    [`Solu${R}${R}o`, 'Solução'],
    [`solu${R}${R}o`, 'solução'],
    [`Avalia${R}${R}o`, 'Avaliação'],
    [`avalia${R}${R}o`, 'avaliação'],
    [`Implementa${R}${R}o`, 'Implementação'],
    [`implementa${R}${R}o`, 'implementação'],
    [`Opera${R}${R}o`, 'Operação'],
    [`opera${R}${R}o`, 'operação'],
    [`Nota${R}${R}o`, 'Notação'],
    [`nota${R}${R}o`, 'notação'],
    [`Cria${R}${R}o`, 'Criação'],
    [`cria${R}${R}o`, 'criação'],
    [`Aloca${R}${R}o`, 'Alocação'],
    [`aloca${R}${R}o`, 'alocação'],
    [`Segmenta${R}${R}o`, 'Segmentação'],
    [`segmenta${R}${R}o`, 'segmentação'],
    [`Classifica${R}${R}o`, 'Classificação'],
    [`classifica${R}${R}o`, 'classificação'],
    [`Compress${R}${R}o`, 'Compressão'],
    [`compress${R}${R}o`, 'compressão'],
    [`Distribui${R}${R}o`, 'Distribuição'],
    [`distribui${R}${R}o`, 'distribuição'],
    [`Minera${R}${R}o`, 'Mineração'],
    [`minera${R}${R}o`, 'mineração'],

    // "ção" pattern - generic end
    [`${R}${R}o`, 'ção'],  // must come AFTER specific double-R patterns

    // single-char replacements (common accented chars)
    [`${R}s`, 'ões'],  // e.g. Funções -> Fun + R + s => corrected above
    // Better to do word-level for all common patterns:

    // que é -> O que é
    [`que ${R} `, 'que é '],
    [`que ${R}\n`, 'que é\n'],

    // "é" alone
    [`${R} SQL`, 'é SQL'],
    [`${R} um Banco`, 'é um Banco'],
    [`${R} fundamental`, 'é fundamental'],
    [`${R} o `, 'é o '],
    [`${R} a `, 'é a '],
    [`${R} um `, 'é um '],
    [`${R} uma `, 'é uma '],

    // Padrões -> Padr + R + es
    [`Padr${R}es`, 'Padrões'],
    [`padr${R}es`, 'padrões'],
    [`Padr${R}o`, 'Padrão'],
    [`padr${R}o`, 'padrão'],

    // Parênteses
    [`Par${R}nteses`, 'Parênteses'],
    [`par${R}nteses`, 'parênteses'],

    // Correspondência
    [`Correspond${R}ncia`, 'Correspondência'],
    [`correspond${R}ncia`, 'correspondência'],

    // Diferenças
    [`Diferen${R}as`, 'Diferenças'],
    [`diferen${R}as`, 'diferenças'],

    // Períodos
    [`Per${R}odos`, 'Períodos'],
    [`per${R}odos`, 'períodos'],
    [`Per${R}odo`, 'Período'],
    [`per${R}odo`, 'período'],

    // Lógica
    [`L${R}gica`, 'Lógica'],
    [`l${R}gica`, 'lógica'],

    // Histórica / história
    [`hist${R}ria`, 'história'],
    [`Hist${R}ria`, 'História'],

    // Média / Médias / médias  
    [`M${R}dias`, 'Médias'],
    [`m${R}dias`, 'médias'],
    [`M${R}dia`, 'Média'],
    [`m${R}dia`, 'média'],
    [`M${R}veis`, 'Móveis'],
    [`m${R}veis`, 'móveis'],

    // Totais Móveis
    [`M${R}vel`, 'Móvel'],
    [`m${R}vel`, 'móvel'],

    // Análise
    [`An${R}lise`, 'Análise'],
    [`an${R}lise`, 'análise'],

    // à (a + grave)
    [`${R} Esquerda`, 'à Esquerda'],
    [`${R} esquerda`, 'à esquerda'],

    // únicos / única
    [`${R}${R}nicos`, 'únicos'],
    [`${R}${R}nica`, 'única'],
    [`${R}${R}nico`, 'único'],

    // Pré e Pós
    [`Pr${R} `, 'Pré '],
    [`pr${R} `, 'pré '],
    [`P${R}s-`, 'Pós-'],
    [`p${R}s-`, 'pós-'],

    // Está
    [`Est${R} `, 'Está '],
    [`est${R} `, 'está '],

    // Ranqueando
    [`n${R}o`, 'não'],  // cautious: this could hit "no" -- do full words instead
    // Safer: do NOT do generic short replacements, focus on full word patterns

    // More specific ones
    [`n${R}o `, 'não '],
    [`N${R}o `, 'Não '],
    [`n${R}o\n`, 'não\n'],
    [`n${R}o:`, 'não:'],
    [`n${R}o,`, 'não,'],
    [`n${R}o.`, 'não.'],
    [`n${R}o-`, 'não-'],

    // são
    [`s${R}o `, 'são '],
    [`S${R}o `, 'São '],

    // então
    [`ent${R}o `, 'então '],
    [`Ent${R}o `, 'Então '],

    // também
    [`tamb${R}m`, 'também'],
    [`Tamb${R}m`, 'Também'],

    // além
    [`al${R}m`, 'além'],
    [`Al${R}m`, 'Além'],

    // após
    [`ap${R}s`, 'após'],
    [`Ap${R}s`, 'Após'],

    // serão / são / estão ...
    [`ser${R}o`, 'serão'],
    [`est${R}o`, 'estão'],
    [`Est${R}o`, 'Estão'],
    [`d${R}o`, 'dão'],
    [`far${R}o`, 'farão'],
    [`ter${R}o`, 'terão'],
    [`poder${R}o`, 'poderão'],

    // você / você
    [`voc${R}`, 'você'],
    [`Voc${R}`, 'Você'],

    // já
    [`j${R}`, 'já'],

    // Aritimética / aritmética
    [`Aritm${R}tica`, 'Aritmética'],
    [`aritm${R}tica`, 'aritmética'],

    // Prática / prática
    [`Pr${R}tica`, 'Prática'],
    [`pr${R}tica`, 'prática'],

    // básico / básica
    [`b${R}sico`, 'básico'],
    [`B${R}sico`, 'Básico'],
    [`b${R}sica`, 'básica'],

    // á / a acento agudo
    [`m${R}ximo`, 'máximo'],
    [`M${R}ximo`, 'Máximo'],
    [`m${R}xima`, 'máxima'],
    [`M${R}xima`, 'Máxima'],
    [`m${R}nimo`, 'mínimo'],
    [`M${R}nimo`, 'Mínimo'],
    [`m${R}nima`, 'mínima'],

    // índice / índices
    [`${R}ndice`, 'índice'],
    [`${R}ndices`, 'índices'],

    // público
    [`p${R}blico`, 'público'],

    // único -> handled above

    // través
    [`atrav${R}s`, 'através'],

    // Módulo
    [`M${R}dulo`, 'Módulo'],
    [`m${R}dulo`, 'módulo'],

    // Nível
    [`N${R}vel`, 'Nível'],
    [`n${R}vel`, 'nível'],

    // sequência
    [`sequ${R}ncia`, 'sequência'],
    [`Sequ${R}ncia`, 'Sequência'],

    // função  
    [`Fun${R}${R}es`, 'Funções'],  // already handled above with double-R

    // any remaining isolated replacement chars in identifiable context
];

for (const [broken, correct] of wordFixes) {
    // Use split+join for global replace (faster than regex with special chars)
    text = text.split(broken).join(correct);
}

// Save the fixed markdown
fs.writeFileSync(mdPath, text, 'utf8');
console.log('Fixed PT-BR markdown successfully.');

// Now count remaining replacement chars
const remaining = (text.match(/\uFFFD/g) || []).length;
console.log(`Remaining U+FFFD chars: ${remaining}`);

// Show remaining ones with context
if (remaining > 0) {
    const lines = text.split('\n');
    let shown = 0;
    for (let i = 0; i < lines.length && shown < 30; i++) {
        if (lines[i].includes('\uFFFD')) {
            console.log(`Line ${i + 1}: ${lines[i].substring(0, 120)}`);
            shown++;
        }
    }
}
