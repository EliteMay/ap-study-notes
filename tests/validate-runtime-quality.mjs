import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const json = rel => JSON.parse(read(rel));
const exists = rel => fs.existsSync(path.join(root, rel));
const fail = message => { throw new Error(`[runtime-quality] ${message}`); };

for (const file of [
  'json/project-meta.json','PROJECT_LEARNINGS.md','404.html',
  'js/study-state.js','js/lesson-data.js','js/shell.js','css/shell.css',
  'html/unit.html','js/unit.js','css/unit.css',
  'html/data.html','js/data-tools.js','css/data-tools.css',
  'html/diagnostics.html','js/diagnostics-view.js','css/diagnostics.css',
  'html/search.html','js/search.js','css/search.css',
  'json/phase1/index.json','js/lesson-phase1.js','css/lesson-phase1.css'
]) if (!exists(file)) fail(`missing ${file}`);

const meta = json('json/project-meta.json');
if (meta.app !== 'AP Study Guide' || !/^\d{4}\.\d{2}\.\d{2}-r\d+$/.test(String(meta.build || ''))) fail('project-meta app/build invalid');
if (meta.guide?.repository !== 'EliteMay/web-project-guide' || meta.guide?.version !== '1.17.0' || meta.guide?.adoptedAt !== '2026-09-06') fail('web-project-guide adoption metadata mismatch');
for (const profile of ['STATIC','DATA','LEARNING','TOOL','PUBLIC-CONTENT']) if (!(meta.profiles || []).includes(profile)) fail(`project profile missing ${profile}`);
if (meta.deployment?.target !== 'GitHub Pages' || Number(meta.storage?.backupSchemaVersion) !== 1) fail('deployment/storage metadata mismatch');
if (Number(meta.diagnostics?.schemaVersion) !== 1 || meta.diagnostics?.storageKey !== 'ap-study-diagnostics-v1' || meta.diagnostics?.localOnly !== true || Number(meta.diagnostics?.maxBreadcrumbs) !== 100) fail('diagnostics metadata mismatch');
if (meta.visual?.ambition !== 'high' || meta.visual?.direction !== 'friendly-study-dashboard' || !String(meta.visual?.baseline || '').includes('17-visual-quality-baseline')) fail('visual direction metadata mismatch');
if (Number(meta.phase?.active) !== 1 || meta.phase?.status !== 'in-progress' || meta.phase?.sourceOfTruth !== 'REQUIREMENTS.md') fail('Phase state metadata mismatch');

const learnings = read('PROJECT_LEARNINGS.md');
for (const required of ['# PROJECT LEARNINGS','## Failure','## Success','PL-F-001','PL-S-001','Regression Guard','Guide Feedback Queue']) if (!learnings.includes(required)) fail(`PROJECT_LEARNINGS missing ${required}`);

const shell = read('js/shell.js');
if (shell.includes('const BUILD =')) fail('shell reintroduced duplicated BUILD constant');
for (const required of [
  'project-meta.json','loadProjectMeta','APStudyUI.ready','data-ap-build','NAV_GROUPS',
  'ap-study-diagnostics-v1','APDiagnostics','DIAGNOSTICS_LIMITS','breadcrumbs:100',
  "addEventListener('error'","addEventListener('unhandledrejection'",'networkFailure','storageFailure','snapshotDiagnostics','safePath'
]) if (!shell.includes(required)) fail(`shell metadata/navigation/diagnostics missing ${required}`);
if (!shell.includes("['search','🔎 横断検索','search.html']")) fail('cross-search missing from navigation');
if (!shell.includes("['glossary','📖 単語辞書','glossary.html']")) fail('glossary missing from navigation');
if (!shell.includes("['data','💾 学習データ','data.html']")) fail('data backup page missing from navigation');
if (!shell.includes("['diagnostics','🩺 診断情報','diagnostics.html']")) fail('diagnostics missing from navigation');
if (!shell.includes("toggleAttribute('inert'")) fail('mobile drawer does not become inert when closed');
if (!shell.includes('ap-skip-link')) fail('skip link is not created');
if (/location\.(search|hash)/.test(shell) && shell.includes('breadcrumbs')) fail('diagnostics should not log query/fragment directly');

const visualCss = read('css/shell.css');
for (const required of [
  '--ap-accent: #0f766e','--ap-radius: 12px','Applied Information',
  '.unit-nav-link.is-current','body .lesson-block','@media (max-width: 920px)'
]) if (!visualCss.includes(required)) fail(`friendly visual system missing ${required}`);
if (visualCss.includes('AP / STUDY CONSOLE') || visualCss.includes('--ap-accent:#2563eb')) fail('rejected technical-console visual direction reintroduced');
const homeVisualCss = `${read('css/home.css')}\n${read('css/home-launch.css')}`;
for (const required of ['linear-gradient(135deg,#075b66','.home-launch-card.is-primary','border-radius:14px','.home-today-card','grid-template-columns:repeat(3,minmax(0,1fr))']) if (!homeVisualCss.includes(required)) fail(`r23 home visual missing ${required}`);

const unitPage = read('html/unit.html');
if (unitPage.includes('../css/home.css')) fail('Unit Hub must not depend on Home-only visual CSS');
for (const required of ['class="unit-page"','class="unit-hero"','class="unit-content"','../css/unit.css']) if (!unitPage.includes(required)) fail(`Unit Hub page structure missing ${required}`);
const unitVisualCss = read('css/unit.css');
for (const required of ['.unit-lesson-card','text-decoration:none','.unit-lesson-types','.unit-overall-progress','.unit-action.is-primary','.unit-hub-progress','@media(max-width:620px)']) if (!unitVisualCss.includes(required)) fail(`Unit Hub visual system missing ${required}`);
const unitRuntime = read('js/unit.js');
for (const required of ['CONTENT_TYPE_LABELS','unit-lesson-card','unit-lesson-state','unit-hub-progress','unit-overall-progress']) if (!unitRuntime.includes(required)) fail(`Unit Hub runtime visual structure missing ${required}`);

const state = read('js/study-state.js');
for (const required of ['LESSON_PASS_RATIO = 0.75','REVIEW_AFTER_DAYS = 14','WRITTEN_MIN_CHARS = 12','CASE_MIN_CHARS = 20','recentScores','recognizedKeys','APDiagnostics?.storageFailure']) if (!state.includes(required)) fail(`study-state missing ${required}`);
const lessonData = read('js/lesson-data.js');
if (!lessonData.includes('lesson-index.json') || !lessonData.includes('lesson-index-expansion.json') || !lessonData.includes('cache = new Map()')) fail('lesson-data is not centralized+memoized');
if (lessonData.includes('no-store')) fail('lesson-data disables browser cache');
const practiceData = read('js/practice-data.js');
const caseData = read('js/case-data.js');
if (practiceData.includes('no-store') || caseData.includes('no-store')) fail('core modular loaders disable browser cache');
for (const file of ['js/lesson.js','js/home.js','js/progress.js']) if (read(file).includes('ap-original-practice-v1.json')) fail(`${file} reads legacy 37-question snapshot`);
if (!read('js/lesson.js').includes('APLessonData.load')) fail('lesson.js does not use APLessonData');
if (!read('js/unit.js').includes('APLessonData.load')) fail('unit.js does not use APLessonData');
if (!read('js/progress.js').includes('APLessonData.load')) fail('progress.js does not use APLessonData');
if (!read('js/home.js').includes('APLessonData.load')) fail('home.js does not use APLessonData');
const practice = read('js/practice.js');
if (!practice.includes('WRITTEN_MIN_CHARS') || !practice.includes('appendRecentScore') || !practice.includes('practice-reveal') || !practice.includes('reveal.disabled = length < min')) fail('practice written answer gate/recent score logic missing');
const cases = read('js/cases.js');
if (!cases.includes('CASE_MIN_CHARS') || !cases.includes('appendRecentScore') || !cases.includes('reveal.disabled = length < min')) fail('case answer gate/recent score logic missing');
const lesson = read('js/lesson.js');
if (!lesson.includes('LESSON_PASS_RATIO') || !lesson.includes('completed:passed')) fail('lesson completion is not pass-threshold based');
const lessonPractice = read('js/lesson-practice.js');
for (const required of ['APPracticeData.load','APLessonData.load','dataset.practiceFallback','practice.html?unit=','cases.html?unit=']) if (!lessonPractice.includes(required)) fail(`lesson practice fallback missing ${required}`);
const phaseRuntime = read('js/lesson-phase1.js');
for (const required of ['PHASE1_INDEX_PATH','loadPhase1Index','loadPhase1Overlay','applyPhase1Overlay','phase1Payloads']) if (!phaseRuntime.includes(required)) fail(`Phase 1 lazy enhancement runtime missing ${required}`);
if (phaseRuntime.includes('no-store')) fail('Phase 1 enhancement loader disables browser cache');

const coverage = json('json/curriculum/ap-2026-coverage.json');
const curriculum = json('json/curriculum/ap-2026-map.json');
for (const unit of curriculum.studyUnits || []) {
  const expected = `unit.html?unit=${unit.id}`;
  if (coverage.overrides?.[unit.id]?.hubHref !== expected) fail(`${unit.id}: hub is not unified (${coverage.overrides?.[unit.id]?.hubHref})`);
}

const index = read('index.html');
for (const legacy of ['html/algorithm.html','html/computer.html','html/database.html','html/network.html','html/security.html','html/system.html','html/management.html']) if (index.includes(`href="${legacy}"`)) fail(`homepage links directly to legacy hub ${legacy}`);
if (!index.includes('home-quick-search') || !index.includes('html/search.html') || !index.includes('html/glossary.html')) fail('action-first home/search/glossary entry missing');
if (!index.includes('<html lang="ja">') || !index.includes('<meta name="description"') || !index.includes('<link rel="canonical" href="https://elitemay.github.io/ap-study-guide/">')) fail('public-content metadata missing from home');
if (index.includes('js/home-practice.js') || index.includes('js/home-cases.js') || index.includes('js/home-mock.js')) fail('homepage still loads duplicate progress renderers');
for (const stale of ['0/118','0/91','0/16','0 / 118','0 / 91','0 / 16','BUILD r17']) if (index.includes(stale)) fail(`homepage contains stale magic value ${stale}`);
const homeJs = read('js/home.js');
for (const required of ['buildQuickActions','renderLoadError','finderBound','lessonCount:lessons.length','practiceCount:questions.length','caseCount:cases.length','html/search.html?q=']) if (!homeJs.includes(required)) fail(`home runtime missing ${required}`);

const searchPage = read('html/search.html');
const searchRuntime = read('js/search.js');
for (const required of ['cross-search-input','search-type-filter','../js/search.js']) if (!searchPage.includes(required)) fail(`cross-search page missing ${required}`);
for (const required of ['TERM_MANIFESTS','loadExtendedCatalog','loadTerms','loadPractice','loadOfficial','scoreItem']) if (!searchRuntime.includes(required)) fail(`cross-search runtime missing ${required}`);

const changingCopy = {
  'html/practice.html':['91問'],
  'html/cases.html':['16Case','48設問','短問91問'],
  'html/mock.html':['長文Case14本','短問91問'],
  'html/roadmap.html':['1,422','118本']
};
for (const [file, staleValues] of Object.entries(changingCopy)) {
  const text = read(file);
  for (const stale of staleValues) if (text.includes(stale)) fail(`${file} contains changing static count ${stale}`);
}
const roadmapJs = read('js/roadmap.js');
for (const required of ['renderLoadError','study-unit-grid','official-map','再読み込み']) if (!roadmapJs.includes(required)) fail(`roadmap error state missing ${required}`);
const progressJs = read('js/progress.js');
for (const required of ['renderLoadError','progress-unit-grid','progress-middle-body','progress-next','再読み込み']) if (!progressJs.includes(required)) fail(`progress error state missing ${required}`);

const dataPage = read('html/data.html');
for (const required of ['JSONを書き出す','data-import-file','data-reset','../js/data-tools.js','aria-live="polite"']) if (!dataPage.includes(required)) fail(`data page missing ${required}`);
const dataTools = read('js/data-tools.js');
for (const required of ['recognizedKeys','expectedSchemaVersion','validateStorageValue','preview.replaceChildren','ap-study-before-restore','rollbackFailed','localStorage.setItem','localStorage.removeItem','DATA-IMPORT-VALIDATE','DATA-RESTORE-001','backup.restore']) if (!dataTools.includes(required)) fail(`data-tools missing ${required}`);
if (dataTools.includes("$('data-import-preview').innerHTML") || dataTools.includes('data-import-preview.innerHTML')) fail('import preview uses raw innerHTML');

const diagnosticsPage = read('html/diagnostics.html');
for (const required of ['LOCAL DEVELOPMENT DIAGNOSTICS','診断JSONを書き出す','diagnostics-errors','diagnostics-network','diagnostics-breadcrumbs','meta name="robots" content="noindex"','../js/diagnostics-view.js']) if (!diagnosticsPage.includes(required)) fail(`diagnostics page missing ${required}`);
const diagnosticsView = read('js/diagnostics-view.js');
for (const required of ['APDiagnostics?.snapshot','navigator.clipboard?.writeText','diagnostics.export','APDiagnostics?.clear','textContent']) if (!diagnosticsView.includes(required)) fail(`diagnostics view missing ${required}`);
if (diagnosticsView.includes('innerHTML')) fail('diagnostics view must not render diagnostic data through innerHTML');

const notFound = read('404.html');
for (const required of ['<html lang="ja">','ページが見つかりません','/ap-study-guide/','/ap-study-guide/html/roadmap.html','meta name="robots" content="noindex"']) if (!notFound.includes(required)) fail(`404 recovery missing ${required}`);

console.log(`[runtime-quality] OK: ${meta.build} / guide ${meta.guide.version} / visual ${meta.visual.direction} / profiles ${meta.profiles.join('+')} / centralized metadata, high visual baseline, Unit Hub, cross-search, lazy Phase 1 overlays, local diagnostics, public recovery, safe backup restore.`);
