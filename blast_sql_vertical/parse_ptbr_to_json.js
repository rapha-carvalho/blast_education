const fs = require('fs');
const path = require('path');

const contentDir = path.join(__dirname, 'backend', 'content');
const coursesJsonPath = path.join(contentDir, 'courses.json');
const coursesData = JSON.parse(fs.readFileSync(coursesJsonPath, 'utf8'));

const mdPath = path.join(__dirname, 'Full_Course_Curriculum_PTBR.md');
const mdContent = fs.readFileSync(mdPath, 'utf8');
const lines = mdContent.split('\n');

let currentModuleId = null;
let currentModuleObj = null;
let currentLessonId = null;
let currentLessonIndex = -1;
let currentLessonData = null;
let currentModuleIndex = -1;
let parsingLessonContent = false;
let lessonContentLines = [];
let parsingChallenges = false;
let currentChallengeIndex = 0;
let insideSqlBlock = false;
let sqlLines = [];

// Helper to save current lesson
function saveCurrentLesson() {
    if (currentLessonData && currentModuleId && currentLessonId) {
        currentLessonData.content_markdown = lessonContentLines.join('\n').trim();
        const modFolder = currentModuleId.replace(/-/g, '_');
        const lessonFilePath = path.join(contentDir, 'sql_basics', modFolder, `${currentLessonId}.json`);

        try {
            fs.writeFileSync(lessonFilePath, JSON.stringify(currentLessonData, null, 2));
            console.log(`Saved ${lessonFilePath}`);
        } catch (e) {
            console.error(`Could not save ${lessonFilePath}: ${e.message}`);
        }
    }
}

const mainCourse = coursesData.courses.find(c => c.id === 'sql-basics');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect Module
    const modMatch = line.match(/^#### Módulo (\d+): (.*)/);
    if (modMatch) {
        saveCurrentLesson(); // save previous if any
        currentLessonData = null;
        parsingLessonContent = false;
        parsingChallenges = false;

        const modNum = parseInt(modMatch[1], 10);
        currentModuleId = `module-${modNum}`;

        // Find module in courses.json
        currentModuleObj = mainCourse.modules.find(m => m.id === currentModuleId);
        if (currentModuleObj) {
            currentModuleObj.title = modMatch[2].trim();
        }
        currentLessonIndex = -1;
        continue;
    }

    // Detect Lesson
    const lessonMatch = line.match(/^##### Aula (\d+)\.(\d+) — (.*)/);
    if (lessonMatch && currentModuleObj) {
        saveCurrentLesson();

        currentLessonIndex++;
        parsingLessonContent = true;
        parsingChallenges = false;
        lessonContentLines = [];
        currentChallengeIndex = 0;

        const lessonRef = currentModuleObj.lessons[currentLessonIndex];
        if (lessonRef) {
            currentLessonId = typeof lessonRef === 'string' ? lessonRef : lessonRef.id;

            // Update title in courses.json
            if (typeof lessonRef === 'object') {
                lessonRef.title = lessonMatch[3].trim();
            }

            // Load lesson JSON
            const modFolder = currentModuleId.replace(/-/g, '_');
            const lessonFilePath = path.join(contentDir, 'sql_basics', modFolder, `${currentLessonId}.json`);
            try {
                currentLessonData = JSON.parse(fs.readFileSync(lessonFilePath, 'utf8'));
                currentLessonData.title = lessonMatch[3].trim();
            } catch (e) {
                console.error(`Could not read ${lessonFilePath}`);
                currentLessonData = null;
            }
        } else {
            currentLessonData = null;
        }
        continue;
    }

    if (currentLessonData) {
        if (line.match(/^\*\*Desafios\*\*:/)) {
            parsingLessonContent = false;
            parsingChallenges = true;
            continue;
        }

        if (parsingLessonContent) {
            lessonContentLines.push(line);
        } else if (parsingChallenges) {
            if (line.startsWith('```sql')) {
                insideSqlBlock = true;
                sqlLines = [];
            } else if (insideSqlBlock && line.startsWith('```')) {
                insideSqlBlock = false;
                // Update starter_query for the current challenge
                if (currentLessonData.exercises && currentLessonData.exercises[currentChallengeIndex]) {
                    currentLessonData.exercises[currentChallengeIndex].starter_query = sqlLines.join('\n').trim();
                    // Because I translated the titles in the original script but the exercises don't have explicit titles in the translation file.
                    // We just overwrite the starter_query and preserve the actual solution validation logic.
                }
                currentChallengeIndex++;
            } else if (insideSqlBlock) {
                sqlLines.push(line);
            }
        }
    }
}

saveCurrentLesson();

// Update objective for modules (Optional but nice, if we want to extract it. Since we didn't extract it above, we just leave it untouched or update manually if needed, but updating title and lessons is what matters for the UI menu).

fs.writeFileSync(coursesJsonPath, JSON.stringify(coursesData, null, 2));
console.log('Successfully updated all JSON files.');
