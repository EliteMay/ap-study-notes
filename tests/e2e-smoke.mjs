import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.AP_BASE_URL || 'http://127.0.0.1:4173';
await fs.mkdir('artifacts', { recursive:true });
const browser = await chromium.launch({ headless:true });
const page = await browser.newPage({ viewport:{ width:1280, height:900 } });
const errors = [];
page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
page.on('console', msg => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });

async function goto(path) {
  await page.goto(`${base}/${path}`, { waitUntil:'networkidle' });
}

async function assertNoHorizontalOverflow(label) {
  const metrics = await page.evaluate(() => ({ width:document.documentElement.clientWidth, scroll:document.documentElement.scrollWidth }));
  if (metrics.scroll > metrics.width + 1) throw new Error(`${label}: horizontal overflow ${metrics.scroll}px > ${metrics.width}px`);
}

try {
  const projectMeta = await (await fetch(`${base}/json/project-meta.json`)).json();
  if (!projectMeta?.build) throw new Error('project-meta build missing');
  if (projectMeta?.app !== 'AP Study Guide') throw new Error('current product name not adopted');
  if (projectMeta?.guide?.version !== '1.17.0') throw new Error('latest guide version not adopted');
  if (!(projectMeta?.profiles || []).includes('LEARNING')) throw new Error('LEARNING project profile missing');
  if (projectMeta?.phase?.active !== 1 || projectMeta?.phase?.status !== 'in-progress') throw new Error('Phase 1 state metadata missing');
  if (projectMeta?.visual?.direction !== 'friendly-study-dashboard') throw new Error('friendly visual direction metadata missing');

  const curriculum = await (await fetch(`${base}/json/curriculum/ap-2026-map.json`)).json();
  const expectedUnitCount = (curriculum.studyUnits || []).length;

  await goto('index.html');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('ap-study-theme','light'); });
  await page.reload({ waitUntil:'networkidle' });
  if (!await page.getByRole('heading', { name:'何をするか選ぶだけ。' }).isVisible()) throw new Error('action-first homepage heading missing');
  if (await page.locator('#home-unit-grid .unit-card').count() !== expectedUnitCount) throw new Error(`homepage unit count must follow curriculum data (${expectedUnitCount})`);
  if (await page.locator('.home-launch-card').count() !== 9) throw new Error('homepage must expose 9 current main actions including cross-search');
  if (!await page.getByRole('link', { name:/まとめて検索/ }).isVisible()) throw new Error('cross-search launcher missing from Home');
  await page.waitForFunction(expected => document.querySelector('[data-ap-build]')?.textContent?.includes(expected), projectMeta.build);
  if ((await page.locator('#hero-lesson').textContent())?.includes('…')) throw new Error('homepage lesson count stayed in loading state');

  const visualContract = await page.evaluate(() => {
    const hero = getComputedStyle(document.querySelector('.home-hero'));
    const launch = getComputedStyle(document.querySelector('.home-launch-grid'));
    const launchCard = getComputedStyle(document.querySelector('.home-launch-card'));
    const sidebar = getComputedStyle(document.querySelector('.unit-nav'));
    return {
      heroBackgroundImage:hero.backgroundImage,
      heroTextAlign:hero.textAlign,
      launchGrid:launch.display,
      cardRadius:launchCard.borderRadius,
      cardShadow:launchCard.boxShadow,
      sidebarWidth:sidebar.width
    };
  });
  if (visualContract.heroTextAlign !== 'center' || !visualContract.heroBackgroundImage.includes('linear-gradient')) throw new Error('friendly hero visual contract not applied');
  if (visualContract.launchGrid !== 'grid') throw new Error('quick start grid missing');
  if (visualContract.cardRadius !== '14px' || visualContract.cardShadow === 'none') throw new Error('quick actions must remain clearly grouped and clickable');
  if (visualContract.sidebarWidth !== '224px') throw new Error(`friendly sidebar width mismatch: ${visualContract.sidebarWidth}`);
  await page.screenshot({ path:'artifacts/home-desktop.png', fullPage:true });

  await page.locator('#home-quick-search').fill('OAuth');
  if (!await page.locator('#home-quick-results').isVisible()) throw new Error('homepage quick finder did not open');
  const finderText = await page.locator('#home-quick-results').textContent();
  if (!finderText?.includes('すべてから検索')) throw new Error('homepage quick finder does not route unknown content into cross-search');
  const finderFallback = page.locator('#home-quick-results a[href*="html/search.html?q=OAuth"]');
  if (!await finderFallback.isVisible()) throw new Error('homepage cross-search fallback href missing');

  const diagnostics = await page.evaluate(async expectedBuild => {
    window.APDiagnostics?.error?.('E2E-SYNTHETIC', new Error('synthetic runtime error'), 'e2e');
    window.APDiagnostics?.networkFailure?.({ method:'GET', path:'/diagnostic-e2e?secret=must-not-log', status:599, error:'synthetic network failure' });
    window.APDiagnostics?.breadcrumb?.('e2e.marker', { phase:'home' });
    await window.APStudyUI?.ready;
    return window.APDiagnostics?.snapshot?.('e2e-smoke');
  }, projectMeta.build);
  if (!diagnostics || diagnostics.project.build !== projectMeta.build || diagnostics.project.name !== 'AP Study Guide') throw new Error('diagnostics project metadata mismatch');
  if (!diagnostics.errors.some(item => item.code === 'E2E-SYNTHETIC')) throw new Error('diagnostics did not persist runtime error');
  if (!diagnostics.networkFailures.some(item => item.path === '/diagnostic-e2e' && item.status === 599)) throw new Error('diagnostics did not persist sanitized network failure');
  if (JSON.stringify(diagnostics).includes('must-not-log')) throw new Error('diagnostics leaked URL query data');
  if ((diagnostics.breadcrumbs || []).length > 100) throw new Error('diagnostics breadcrumb ring buffer exceeded limit');

  await goto('html/search.html?q=FND-02');
  await page.waitForFunction(() => [...document.querySelectorAll('.search-result code')].some(node => node.textContent === 'FND-02'));
  if (!await page.locator('.search-result').filter({ hasText:'FND-02' }).filter({ hasText:'2進数・基数変換・補数・数値表現' }).first().isVisible()) throw new Error('cross-search failed to find Lesson by exact ID');
  const lessonFilterOption = page.locator('#search-type-filter option[value="lesson"]');
  if (await lessonFilterOption.count() !== 1 || (await lessonFilterOption.textContent())?.trim() !== 'Lesson') throw new Error('cross-search type filter missing');

  await goto('html/search.html?q=OAuth');
  await page.waitForFunction(() => document.querySelectorAll('.search-result').length > 0 && !document.querySelector('#search-loading')?.textContent?.includes('読み込み中'));
  const searchText = (await page.locator('#search-results').textContent())?.toLowerCase() || '';
  if (!searchText.includes('oauth')) throw new Error('cross-search failed to find OAuth');
  if (!await page.locator('.search-type.type-term').first().isVisible()) throw new Error('cross-search term result type missing');

  await goto('html/search.html?q=PC-FND-01');
  await page.waitForFunction(() => [...document.querySelectorAll('.search-result code')].some(node => node.textContent === 'PC-FND-01'));
  if (!await page.locator('.search-type.type-practice').first().isVisible()) throw new Error('cross-search practice result type missing');

  await goto('html/glossary.html?q=OAuth');
  await page.waitForFunction(() => document.querySelectorAll('.glossary-card').length > 0);
  if (!(await page.locator('#glossary-result-count').textContent())?.includes('語が一致')) throw new Error('glossary result count missing');
  if (!(await page.locator('#glossary-results').textContent())?.toLowerCase().includes('oauth')) throw new Error('glossary search failed for OAuth');
  const firstDetail = page.locator('[data-detail-button]').first();
  await firstDetail.click();
  if (await page.locator('.glossary-detail:not([hidden])').count() !== 1) throw new Error('glossary lazy detail did not open');

  await goto('html/unit.html?unit=security');
  if (!(await page.locator('#unit-hero h1').textContent())?.includes('セキュリティ')) throw new Error('generic security hub failed');
  const unitGlossary = page.getByRole('link', { name:'単語辞書', exact:true });
  if (!await unitGlossary.isVisible()) throw new Error('unified glossary link missing from generic hub');
  if ((await unitGlossary.getAttribute('href')) !== 'glossary.html?domain=security') throw new Error('security hub glossary filter mismatch');

  const lessonIndexes = await Promise.all([
    fetch(`${base}/json/lessons/lesson-index.json`).then(response => response.json()),
    fetch(`${base}/json/lessons/lesson-index-expansion.json`).then(response => response.json())
  ]);
  const allLessons = lessonIndexes.flatMap(index => index.lessons || []);
  const practiceIndex = await (await fetch(`${base}/json/practice/practice-index.json`)).json();
  const practicePayloads = await Promise.all((practiceIndex.files || []).map(entry => fetch(`${base}/${entry.file}`).then(response => response.json())));
  const practiceQuestions = practicePayloads.flatMap(payload => payload.questions || []);
  const directLessonIds = new Set(practiceQuestions.flatMap(question => question.lessonRefs || []));
  const uncoveredLessons = allLessons.filter(lesson => !directLessonIds.has(lesson.id));
  if (uncoveredLessons.length) throw new Error(`all current lessons must have direct practice coverage: ${uncoveredLessons.map(item => item.id).join(', ')}`);

  await goto('html/lesson.html?id=ALG-01');
  const directPractice = page.locator('a[href="practice.html?unit=algorithm-programming&question=PC-ALG-01"]');
  await directPractice.waitFor({ state:'visible' });
  if (await page.locator('[data-practice-fallback="true"]').count()) throw new Error('covered lesson unexpectedly rendered practice fallback');
  const lessonBlockStyle = await page.locator('.lesson-block').first().evaluate(node => ({ radius:getComputedStyle(node).borderRadius, shadow:getComputedStyle(node).boxShadow }));
  if (lessonBlockStyle.radius !== '12px' || lessonBlockStyle.shadow === 'none') throw new Error('friendly lesson surface contract missing');
  await page.screenshot({ path:'artifacts/lesson-desktop.png', fullPage:true });
  await directPractice.click();
  await page.waitForSelector('#practice-question');
  if (!(await page.locator('#practice-question').textContent())?.includes('擬似言語のトレース')) throw new Error('direct lesson practice did not open PC-ALG-01');

  await goto('html/lesson.html?id=FND-02');
  await page.waitForSelector('.check-question');
  await page.waitForSelector('.lesson-connections');
  if (await page.locator('.lesson-inline-check').count() !== 2) throw new Error('Foundation Phase 1 inline checks missing');
  const metaRowText = await page.locator('.lesson-meta-row').textContent();
  if (!metaRowText?.includes('重要度') || !metaRowText?.includes('頻出度') || !metaRowText?.includes('Phase 1 再編中')) throw new Error('Foundation Phase 1 metadata chips missing');
  if (!(await page.locator('.lesson-connections').textContent())?.includes('このLessonの位置づけ')) throw new Error('Foundation learning map missing');
  const foundationLesson = await (await fetch(`${base}/json/lessons/foundation/fnd-02-number-representation.json`)).json();
  const firstInline = page.locator('.lesson-inline-check').first();
  await firstInline.locator(`[data-inline-option="${foundationLesson.inlineChecks[0].answerIndex}"]`).click();
  if (!await firstInline.locator('.lesson-inline-feedback:not([hidden])').isVisible()) throw new Error('inline check feedback did not render');

  const cards = page.locator('.check-question');
  for (let i = 0; i < foundationLesson.checks.length; i += 1) {
    const correct = Number(foundationLesson.checks[i].answerIndex);
    const wrong = correct === 0 ? 1 : 0;
    await cards.nth(i).locator(`[data-option="${wrong}"]`).click();
  }
  const lessonState = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('ap-study-lesson-progress-v1') || '{}');
    return window.APStudyState.lessonState(raw['FND-02']);
  });
  if (lessonState.mastered) throw new Error('failed lesson was incorrectly mastered');

  await goto('html/practice.html?unit=database&type=written&question=P-DB-03');
  await page.waitForSelector('#practice-written-answer');
  if (!(await page.locator('#practice-reveal').isDisabled())) throw new Error('written model answer should be locked when blank');
  await page.locator('#practice-written-answer').fill('インデックスは選択率や条件式によって利用効率が変わるため、常に高速化するとは限らない。');
  if (await page.locator('#practice-reveal').isDisabled()) throw new Error('written model answer did not unlock after real answer');

  await goto('html/cases.html?unit=database&case=CASE-DB-01');
  await page.waitForSelector('.case-question textarea');
  const firstCase = page.locator('.case-question').first();
  if (!(await firstCase.locator('.case-reveal').isDisabled())) throw new Error('case model answer should be locked when blank');
  await firstCase.locator('textarea').fill('在庫更新が同時実行されると競合が起きるため、トランザクションとロックで整合性を守る必要がある。');
  if (await firstCase.locator('.case-reveal').isDisabled()) throw new Error('case model answer did not unlock');

  await page.setViewportSize({ width:320, height:700 });
  await goto('index.html');
  await assertNoHorizontalOverflow('home 320px');
  await page.screenshot({ path:'artifacts/home-mobile.png', fullPage:true });
  const menu = page.locator('.ap-mobile-menu');
  const nav = page.locator('.unit-nav');
  if ((await nav.getAttribute('inert')) === null) throw new Error('closed mobile nav must be inert');
  await menu.click();
  if ((await nav.getAttribute('inert')) !== null) throw new Error('open mobile nav must not be inert');
  await page.keyboard.press('Escape');
  if ((await nav.getAttribute('inert')) === null) throw new Error('Escape must close and inert mobile nav');

  await goto('html/search.html?q=FND-02');
  await page.waitForFunction(() => document.querySelectorAll('.search-result').length > 0);
  await assertNoHorizontalOverflow('search 320px');
  await goto('html/lesson.html?id=FND-02');
  await page.waitForSelector('.lesson-inline-check');
  await assertNoHorizontalOverflow('foundation lesson 320px');
  await goto('html/glossary.html?q=OAuth');
  await page.waitForFunction(() => document.querySelectorAll('.glossary-card').length > 0);
  await assertNoHorizontalOverflow('glossary 320px');
  await goto('html/diagnostics.html');
  await page.waitForFunction(() => document.querySelector('#diagnostics-build')?.textContent?.includes('2026.'));
  await assertNoHorizontalOverflow('diagnostics 320px');

  await page.setViewportSize({ width:1280, height:900 });
  await goto('html/data.html');
  if (!await page.getByRole('button', { name:'JSONを書き出す' }).isVisible()) throw new Error('backup export button missing');
  if (!await page.locator('#data-import-file').isVisible()) throw new Error('backup import input missing');

  const badBackup = {
    schemaVersion:1,
    app:'AP Study Notes',
    build:'malformed-test',
    exportedAt:new Date().toISOString(),
    storage:{ 'ap-study-lesson-progress-v1':'{broken-json' }
  };
  await page.locator('#data-import-file').setInputFiles({ name:'bad-backup.json', mimeType:'application/json', buffer:Buffer.from(JSON.stringify(badBackup)) });
  await page.waitForFunction(() => document.querySelector('#data-import-preview')?.textContent?.includes('読み込み失敗'));
  if (!(await page.locator('#data-import').isDisabled())) throw new Error('malformed recognized storage must not enable restore');
  const importDiagnostic = await page.evaluate(async () => window.APDiagnostics.snapshot('after-bad-import'));
  if (!importDiagnostic.errors.some(item => item.code === 'DATA-IMPORT-VALIDATE')) throw new Error('bad import was not captured by diagnostics');

  const validBuildText = '<img src=x onerror=window.__backupXss=1>';
  const legacyBackup = {
    schemaVersion:1,
    app:'AP Study Notes',
    build:validBuildText,
    exportedAt:new Date().toISOString(),
    storage:{ 'ap-study-lesson-progress-v1':JSON.stringify({ 'IMPORT-TEST':{ latestAnswered:1,total:1,latestCorrect:1,updatedAt:Date.now() } }) }
  };
  await page.locator('#data-import-file').setInputFiles({ name:'legacy-valid-backup.json', mimeType:'application/json', buffer:Buffer.from(JSON.stringify(legacyBackup)) });
  await page.waitForFunction(() => !document.querySelector('#data-import')?.disabled);
  if (!(await page.locator('#data-import-preview').textContent())?.includes('旧AP Study Notes形式')) throw new Error('legacy backup compatibility was not surfaced');
  if (await page.locator('#data-import-preview img').count()) throw new Error('backup metadata rendered as HTML');
  if (await page.evaluate(() => Boolean(window.__backupXss))) throw new Error('backup preview executed imported HTML');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#data-import').click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('ap-study-lesson-progress-v1') || '{}')['IMPORT-TEST']);
  const imported = await page.evaluate(() => JSON.parse(localStorage.getItem('ap-study-lesson-progress-v1') || '{}')['IMPORT-TEST']?.latestCorrect);
  if (imported !== 1) throw new Error('validated legacy backup restore failed');
  const restoreDiagnostic = await page.evaluate(async () => window.APDiagnostics.snapshot('after-restore'));
  if (!restoreDiagnostic.breadcrumbs.some(item => item.action === 'backup.restore' && item.detail?.status === 'success' && item.detail?.legacyApp === true)) throw new Error('successful legacy restore was not captured by diagnostics');

  await goto('html/diagnostics.html');
  await page.waitForFunction(expected => document.querySelector('#diagnostics-build')?.textContent === expected, projectMeta.build);
  if (!await page.getByRole('button', { name:'診断JSONを書き出す' }).isVisible()) throw new Error('diagnostics export button missing');
  if (!(await page.locator('#diagnostics-errors').textContent())?.includes('DATA-IMPORT-VALIDATE')) throw new Error('diagnostics view does not render captured import error');
  if (!(await page.locator('#diagnostics-network').textContent())?.includes('/diagnostic-e2e')) throw new Error('diagnostics view does not render sanitized network record');

  await goto('404.html');
  if (!await page.getByRole('heading', { name:'ページが見つかりません。' }).isVisible()) throw new Error('404 recovery page missing');
  if ((await page.getByRole('link', { name:'ホームへ戻る' }).getAttribute('href')) !== '/ap-study-guide/') throw new Error('404 home recovery path mismatch');

  if (errors.length) throw new Error(`browser console errors:\n${errors.join('\n')}`);
  console.log(`[e2e] OK: ${projectMeta.build}, ${expectedUnitCount} runtime units, cross-search, Foundation Phase 1 pilot learning map/inline checks, all-current-Lesson direct Practice coverage, friendly visual contract, diagnostics, mobile overflow, legacy backup compatibility, safe restore`);
} finally {
  await browser.close();
}
