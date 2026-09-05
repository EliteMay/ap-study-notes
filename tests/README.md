# AP Study Guide tests

CIは **Data整合・LEARNING Contract・Migration・Runtime構造・保存安全性・Development Diagnostics・主要Browser操作・Visual Review** を検証します。

Build / Guide Version / Project Profileの正本は `json/project-meta.json` です。正式要件はRepository Root `REQUIREMENTS.md` です。

Project Profile: `STATIC + DATA + LEARNING + TOOL + PUBLIC-CONTENT`

## Validator一覧

### `validate.mjs`

既存Data / Manifest / ID /主要HTML参照などの基本整合を検証する。

### `validate-phase1-foundation.mjs`

Phase 1 Foundation Pilot専用。

対象: `FND-01`〜`FND-07`

検証:

- 旧Lesson ID / Unit ID / Indexed File Pathを維持
- `phase1Status: pilot`
- 重要度 / 頻出度
- APでの見られ方
- 前提 / 関連Lesson
- 関連用語
- 関連Practice
- 公開公式問題Refの実在確認
- 本文Depth
- よくある誤解
- 学習途中のInline Check
- 末尾3〜5問
- Practice側`lessonRefs`との双方向Mapping
- `json/migrations/lesson-phase1-r26.json` のIdentity Migration
- Home→横断検索
- Shared Navigation→横断検索
- Product Rename後も旧`AP Study Notes` BackupをImportできる互換Contract

収録済み公開公式問題へ直接MappingできないFoundation Lessonが残る間は、Validator自体がPilotをCompleteへ変えない。

### `validate-phase1-algorithm.mjs`

Phase 1 Algorithm / Programming Pilot専用。

対象: `ALG-01`〜`ALG-11` / `PROG-01`〜`PROG-04`

検証:

- 現行Algorithm / Programming Lesson集合とPhase 1 Overlayの1対1 Coverage
- 旧Lesson ID / Unit / File Path維持
- 重要度 / 頻出度 / APでの見られ方
- 前提 / 関連Lessonの実在
- 関連用語
- Direct Practiceの実在と双方向Mapping
- 公開公式問題Refの実在とLesson Mapping
- 本文Depth / よくある誤解 / 末尾確認問題
- 2つのInline Check
- `json/migrations/lesson-phase1-algorithm-r27.json` のIdentity Migration
- `json/curriculum/audits/algorithm-phase1-r27.json` のPilot / Pending Review
- `json/phase1/index.json` からのLazy Overlay Runtime

補助範囲Reviewや公開公式問題Mapping不足が残る間はUnit Complete扱いにしない。

### `validate-audits.mjs`

System / Management / Database / Networkの監査ID・移行先を検証。

### `validate-security-audit.mjs`

Security 501語のCross-domain再分類を検証。

### `validate-computer-systems.mjs`

CMP-01〜12と中分類3〜6を検証。

### `validate-curriculum-expansion.mjs`

現行Curriculum / Lesson Index / Generic Unit Hub / IPA中分類Coverage / `APLessonData` Loaderを検証する。

**13 Unit / 118 Lessonは現在のSnapshotであり固定仕様ではない。** 将来再編時はValidatorも現行Data Contractへ追従させる。

### `validate-practice.mjs`

Practice Manifestを正本に検証する。

主な項目:

- Current Unit / Middle Category Coverage
- Current Lesson集合へのDirect Practice Coverage
- Choice / Written Schema
- Coverage Bank
- Coverage用Choiceの`mockEligible:false`
- Manifest Loader / memoize
- Recent-result mastery
- Written Guard
- Lesson→Practice / Home / Navigation接続

### `validate-cases.mjs`

Case Data / Question / Model Answer /採点観点 / Written Guard / Navigationを検証。

### `validate-mock.mjs`

現行Mock ConfigとPractice Poolの整合、Timer / Answer / Flag / Session復帰 / Self Gradeを検証する。

Coverage追加Choiceを意図せずMock Poolへ混ぜない。

### `validate-official-past.mjs`

- Current Exam Year / CBT
- 2026実問題非公開Contract
- 収録済み公開公式問題
- Lesson Mapping
- IPA公式URL
- Navigation

### `validate-past-lesson-map.mjs`

Legacy Security過去問とLesson Mappingを検証。

### `validate-progress.mjs`

Lesson / Practice / Case件数を各Manifest / Indexから集計し、Progress表示へ接続する。旧固定件数へ依存しない。

### `validate-runtime-quality.mjs`

最新版Guideと現行Project Metadataを前提に、再発コストが高いRuntime ContractをRegression Guardする。

主な検証:

- `AP Study Guide`
- Guide 1.17.0
- `STATIC + DATA + LEARNING + TOOL + PUBLIC-CONTENT`
- Phase 1 `in-progress`
- Central Loader
- Current Mastery / Review Due / Written Guard
- Generic Unit Hub
- Action-first Home
- 横断検索
- Phase 1 Lazy Overlay Runtime
- Dynamic Count
- Backup Key別Validation / Rollback
- Accessible Mobile Drawer
- Local Diagnostics / Privacy
- PUBLIC-CONTENT Metadata / 404 Recovery

### `validate-glossary.mjs`

統合Glossary、旧6Manifest、Lazy Detail、Bookmark / Checked、Pagination、Navigationを検証する。

## Browser Smoke

### `tests/e2e-smoke.mjs`

Playwright Chromiumで現行Product全体の主要Browser操作を確認する。

主な検証:

1. Product Metadata / Guide 1.17.0 / LEARNING Profile / Phase 1
2. Home Unit数をCurriculum Dataから取得して描画数と比較
3. Homeの主要9 Actionと横断検索Launcher
4. Home Finderの未知QueryをCross Searchへ送る
5. Diagnostics Error / Network / Breadcrumb / Query Sanitization
6. Cross Search Lesson / Term / Practice
7. Glossary検索 / Lazy Detail
8. Generic Unit Hub
9. Current Lesson集合すべてのDirect Practice Coverage
10. Lesson→Practice実遷移
11. Foundation Learning Map / Metadata / Inline Check
12. Written Practice / Case Guard
13. 320px主要Route横Overflow
14. Mobile Drawer `inert` / Escape
15. 壊れたBackup拒否 / 旧Backup互換 / XSS防止
16. Diagnostics / 404 Recovery
17. Browser Console / Page Errorなし

### `tests/e2e-phase1-algorithm.mjs`

Algorithm / Programming Phase 1のBrowser専用Regression。

- `ALG-01` の重要度 / 頻出度 / Pilot Chip
- Learning Map / 前提Lesson / Direct Practice
- Overlay Inline Checkの実操作
- `ALG-10` の2025春公開問題Mapping
- `PROG-03` のOverlay Metadata / Practice
- Cross Searchから`ALG-10`へ到達
- 320pxで`ALG-10` / `PROG-03`に横Overflowなし
- Browser Console / Page Errorなし

## Visual Review

`tests/visual-review.mjs`

Desktop 1280pxとMobile 390pxで主要RouteをScreenshot化する。

Phase 1で重要な対象:

- `html/lesson.html?id=FND-02`
- `html/lesson.html?id=ALG-01`
- `html/search.html?q=FND-02`
- `html/search.html?q=OAuth`

Visual Review Scriptは、Screenshot保存に加えて次を機械確認する。

- 横Overflowなし
- Suspiciously Emptyでない
- Mobileで非FocusのSkip Linkが露出しない
- Console / Page Errorなし

Screenshot生成だけでVisual Reviewedとは扱わず、最終Artifactを実際に確認する。

## Backup Compatibility Policy

Product名変更だけではStorage Keyを変更しない。

- 新規Export App名: `AP Study Guide`
- Import受理: `AP Study Guide` / `AP Study Notes`
- 既存localStorage Key: 維持
- Backup Schema Version: 現行Metadataに従う

Schema自体を変更する場合は別Migrationを用意する。

## GitHub Actions

`.github/workflows/validate.yml`

主な順序:

1. JavaScript Syntax
2. Basic JSON / References
3. Phase 1 Foundation Pilot
4. Phase 1 Algorithm / Programming Pilot
5. Domain Audits
6. Curriculum / Practice / Case / Mock / Official / Progress
7. Runtime Quality / Glossary
8. Playwright Chromium Install
9. Product Browser Smoke
10. Algorithm Phase 1 Browser Smoke
11. Visual Review
12. Screenshot Artifact Upload

## CIで完全には保証しないもの

- 全Lesson全Sectionの教育品質
- 全確認問題の全選択肢
- 全Practice / CaseのUser操作・回答品質
- Mockの実時間経過
- Dark Mode全画面
- Legacy互換Page全表示
- すべての外部IPA Link
- Firefox実ブラウザ総合Smoke
- 長時間Performance
- 実利用者によるUser Validation

Direct Practice Coverageは参照整合を保証するもので、全問題の難易度・本番類似度を保証しない。

## Verification State

作業報告では次を区別する。

- Implemented
- Static Validated
- Browser Validated
- Visual Reviewed
- GitHub Pages Validated
- User Validated
- Known Limitation
- Not Verified
