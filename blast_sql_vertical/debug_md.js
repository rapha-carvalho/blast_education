const fs = require('fs');
const doc = fs.readFileSync('c:/Users/Administrador/Documents/blast_education/blast_sql_vertical/Full_Course_Curriculum_PTBR.md', 'utf8');

const lines = doc.split('\n');
let count = 0;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Módulo')) {
        console.log("Found line:", lines[i].trim());
        count++;
    }
}
console.log("Total Módulo lines:", count);
