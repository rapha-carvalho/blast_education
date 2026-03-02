const ffmpeg = require('ffmpeg-static');
const { execSync } = require('child_process');

const inputFile = "C:\\Users\\Administrador\\.gemini\\antigravity\\brain\\7dde58af-371c-4b78-9ecf-7a6fa27695a2\\report_scroll_preview_narrow_1771942831247.webp";
const outputFile = "c:\\Users\\Administrador\\Documents\\blast_education\\blast_sql_vertical\\frontend\\public\\report_scroll_preview_v2.webp";

console.log('Trimming video...');
try {
    // -ss 2 skips the first 2 seconds (the loading delay).
    // -t 7 keeps exactly 7 seconds of video.
    const cmd = `"${ffmpeg}" -y -i "${inputFile}" -ss 2 -t 7 -c copy "${outputFile}"`;
    execSync(cmd, { stdio: 'inherit' });
    console.log('Success!');
} catch (e) {
    console.error('Failed to trim:', e);
}
