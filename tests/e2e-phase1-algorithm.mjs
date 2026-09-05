import { chromium } from 'playwright';

const base = process.env.AP_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless:true });
const page = await browser.newPage({ viewport:{ width:1280, height:900 } });
const errors = [];
page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
page.on('console', msg => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });

async function goto(path) {
  await page.goto(`${base}/${path}`, { waitUntil:'networkidle' });
}
async function noOverflow(label) {
  const width = await page.evaluate(() => ({ client:document.documentElement.clientWidth, scroll:document.documentElement.scrollWidth }));
  if (width.scroll > width.client + 1) throw new Error(`${label}: horizontal overflow ${width.scroll} > ${width.client}`);
}

try {
  const phaseIndex = await (await fetch(`${base}/json/phase1/index.json`)).json();
  const algorithmRef = (phaseIndex.units || []).find(item => item.unitId === 'algorithm-programming');
  if (!algorithmRef || algorithmRef.status !== 'pilot') throw new Error('Algorithm Phase 1 manifest missing');
  const phaseData = await (await fetch(`${base}/${algorithmRef.file}`)).json();
  const alg01 = (phaseData.lessons || []).find(item => item.id === 'ALG-01');
  if (!alg01 || alg01.inlineChecks?.length !== 2) throw new Error('ALG-01 Phase 1 data missing');

  await goto('html/lesson.html?id=ALG-01');
  await page.waitForSelector('.lesson-connections');
  await page.waitForFunction(() => document.querySelectorAll('.lesson-inline-check').length === 2);
  const metaText = await page.locator('.lesson-meta-row').textContent();
  for (const expected of ['重要度 高','頻出度 高','Phase 1 再編中']) {
    if (!metaText?.includes(expected)) throw new Error(`ALG-01 metadata chip missing: ${expected}`);
  }
  const mapText = await page.locator('.lesson-connections').textContent();
  for (const expected of ['APでの見られ方','FND-01','PC-ALG-01','このLessonの位置づけ']) {
    if (!mapText?.includes(expected)) throw new Error(`ALG-01 learning map missing: ${expected}`);
  }
  const firstInline = page.locator('.lesson-inline-check').first();
  await firstInline.locator(`[data-inline-option="${alg01.inlineChecks[0].answerIndex}"]`).click();
  if (!await firstInline.locator('.lesson-inline-feedback:not([hidden])').isVisible()) throw new Error('ALG-01 inline feedback did not render');
  const mapPractice = page.locator('.lesson-connections a[href="practice.html?question=PC-ALG-01&unit=algorithm-programming"]');
  if (!await mapPractice.isVisible()) throw new Error('ALG-01 learning-map direct practice link missing');

  await goto('html/lesson.html?id=ALG-10');
  await page.waitForSelector('.lesson-connections');
  await page.waitForFunction(() => document.querySelectorAll('.lesson-inline-check').length === 2);
  const alg10Map = await page.locator('.lesson-connections').textContent();
  if (!alg10Map?.includes('2025春 午後 問3')) throw new Error('ALG-10 published-official mapping missing from learning map');

  await goto('html/lesson.html?id=PROG-03');
  await page.waitForSelector('.lesson-connections');
  await page.waitForFunction(() => document.querySelectorAll('.lesson-inline-check').length === 2);
  const progMeta = await page.locator('.lesson-meta-row').textContent();
  if (!progMeta?.includes('重要度 中') || !progMeta?.includes('頻出度 中')) throw new Error('PROG-03 Phase 1 metadata missing');
  if (!(await page.locator('.lesson-connections').textContent())?.includes('PC-PROG-03')) throw new Error('PROG-03 practice mapping missing');

  await goto('html/search.html?q=ALG-10');
  await page.waitForFunction(() => [...document.querySelectorAll('.search-result code')].some(node => node.textContent === 'ALG-10'));
  if (!await page.locator('.search-result').filter({ hasText:'グラフ探索と最短経路' }).first().isVisible()) throw new Error('cross-search cannot reach ALG-10');

  await page.setViewportSize({ width:320, height:700 });
  await goto('html/lesson.html?id=ALG-10');
  await page.waitForSelector('.lesson-inline-check');
  await noOverflow('ALG-10 320px');
  await goto('html/lesson.html?id=PROG-03');
  await page.waitForSelector('.lesson-inline-check');
  await noOverflow('PROG-03 320px');

  if (errors.length) throw new Error(`browser console errors:\n${errors.join('\n')}`);
  console.log(`[e2e-phase1-algorithm] OK: ${phaseData.lessons.length} Algorithm/Programming Phase 1 overlays, learning map, inline checks, official/practice links, search reachability and 320px layout.`);
} finally {
  await browser.close();
}
