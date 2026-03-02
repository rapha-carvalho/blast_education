const fs = require('fs');

const file = 'c:/Users/Administrador/Documents/blast_education/blast_sql_vertical/Full_Course_Curriculum_PTBR_Fixed.md';
let content = fs.readFileSync(file, 'utf8');

// Try to reverse the Windows-1252 -> UTF-8 double encoding
// By converting each character back to its byte equivalent (since it was read as Windows-1252)
let buf = Buffer.alloc(content.length);
let valid = true;
for (let i = 0; i < content.length; i++) {
    let charCode = content.charCodeAt(i);
    if (charCode > 255) {
        // some characters might be outside 255 if Windows-1252 mapped them to special Unicode points
        // for now, just keep it or fallback
        if (charCode === 8220) charCode = 147; // “
        else if (charCode === 8221) charCode = 148; // ”
        else if (charCode === 8211) charCode = 150; // –
        else if (charCode === 8212) charCode = 151; // —
        else if (charCode === 8216) charCode = 145; // ‘
        else if (charCode === 8217) charCode = 146; // ’
        else if (charCode === 8218) charCode = 130; // ‚
        else if (charCode === 402) charCode = 131;  // ƒ
        else if (charCode === 8222) charCode = 132; // „
        else if (charCode === 8230) charCode = 133; // …
        else if (charCode === 8224) charCode = 134; // †
        else if (charCode === 8225) charCode = 135; // ‡
        else if (charCode === 710) charCode = 136;  // ˆ
        else if (charCode === 8240) charCode = 137; // ‰
        else if (charCode === 352) charCode = 138;  // Š
        else if (charCode === 8249) charCode = 139; // ‹
        else if (charCode === 338) charCode = 140;  // Œ
        else if (charCode === 381) charCode = 142;  // Ž
        else if (charCode === 8482) charCode = 153; // ™
        else if (charCode === 353) charCode = 154;  // š
        else if (charCode === 8250) charCode = 155; // ›
        else if (charCode === 339) charCode = 156;  // œ
        else if (charCode === 382) charCode = 158;  // ž
        else if (charCode === 376) charCode = 159;  // Ÿ
    }
    buf[i] = charCode & 0xFF;
}

let fixed = buf.toString('utf8');

fs.writeFileSync(file, fixed, 'utf8');
console.log("Fixed Mojibake. First 100 chars:", fixed.substring(0, 100));
