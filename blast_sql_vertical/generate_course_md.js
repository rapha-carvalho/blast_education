const fs = require('fs');
const path = require('path');

const contentDir = path.join(__dirname, 'backend', 'content');
const coursesJsonPath = path.join(contentDir, 'courses.json');
const coursesData = JSON.parse(fs.readFileSync(coursesJsonPath, 'utf8'));

let md = `# Complete Curriculum\n\n`;

for (const course of coursesData.courses || []) {
    md += `# Course: ${course.title}\n\n`;

    for (const mod of course.modules || []) {
        md += `## Module: ${mod.title}\n`;
        if (mod.objective) {
            md += `*Objective*: ${mod.objective}\n\n`;
        }

        // figure out module folder name, e.g. sql-basics -> sql_basics, module-1 -> module_1
        const courseFolder = course.id.replace(/-/g, '_');
        const modFolder = mod.id.replace(/-/g, '_');

        for (const L of mod.lessons || []) {
            const lessonId = typeof L === 'string' ? L : L.id;
            const lessonTitle = typeof L === 'object' && L.title ? L.title : lessonId;

            md += `### Lesson: ${lessonTitle}\n\n`;

            const lessonFilePath = path.join(contentDir, courseFolder, modFolder, `${lessonId}.json`);
            try {
                const lessonData = JSON.parse(fs.readFileSync(lessonFilePath, 'utf8'));

                if (lessonData.content_markdown) {
                    md += `${lessonData.content_markdown}\n\n`;
                }

                if (lessonData.exercises && lessonData.exercises.length > 0) {
                    md += `#### Challenges\n\n`;
                    lessonData.exercises.forEach((ex, idx) => {
                        md += `##### Challenge ${idx + 1}: ${ex.title || 'Exercise'}\n`;
                        md += `${ex.prompt_markdown || ''}\n\n`;
                        if (ex.starter_query) {
                            md += `**Starter Query:**\n\`\`\`sql\n${ex.starter_query}\n\`\`\`\n\n`;
                        }
                    });
                }
            } catch (err) {
                md += `*(Lesson content file not found for ${lessonId})*\n\n`;
            }
        }
    }
}

const outputPath = path.join(__dirname, 'Full_Course_Curriculum.md');
fs.writeFileSync(outputPath, md);
console.log('Successfully generated Full_Course_Curriculum.md');
