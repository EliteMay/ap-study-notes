# PROJECT LEARNINGS

このファイルは、AP Study Guideで発生した再発防止価値の高い失敗と、今後も再利用したい成功パターンを長期的に残す正本です。

`docs/作業報告書.md` は「今回何を変更したか」、このファイルは「このProjectから何を学んだか」を記録します。

## Failure

### PL-F-001 Backup ImportはTop-level確認だけでは安全にならない

- Date: 2026-08-30
- Status: resolved
- Severity: high
- Cost: high
- Symptom: 認識済みStorage Keyに壊れたJSONが含まれていても、Import開始後に現在データを上書きできる余地があった。
- Expected: 全payloadを検証し、現在データを保護してから置換する。
- Actual: Top-level形式の確認だけではKeyごとの破損を止められず、途中失敗時のRollbackも弱かった。
- Trigger / Reproduction: Backup JSONへ壊れた認識済みStorage JSONを入れてRestoreする。
- Root Cause: Import Pipelineを「parseできるか」中心に考え、KeyごとのSchema・Backup・Rollbackを一体で設計していなかった。
- Final Fix: KeyごとのValidation、Restore直前Backup、Memory退避、途中失敗時Rollback、安全なPreviewを実装した。
- Affected files / systems: `js/data-tools.js`, `html/data.html`, Backup / Restore
- Detection method: Guide監査 + Browser Smoke
- Regression Guard: malformed Backup拒否、HTML文字列非実行、Validated RestoreをPlaywrightで確認。
- Prevention: `parse → 全体Validation → 現在Backup → replace → verify → rollback` を破壊的Importの標準順序にする。
- Related Issue / PR / Commit: r18
- Guide candidate: yes
- Guide note: `web-project-guide` 1.2系のImport / Rollback強化へ対応済み。

### PL-F-002 教材件数Coverageと学習導線Coverageは別に検証する

- Date: 2026-08-30
- Status: resolved
- Severity: medium
- Cost: high
- Symptom: 118 Lessonが存在していても、短問から直接参照されるLessonは70/118に留まり、一部Lesson末尾の演習導線が弱かった。
- Expected: 各Lessonから関連短問へ直接進める。
- Actual: Unitや中分類Coverageは満たしていたため、Lesson単位の参照Gapを見落としていた。
- Trigger / Reproduction: Practice Manifestの全`lessonRefs`とLesson Indexを集合比較する。
- Root Cause: Coverage指標がUnit / 中分類中心で、Lesson単位の直接参照をContract化していなかった。
- Final Fix: 不足48 Lessonを機械抽出し、1 Lesson = 1問のCoverage Bankを追加して118/118にした。
- Affected files / systems: Practice Manifest / Lesson Practice / Mock Pool
- Detection method: ValidatorでLesson集合差分を算出。
- Regression Guard: `validate-practice.mjs`で現行Lesson集合の100%直接Coverageを必須化し、Playwrightで直接遷移を確認。
- Prevention: 「Dataが存在する」と「利用導線から到達できる」を別Contractとして検証する。固定件数ではなく現行Index集合を正本にする。
- Related Issue / PR / Commit: r20
- Guide candidate: yes
- Guide note: Coverage / Oracle設計のProject Evidenceとして再利用可能。

### PL-F-003 Static CI成功だけでは最終状態を保証しない

- Date: 2026-08-30
- Status: resolved
- Severity: medium
- Cost: medium
- Symptom: Data変更後に旧Browser Smokeが「未対応Lessonが存在すること」を前提として失敗した。
- Expected: 最終仕様のLesson CoverageをBrowser Smokeも検証する。
- Actual: Static Validatorは新仕様へ追従したが、E2Eの古い前提が残った。
- Trigger / Reproduction: Lesson Coverage変更後のPlaywright実行。
- Root Cause: 実装・Static Contract・Browser Oracleを同時に更新していなかった。
- Final Fix: E2Eを「現行Lesson集合の全件直接Coverage + 実遷移」へ更新し、最終HEADで再検証した。
- Affected files / systems: `tests/e2e-smoke.mjs`
- Detection method: GitHub Actions Browser Smoke
- Regression Guard: Final-state CI / Pages確認を完成条件へ明記。
- Prevention: 仕様変更時はValidatorだけでなくBrowser Oracleの前提も確認する。
- Related Issue / PR / Commit: r20
- Guide candidate: yes
- Guide note: Final-state Validation / Oracle-driven Testの具体例。

### PL-F-004 AI Template感を消すために親しみやすさまで削らない

- Date: 2026-09-01
- Status: resolved
- Severity: medium
- Cost: medium
- Symptom: r22でCard / Teal / Emoji /柔らかいSurfaceを大きく削り、Technical Console方向へ寄せた結果、ユーザー評価が旧r21の40点から30点へ低下した。
- Expected: 元の分かりやすさを保ちながらVisual品質を上げる。
- Actual: 「AI Template Lookを避ける」を強く解釈しすぎ、クリック対象の分かりやすさ・学習サイトらしい親しみやすさ・色のIdentityまで弱くした。
- Trigger / Reproduction: r22 Home / LessonのScreenshotをr21の方向性と比較し、ユーザーから明確な低評価Feedbackを受ける。
- Root Cause: Anti-pattern除去を目的化し、Project固有のAudience / Task /既存の良さより「Cardを減らす」「硬いConsoleへ寄せる」を優先した。
- Final Fix: r23でTeal Hero、明確なAction Card、柔らかいToday、Teal current stateを復活。元のままRollbackせず、Hero高さ・Shadow・Radius・Spacingだけ整理した。
- Affected files / systems: `css/shell.css`, `css/home.css`, `css/home-launch.css`, Home / Lesson Visual System
- Detection method: User feedback + CI Screenshot Visual Review
- Regression Guard: `project-meta.visual.direction = friendly-study-dashboard`、PlaywrightでTeal Gradient / 14px Action Card / Shadow / 224px Sidebar / 12px Lesson Surfaceを確認。
- Prevention: Visual改善では「削ること」ではなく、元UIでユーザーが価値を感じていた要素を先に列挙し、それを壊さずにHierarchy / Spacing / Consistencyを改善する。
- Related Issue / PR / Commit: PR #5 / r23
- Guide candidate: yes
- Guide note: Anti-Pattern回避はPattern自体の禁止ではなく、Projectとの理由を確認するためのものとして扱う。

### PL-F-005 機能SmokeだけでDynamic PageのVisual完成を判定しない

- Date: 2026-09-03
- Status: resolved
- Severity: medium
- Cost: medium
- Symptom: Generic Unit HubはLesson LinkやGlossary導線のE2Eが成功していたが、実画面ではLessonがブラウザ標準の下線Linkとして縦に並び、`未着手中分類2`や英語Content Typeが露出した未完成UIだった。
- Expected: Unit Hubが学習順・進捗・状態を視覚的に理解できる専用UIとして表示される。
- Actual: Runtimeは`.unit-card`を生成していたが、r24でCard StyleがHome専用`.home-unit-compact .unit-card`へ限定され、Unit HubではStyleが適用されなかった。
- Trigger / Reproduction: `html/unit.html?unit=algorithm-programming` を実ブラウザで開き、ユーザー提供Screenshotと比較する。
- Root Cause: Function Smokeが「Linkが存在し遷移できる」までしか確認せず、Visual Screenshot対象もHome / Lesson中心だった。Shared Component名だけ残り、Style ownershipがHomeへ移ったことを検出できなかった。
- Final Fix: Unit HubをHome CSSから分離し、`css/unit.css`でHero / Summary / Progress / Lesson Path / State / Responsiveを所有。Content Typeを日本語表示へ整理し、共通Skip LinkのMobile露出も修正した。
- Affected files / systems: `html/unit.html`, `js/unit.js`, `css/unit.css`, `css/shell.css`, Visual Review workflow
- Detection method: User Screenshot + Primary-page Screenshot Audit
- Regression Guard: Runtime ValidatorでUnit HubがHome CSSへ依存しないことを確認し、`tests/visual-review.mjs`で主要RouteをDesktop / Mobile両方Screenshot化。Mobileでは非Focus時Skip LinkがViewport内へ露出しないことも自動確認する。
- Prevention: Dynamic PageはDOM/Linkの存在だけで完成判定せず、主要Routeごとに最終描画Screenshotを持つ。Shared-looking class名を別Pageで使う場合は、Style ownershipも同じScopeに存在することを確認する。
- Related Issue / PR / Commit: PR #7 / r25
- Guide candidate: yes
- Guide note: Visual Quality Baselineの「Static / Function TestだけでVisual完成扱いしない」の具体例。

### PL-F-006 要件変更時にTest Oracleの旧仕様固定を残さない

- Date: 2026-09-05
- Status: resolved
- Severity: high
- Cost: medium
- Symptom: `REQUIREMENTS.md` ではProduct名・Guide 1.16.0・LEARNING Profile・13 Unit / 118 Lesson非固定が確定していたのに、Runtime ValidatorとE2Eは `AP Study Notes` / Guide 1.11.0 / 13 Unit / 8 Actionを正解として固定していた。
- Expected: Source of Truthの変更と同じChange Setで、実装・Metadata・Migration・Static Validator・Browser Oracleが同じContractを見る。
- Actual: 要件だけ更新され、古いValidatorが旧状態を「正解」として強制する状態が残っていた。
- Trigger / Reproduction: Phase 1着手時に`REQUIREMENTS.md`と`json/project-meta.json`、`tests/validate-runtime-quality.mjs`、`tests/e2e-smoke.mjs`を突き合わせる。
- Root Cause: Validatorを安全網として扱う一方、Validator自身が重複Source of Truthになっている箇所を更新対象として明示していなかった。
- Final Fix: Project metadataを要件へ合わせ、Phase 1専用Validatorを追加。E2EのUnit数はCurriculum Dataから取得し、Product名 / Guide / Profile / Search / Migration / Legacy Backup互換を同じChange Setで検証するよう更新した。
- Affected files / systems: `json/project-meta.json`, `tests/validate-runtime-quality.mjs`, `tests/validate-phase1-foundation.mjs`, `tests/e2e-smoke.mjs`, `.github/workflows/validate.yml`
- Detection method: Requirements-vs-Oracle audit before implementation
- Regression Guard: Unit / Lesson件数を固定値で新規Assertしない。仕様変更時はStatic / Browser / Visual Oracleを同時確認する。
- Prevention: 「要件→実装」だけでなく「要件→実装→Migration→Validator→E2E→Visual Review」を1つの変更単位として扱う。
- Related Issue / PR / Commit: r26 Phase 1 Foundation Pilot
- Guide candidate: yes
- Guide note: Oracle自身のstaleness検出をRequirements変更Checklistへ含める候補。

---

## Success

### PL-S-001 Runtime件数とBuildをSource of Truthから算出する

- Date: 2026-08-30
- Goal / Problem: 教材追加のたびにHomeや説明文の固定件数が古くなる問題を防ぐ。
- Adopted Pattern: Buildは`json/project-meta.json`、教材件数は各Manifest / Indexを正本とし、Runtime表示はDataから算出する。
- Why it worked: 教材追加と表示更新を別作業にせず、ValidatorでもMagic Countの再混入を検出できる。
- Trade-off: 初期表示にLoading Stateが必要になる。
- Reuse when: JSON / Manifestを持つDATA / LEARNING Profileのサイト。
- Avoid when: 完全固定の1Page説明サイトでRuntime Dataが存在しない場合。
- Related files / tests: `json/project-meta.json`, `js/home.js`, `tests/validate-runtime-quality.mjs`
- Guide candidate: yes
- Guide note: Single Source of Truth / Magic Count防止の成功例。

### PL-S-002 Legacy互換層と通常導線を分離する

- Date: 2026-08-30
- Goal / Problem: 旧6分野ページのID・保存互換を維持しながら、通常学習導線を統合したい。
- Adopted Pattern: Legacy PageはCompatibility Layerとして残し、通常入口はGeneric Unit Hub / Unified Glossaryへ集約した。
- Why it worked: 既存URL・localStorage互換を壊さず、新しいNavigationを単純化できた。
- Trade-off: Repository内に旧DOM構造が残るため保守対象は完全には減らない。
- Reuse when: 古いURL / Storage互換を守りながらUIを再構成するとき。
- Avoid when: 互換要件がなく、旧Runtimeを安全に削除できる場合。
- Related files / tests: `js/shell.js`, `html/unit.html`, `html/glossary.html`, Runtime Quality Validator
- Guide candidate: yes
- Guide note: Compatibility Layerの成功例。

### PL-S-003 Product名変更と学習Data移行を分離する

- Date: 2026-09-05
- Goal / Problem: `AP Study Notes` から `AP Study Guide` へ名称を更新しつつ、既存学習履歴と旧Backupを壊さない。
- Adopted Pattern: UI / Metadata / 新規BackupのApp名だけを新名称へ更新し、localStorage Keyは維持。Importは新旧両方のBackup App名を受理する。
- Why it worked: 表示名称の変更をData Schema変更へ拡大せず、既存利用者の保存Dataと旧Backupをそのまま利用できる。
- Trade-off: Import側には旧名称Aliasを互換Contractとして残す必要がある。
- Reuse when: Product renameだけで保存構造の意味が変わらないとき。
- Avoid when: Data Schema自体を変更し、旧形式の変換が必要な場合。その場合は明示的Migrationを用意する。
- Related files / tests: `js/data-tools.js`, `json/migrations/lesson-phase1-r26.json`, `tests/e2e-smoke.mjs`
- Guide candidate: yes
- Guide note: RenameとSchema Migrationを不要に結合しない成功例。

### PL-S-004 既存教材が十分な場合は横断Contractを遅延Overlayする

- Date: 2026-09-06
- Goal / Problem: Algorithm / Programmingの15 Lessonは本文品質が既に高い一方、Phase 1共通Contractだけが不足していた。15個の大きなLesson JSONを一括書換えすると、本文差分・競合・重複Metadata・Migration Riskが不必要に増える。
- Adopted Pattern: `json/phase1/index.json` を小さなManifestにし、Unit単位の補助JSONへ importance / frequency / examFocus / 関連導線 / inlineChecks をまとめ、`js/lesson-phase1.js` が該当Lesson表示時だけ必要Unitを遅延読込してOverlayする。
- Why it worked: Lesson ID・本文・URL・Storageを触らずに横断的な学習Contractを追加でき、Foundationの埋込み方式とも同じRuntimeで共存できる。次Unitでも同じ仕組みを再利用できる。
- Trade-off: Base LessonとOverlayが2つのData Sourceになるため、1対1 Coverage・参照整合・MigrationをValidatorで強制する必要がある。Lesson Pageでは小さなPhase 1 Index Fetchが1回増える。
- Reuse when: 既存Lesson本文が十分で、複数Lessonへ同じ補助Metadata / UI Contractだけを追加したいとき。
- Avoid when: Lesson本文自体の再構成、ID merge / split、保存意味の変更が主目的の場合。その場合は正本SchemaとMigrationを直接更新する。
- Related files / tests: `json/phase1/index.json`, `json/phase1/algorithm-programming-r27.json`, `js/lesson-phase1.js`, `tests/validate-phase1-algorithm.mjs`, `tests/e2e-phase1-algorithm.mjs`
- Guide candidate: yes
- Guide note: 大規模既存教材へ横断Contractを追加する際のCompanion Data / Lazy Overlay Pattern候補。

---

## Guide Feedback Queue

| ID | Type | Summary | Evidence | Next action |
|---|---|---|---|---|
| PL-F-002 | failure | Coverageは分類単位と利用導線単位を分けて検証する | 70/118 → 現行Lesson全件へ直接Practice | 他の学習Projectでも同型事故があるか確認 |
| PL-F-004 | failure | AI Template回避でProject固有の親しみやすさまで削らない | r21 40点 → r22 30点 → r23で方向修正 | 他ProjectのVisual Reviewでも「残すべき既存価値」を先に確認 |
| PL-F-005 | failure | Dynamic Pageは機能SmokeだけでVisual完成判定しない | Unit HubのLinkは動作したがStyleがHome Scopeへ消失 | Primary RouteのDesktop / Mobile Screenshot監査を継続 |
| PL-F-006 | failure | Requirements変更時はTest Oracleのstale fixed valueも同時更新する | Product / Guide / Unit固定値が旧仕様を強制 | GuideのRequirements変更Checklist候補として検討 |
| PL-S-002 | success | Legacy互換層と通常導線の分離 | 旧URL維持 + Unified Hub | 複数Projectで再利用後に共通化判断 |
| PL-S-003 | success | Product RenameとStorage Migrationを不要に結合しない | 新名称 + 旧Backup互換 + Storage Key維持 | Rename案件のData互換Pattern候補 |
| PL-S-004 | success | 既存教材へ横断ContractをCompanion Dataとして遅延Overlayする | 15 Lesson本文を維持したままPhase 1 Contractを追加 | 次のPhase 1 Unitでも再利用し、共通Guide化の妥当性を確認 |
