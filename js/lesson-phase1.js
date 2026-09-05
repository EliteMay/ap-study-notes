(() => {
  'use strict';

  const PHASE1_INDEX_PATH = 'json/phase1/index.json';
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const LEVEL_LABELS = {
    high:'高', medium:'中', low:'低',
    veryHigh:'非常に高い', veryLow:'非常に低い'
  };
  let phase1IndexPromise = null;
  const phase1Payloads = new Map();

  function requestedLessonId() {
    return (new URLSearchParams(location.search).get('id') || '').trim().toUpperCase();
  }

  async function fetchJson(path) {
    const response = await fetch(`../${path}`);
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }

  async function loadCurrentLesson() {
    const id = requestedLessonId();
    if (!id || !window.APLessonData?.load) return null;
    const { lessons } = await window.APLessonData.load('../');
    const entry = lessons.find(item => String(item.id).toUpperCase() === id);
    if (!entry) return null;
    const lesson = await fetchJson(entry.file);
    return { entry, lesson, lessons };
  }

  async function loadPhase1Index() {
    if (!phase1IndexPromise) {
      phase1IndexPromise = fetchJson(PHASE1_INDEX_PATH).catch(() => ({ units:[] }));
    }
    return phase1IndexPromise;
  }

  async function loadPhase1Overlay(entry) {
    const index = await loadPhase1Index();
    const unitRef = (index.units || []).find(item => item.unitId === entry.unitId);
    if (!unitRef?.file) return null;
    if (!phase1Payloads.has(unitRef.file)) phase1Payloads.set(unitRef.file, fetchJson(unitRef.file));
    const payload = await phase1Payloads.get(unitRef.file);
    const row = (payload.lessons || []).find(item => item.id === entry.id);
    if (!row) return null;
    return { ...row, phase1Status:row.phase1Status || payload.meta?.phase1Status || unitRef.status || '' };
  }

  function applyPhase1Overlay(lesson, overlay) {
    if (!overlay) return lesson;
    const fields = [
      'importance','frequency','examFocus','prerequisiteLessons','relatedLessons',
      'relatedTerms','relatedPracticeRefs','officialProblemRefs','phase1Status'
    ];
    lesson.meta = { ...(lesson.meta || {}) };
    for (const field of fields) {
      if (Object.prototype.hasOwnProperty.call(overlay, field)) lesson.meta[field] = overlay[field];
    }
    if (Array.isArray(overlay.inlineChecks)) lesson.inlineChecks = overlay.inlineChecks;
    return lesson;
  }

  function waitForRenderedLesson(timeout = 5000) {
    return new Promise(resolve => {
      const ready = () => document.querySelector('#lesson-sections .lesson-block');
      if (ready()) { resolve(true); return; }
      const observer = new MutationObserver(() => {
        if (!ready()) return;
        observer.disconnect();
        resolve(true);
      });
      const root = document.getElementById('lesson-sections');
      if (!root) { resolve(false); return; }
      observer.observe(root, { childList:true, subtree:true });
      setTimeout(() => { observer.disconnect(); resolve(Boolean(ready())); }, timeout);
    });
  }

  function addMetaChips(lesson) {
    const row = document.querySelector('.lesson-meta-row');
    if (!row) return;
    const meta = lesson.meta || {};
    const chips = [];
    if (meta.importance) chips.push(`重要度 ${LEVEL_LABELS[meta.importance] || meta.importance}`);
    if (meta.frequency) chips.push(`頻出度 ${LEVEL_LABELS[meta.frequency] || meta.frequency}`);
    if (meta.phase1Status === 'pilot') chips.push('Phase 1 再編中');
    for (const text of chips) {
      if ([...row.children].some(node => node.textContent === text)) continue;
      const span = document.createElement('span');
      span.className = 'lesson-phase1-chip';
      span.textContent = text;
      row.appendChild(span);
    }
  }

  function lessonLink(id, lessons) {
    const found = lessons.find(item => item.id === id);
    const label = found ? `${id} ${found.title}` : id;
    return `<a href="lesson.html?id=${encodeURIComponent(id)}">${escapeHtml(label)}</a>`;
  }

  function renderConnections(lesson, lessons) {
    const meta = lesson.meta || {};
    const prerequisites = Array.isArray(meta.prerequisiteLessons) ? meta.prerequisiteLessons : [];
    const related = Array.isArray(meta.relatedLessons) ? meta.relatedLessons : [];
    const terms = Array.isArray(meta.relatedTerms) ? meta.relatedTerms : [];
    const practice = Array.isArray(meta.relatedPracticeRefs) ? meta.relatedPracticeRefs : [];
    const official = Array.isArray(meta.officialProblemRefs) ? meta.officialProblemRefs : [];
    const focus = String(meta.examFocus || '').trim();
    if (!prerequisites.length && !related.length && !terms.length && !practice.length && !official.length && !focus) return '';

    const groups = [];
    if (focus) groups.push(`<div class="lesson-connection-group"><strong>APでの見られ方</strong><p>${escapeHtml(focus)}</p></div>`);
    if (prerequisites.length) groups.push(`<div class="lesson-connection-group"><strong>先に分かると楽</strong><div class="lesson-link-list">${prerequisites.map(id => lessonLink(id, lessons)).join('')}</div></div>`);
    if (related.length) groups.push(`<div class="lesson-connection-group"><strong>次につながるLesson</strong><div class="lesson-link-list">${related.map(id => lessonLink(id, lessons)).join('')}</div></div>`);
    if (terms.length) groups.push(`<div class="lesson-connection-group"><strong>関連用語</strong><div class="lesson-link-list">${terms.map(term => {
      const label = typeof term === 'string' ? term : term.label;
      const query = typeof term === 'string' ? term : (term.query || term.label);
      return `<a href="search.html?q=${encodeURIComponent(query || label)}">${escapeHtml(label)}</a>`;
    }).join('')}</div></div>`);
    if (practice.length) groups.push(`<div class="lesson-connection-group"><strong>直接つながる短問</strong><div class="lesson-link-list">${practice.map(ref => `<a href="practice.html?question=${encodeURIComponent(ref)}&unit=${encodeURIComponent(meta.unitId || '')}">${escapeHtml(ref)}</a>`).join('')}</div></div>`);
    if (official.length) groups.push(`<div class="lesson-connection-group"><strong>関連する公開公式問題</strong><div class="lesson-link-list">${official.map(ref => `<a href="official-past.html">${escapeHtml(ref.label || `${ref.examId} 問${ref.question}`)}</a>`).join('')}</div></div>`);

    return `<section class="lesson-block lesson-connections"><div class="lesson-connection-heading"><div><p class="lesson-phase1-kicker">LEARNING MAP</p><h2>このLessonの位置づけ</h2></div><a href="search.html?q=${encodeURIComponent(meta.id || '')}">関連項目を検索</a></div><div class="lesson-connection-grid">${groups.join('')}</div></section>`;
  }

  function inlineCheckHtml(check, index) {
    return `<section class="lesson-inline-check" data-inline-check="${escapeHtml(check.id || `inline-${index}`)}"><div class="lesson-inline-head"><div><span>途中確認</span><strong>${escapeHtml(check.prompt || '')}</strong></div><small>学習途中の確認なので進捗には記録しません</small></div><div class="lesson-inline-options">${(check.options || []).map((option, optionIndex) => `<button type="button" data-inline-option="${optionIndex}">${escapeHtml(option)}</button>`).join('')}</div><div class="lesson-inline-feedback" hidden aria-live="polite"></div></section>`;
  }

  function insertInlineChecks(lesson) {
    const checks = Array.isArray(lesson.inlineChecks) ? lesson.inlineChecks : [];
    if (!checks.length) return;
    const root = document.getElementById('lesson-sections');
    if (!root) return;
    const contentBlocks = [...root.children].filter(node => node.classList.contains('lesson-block') && !node.classList.contains('next-lesson-block') && !node.classList.contains('lesson-connections'));
    checks.forEach((check, index) => {
      const targetIndex = Math.max(0, Number(check.afterSection || 1) - 1);
      const target = contentBlocks[targetIndex] || contentBlocks[contentBlocks.length - 1];
      if (!target) return;
      target.insertAdjacentHTML('afterend', inlineCheckHtml(check, index));
      const node = target.nextElementSibling;
      if (!node?.matches('.lesson-inline-check')) return;
      node.querySelectorAll('[data-inline-option]').forEach(button => button.addEventListener('click', () => {
        if (node.dataset.answered === 'true') return;
        node.dataset.answered = 'true';
        const selected = Number(button.dataset.inlineOption);
        const answer = Number(check.answerIndex);
        const correct = selected === answer;
        node.querySelectorAll('[data-inline-option]').forEach(option => {
          option.disabled = true;
          if (Number(option.dataset.inlineOption) === answer) option.classList.add('correct');
        });
        if (!correct) button.classList.add('wrong');
        const feedback = node.querySelector('.lesson-inline-feedback');
        feedback.hidden = false;
        feedback.className = `lesson-inline-feedback ${correct ? 'correct' : 'wrong'}`;
        feedback.innerHTML = `<strong>${correct ? '正解' : 'もう一度確認'}</strong><p>${escapeHtml(check.explanation || '')}</p>`;
      }));
    });
  }

  async function init() {
    try {
      const loaded = await loadCurrentLesson();
      if (!loaded) return;
      const { entry, lessons } = loaded;
      const overlay = await loadPhase1Overlay(entry);
      const lesson = applyPhase1Overlay(loaded.lesson, overlay);
      const rendered = await waitForRenderedLesson();
      if (!rendered) return;
      document.title = `${lesson.meta?.title || '学習教材'} | AP Study Guide`;
      addMetaChips(lesson);
      const connections = renderConnections(lesson, lessons);
      if (connections && !document.querySelector('.lesson-connections')) document.getElementById('lesson-sections')?.insertAdjacentHTML('afterbegin', connections);
      insertInlineChecks(lesson);
    } catch (error) {
      console.error('[lesson-phase1] enhancement failed', error);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
