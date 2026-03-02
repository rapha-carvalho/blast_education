const fs = require('fs');
const buf = fs.readFileSync('c:/Users/Administrador/Documents/blast_education/blast_sql_vertical/Full_Course_Curriculum_PTBR.md');
console.log("First 100 bytes:", buf.slice(0, 100));
const strUtf8 = buf.toString('utf8');
const strLatin1 = buf.toString('latin1');
const strUtf16le = buf.toString('utf16le');

console.log("\nas UTF-8:");
console.log(strUtf8.substring(0, 100));
console.log("\nas Latin1:");
console.log(strLatin1.substring(0, 100));
console.log("\nas UTF-16LE:");
console.log(strUtf16le.substring(0, 100));
