// Diagnose the exact byte sequences in the PT-BR markdown for broken lesson titles
const fs = require('fs');
const buf = fs.readFileSync('./Full_Course_Curriculum_PTBR.md');

// Find lines with lesson headers (##### Aula)
const text = buf.toString('binary'); // read as latin1/binary to see raw bytes
const lines = text.split('\n');

let count = 0;
for (const line of lines) {
    if (line.includes('##### Aula') || (line.includes('#####') && count < 50)) {
        // Print the raw bytes for each suspicious character
        for (let i = 0; i < line.length; i++) {
            const code = line.charCodeAt(i);
            if (code > 127) {
                process.stdout.write(`[${code.toString(16)}]`);
            } else {
                process.stdout.write(line[i]);
            }
        }
        console.log();
        count++;
        if (count > 30) break;
    }
}
