/**
 * PT-BR text normalization helper.
 *
 * Fixes common mojibake produced when UTF-8 text is decoded as Latin-1/Windows-1252
 * (for example: mojibake like "an...lise" becomes "análise").
 */

const MOJIBAKE_SIGNATURES = [
  "Ã¡",
  "Ã¢",
  "Ã£",
  "Ã©",
  "Ãª",
  "Ã­",
  "Ã³",
  "Ã´",
  "Ãµ",
  "Ãº",
  "Ã§",
  "Ã",
  "Ã‰",
  "Ã“",
  "Ãš",
  "Ã‡",
  "Â ",
  "Â·",
  "â€“",
  "â€”",
  "â€œ",
  "â€",
  "â€˜",
  "â€™",
  "â€¦",
  "â€¢",
  "â‚¬",
  "ðŸ",
];
const REPLACEMENT_CHAR = "\uFFFD";
const QUESTION_MARK_FIXES = [
  ["aquisi??o", "aquisi\u00e7\u00e3o"],
  ["Descri??o", "Descri\u00e7\u00e3o"],
  ["descri??o", "descri\u00e7\u00e3o"],
  ["produ??o", "produ\u00e7\u00e3o"],
  ["medi??o", "medi\u00e7\u00e3o"],
  ["M?trica", "M\u00e9trica"],
  ["m?trica", "m\u00e9trica"],
  ["P?blico", "P\u00fablico"],
  ["p?blico", "p\u00fablico"],
  ["l?gica", "l\u00f3gica"],
  ["L?gica", "L\u00f3gica"],
  ["l?quida", "l\u00edquida"],
  ["L?quida", "L\u00edquida"],
  ["r?pido", "r\u00e1pido"],
  ["R?pido", "R\u00e1pido"],
  ["est?", "est\u00e1"],
  ["Est?", "Est\u00e1"],
  ["?nico", "\u00fanico"],
  ["?nica", "\u00fanica"],
  ["?nicos", "\u00fanicos"],
  ["?nicas", "\u00fanicas"],
];
const REPLACEMENT_CHAR_FIXES = [
  [`Voc${REPLACEMENT_CHAR}`, "Você"],
  [`voc${REPLACEMENT_CHAR}`, "você"],
  [`j${REPLACEMENT_CHAR}`, "já"],
  [`N${REPLACEMENT_CHAR}o`, "Não"],
  [`n${REPLACEMENT_CHAR}o`, "não"],
  [`m${REPLACEMENT_CHAR}s`, "mês"],
  [`mar${REPLACEMENT_CHAR}o`, "março"],
  [`milh${REPLACEMENT_CHAR}es`, "milhões"],
  [`v${REPLACEMENT_CHAR}rios`, "vários"],
  [`exporta${REPLACEMENT_CHAR}${REPLACEMENT_CHAR}o`, "exportação"],
  [`decis${REPLACEMENT_CHAR}es`, "decisões"],
  [`programa${REPLACEMENT_CHAR}${REPLACEMENT_CHAR}o`, "programação"],
  [`est${REPLACEMENT_CHAR}o`, "estão"],
  [`t${REPLACEMENT_CHAR}m`, "têm"],
  [`${REPLACEMENT_CHAR} uma `, "é uma "],
  [`${REPLACEMENT_CHAR} um `, "é um "],
  [`${REPLACEMENT_CHAR} o `, "é o "],
  [`${REPLACEMENT_CHAR} a `, "é a "],
];

function decodeLatin1AsUtf8(input) {
  if (typeof TextDecoder === "undefined" || typeof input !== "string") {
    return input;
  }
  try {
    const bytes = new Uint8Array(input.length);
    for (let i = 0; i < input.length; i += 1) {
      bytes[i] = input.charCodeAt(i) & 0xff;
    }
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return input;
  }
}

function mojibakeScore(value) {
  const matches = value.match(/[\u00c2\u00c3\u00f0\uFFFD]/gu);
  return matches ? matches.length : 0;
}

function hasMojibakeHint(value) {
  if (value.includes(REPLACEMENT_CHAR)) return true;
  return MOJIBAKE_SIGNATURES.some((seq) => value.includes(seq));
}

function applyQuestionMarkFixes(value) {
  let out = value;
  for (const [bad, good] of QUESTION_MARK_FIXES) {
    out = out.replaceAll(bad, good);
  }
  return out;
}

function applyReplacementCharFixes(value) {
  let out = value;
  for (const [bad, good] of REPLACEMENT_CHAR_FIXES) {
    out = out.replaceAll(bad, good);
  }
  return out;
}

/**
 * Fixes common PT-BR mojibake (UTF-8 read as Latin-1).
 * @param {string} text - Raw text that may contain mojibake
 * @returns {string} Normalized PT-BR text
 */
export function fixPtBrText(text) {
  if (text == null || typeof text !== "string") return text;

  let out = applyReplacementCharFixes(applyQuestionMarkFixes(text));
  for (let pass = 0; pass < 3; pass += 1) {
    if (!hasMojibakeHint(out)) break;
    const decoded = decodeLatin1AsUtf8(out);
    if (!decoded || decoded === out) break;
    if (mojibakeScore(decoded) > mojibakeScore(out)) break;
    out = decoded;
  }

  return applyReplacementCharFixes(applyQuestionMarkFixes(out));
}
