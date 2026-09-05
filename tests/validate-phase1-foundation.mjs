import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));
const exists = rel => fs.existsSync(path.join(root, rel));
const fail = message => { throw new Error(`[phase1-foundation] ${message}`); };

const lessonFiles = {
  'FND-01':'json/lessons/foundation/fnd-01-bit-logic.json',
  'FND-02':'json/lessons/foundation/fnd-02-number-representation.json',
  'FND-03':'json/lessons/foundation/fnd-03-discrete-math.json',
  'FND-04':'json/lessons/foundation/fnd-04-probability-statistics.json',
  'FND-05':'json/lessons/foundation/fnd-05-information-coding.json',
  'FND-06':'json/lessons/foundation/fnd-06-queueing-communication.json',
  'FND-07':'json/lessons/foundation/fnd-07-measurement-control.json'
};
const lessonIds = Object.keys(lessonFiles);

const meta = json('json/project-meta.json');
if (meta.app !== 'AP Study Guide') fail('project name must be AP Study Guide');
if (meta.guide?.repository !== 'EliteMay/web-project-guide' || meta.guide?.version !== '1.17.0') fail('current Guide adoption metadata is stale');
for (const profile of ['STATIC','DATA','LEARNING','TOOL','PUBLIC-CONTENT']) if (!(meta.profiles || []).includes(profile)) fail(`missing profile ${profile}`);
if (Number(meta.phase?.active) !== 1 || meta.phase?.status !== 'in-progress' || meta.phase?.sourceOfTruth !== 'REQUIREMENTS.md') fail('Phase 1 state metadata invalid');

const baseIndex = json('json/lessons/lesson-index.json');
const expansionIndex = json('json/lessons/lesson-index-expansion.json');
const indexRows = [...(baseIndex.lessons || []), ...(expansionIndex.lessons || [])];
for (const id of lessonIds) {
  const rows = indexRows.filter(item => item.id === id);
  if (rows.length !== 1) fail(`${id}: expected exactly one index entry, got ${rows.length}`);
  if (rows[0].unitId !== 'foundation-theory') fail(`${id}: unitId changed from foundation-theory`);
  if (rows[0].file !== lessonFiles[id]) fail(`${id}: indexed file changed (${rows[0].file})`);
}

const practiceManifest = json('json/practice/practice-index.json');
const practiceQuestions = (practiceManifest.files || []).flatMap(ref => {
  const payload = json(ref.file);
  return Array.isArray(payload.questions) ? payload.questions : [];
});
const practiceById = new Map(practiceQuestions.map(question => [question.id, question]));
const practiceCoverage = new Map(lessonIds.map(id => [id, practiceQuestions.filter(question => (question.lessonRefs || []).includes(id))]));

const official = json('json/past/ap-public-exams.json');
const officialByKey = new Set((official.exams || []).flatMap(exam => (exam.questions || []).map(question => `${exam.id}:Q${question.number}`)));

for (const [id,file] of Object.entries(lessonFiles)) {
  const lesson = json(file);
  if (lesson.meta?.id !== id) fail(`${id}: lesson meta id mismatch`);
  if (lesson.meta?.unitId !== 'foundation-theory') fail(`${id}: lesson unitId changed`);
  if (lesson.meta?.phase1Status !== 'pilot') fail(`${id}: incomplete pilot must not be marked complete`);
  if (!['high','medium','low'].includes(lesson.meta?.importance)) fail(`${id}: importance missing/invalid`);
  if (!['high','medium','low'].includes(lesson.meta?.frequency)) fail(`${id}: frequency missing/invalid`);
  if (!String(lesson.meta?.examFocus || '').trim()) fail(`${id}: examFocus missing`);
  if (!Array.isArray(lesson.meta?.prerequisiteLessons) || !Array.isArray(lesson.meta?.relatedLessons)) fail(`${id}: prerequisite/related lesson contract missing`);
  if (!Array.isArray(lesson.meta?.relatedTerms) || lesson.meta.relatedTerms.length < 2) fail(`${id}: related terms too sparse`);
  if (!Array.isArray(lesson.meta?.relatedPracticeRefs) || !lesson.meta.relatedPracticeRefs.length) fail(`${id}: relatedPracticeRefs missing`);
  if (!Array.isArray(lesson.meta?.officialProblemRefs)) fail(`${id}: officialProblemRefs must be explicit even when empty`);
  if (!Array.isArray(lesson.objectives) || lesson.objectives.length < 3) fail(`${id}: objectives too sparse`);
  if (!Array.isArray(lesson.sections) || lesson.sections.length < 5) fail(`${id}: content depth too shallow`);
  if (!Array.isArray(lesson.inlineChecks) || lesson.inlineChecks.length < 2) fail(`${id}: inline checks missing`);
  if (!Array.isArray(lesson.checks) || lesson.checks.length < 3 || lesson.checks.length > 5) fail(`${id}: end checks must be 3-5`);
  if (!lesson.sections.some(section => section.type === 'mistakes')) fail(`${id}: common-mistake section missing`);

  const covered = practiceCoverage.get(id) || [];
  if (!covered.length) fail(`${id}: no direct practice question maps to lesson`);
  for (const ref of lesson.meta.relatedPracticeRefs) {
    const question = practiceById.get(ref);
    if (!question) fail(`${id}: related practice ${ref} not found`);
    if (!(question.lessonRefs || []).includes(id)) fail(`${id}: related practice ${ref} does not map back to lesson`);
  }
  for (const ref of lesson.meta.officialProblemRefs) {
    const key = `${ref.examId}:Q${ref.question}`;
    if (!officialByKey.has(key)) fail(`${id}: official reference ${key} not found`);
  }
}

const migration = json('json/migrations/lesson-phase1-r26.json');
if (migration.meta?.status !== 'identity-only' || migration.meta?.storageKeysChanged !== false || migration.meta?.urlContractChanged !== false) fail('migration contract must preserve current IDs/URLs/storage keys');
for (const id of lessonIds) {
  const rows = (migration.lessonMappings || []).filter(item => item.from === id);
  if (rows.length !== 1 || rows[0].strategy !== 'identity' || JSON.stringify(rows[0].to) !== JSON.stringify([id])) fail(`${id}: identity migration missing`);
}
if (migration.storage?.lessonProgressKey !== 'ap-study-lesson-progress-v1') fail('lesson progress key changed');

for (const rel of ['html/search.html','js/search.js','css/search.css','js/lesson-phase1.js','css/lesson-phase1.css']) if (!exists(rel)) fail(`missing ${rel}`);
const searchHtml = read('html/search.html');
const searchJs = read('js/search.js');
const home = read('index.html');
const homeJs = read('js/home.js');
const shell = read('js/shell.js');
const dataTools = read('js/data-tools.js');
if (!home.includes('html/search.html') || !homeJs.includes('html/search.html?q=')) fail('Home does not route unknown discovery into cross-search');
for (const required of ['lesson','term','practice','unit','official','loadExtendedCatalog','TERM_MANIFESTS']) if (!searchJs.includes(required)) fail(`cross-search runtime missing ${required}`);
if (!searchHtml.includes('cross-search-input') || !searchHtml.includes('../js/search.js')) fail('cross-search page wiring incomplete');
if (!shell.includes("['search','🔎 横断検索','search.html']")) fail('shared navigation missing cross-search');
for (const required of ["BACKUP_APP = 'AP Study Guide'",'ACCEPTED_BACKUP_APPS',"'AP Study Notes'",'legacyApp']) if (!dataTools.includes(required)) fail(`backup rename compatibility missing ${required}`);
if (!dataTools.includes('AP Study Guide学習データをすべて削除')) fail('new product name missing from destructive-data confirmation');

const officialGapIds = lessonIds.filter(id => !(json(lessonFiles[id]).meta.officialProblemRefs || []).length);
console.log(`[phase1-foundation] OK: ${lessonIds.length} IDs preserved, direct Practice coverage ${lessonIds.length}/${lessonIds.length}, cross-search wired, identity migration and legacy backup compatibility validated.`);
console.log(`[phase1-foundation] Pilot remains in-progress: ${officialGapIds.length} lessons have no explicit published-official mapping yet (${officialGapIds.join(', ')}).`);
