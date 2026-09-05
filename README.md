# AP Study Guide

応用情報技術者試験（AP）を、**仕組みを理解する → 問題で取り出す → 弱点を復習する → 公開公式問題へ接続する**流れで学ぶ静的Webアプリです。

- Repository: `EliteMay/ap-study-guide`
- Public: `https://elitemay.github.io/ap-study-guide/`
- 要件のSource of Truth: `REQUIREMENTS.md`
- 制作Guide: `EliteMay/web-project-guide`
- Build / Project Profile正本: `json/project-meta.json`
- Project Memory: `PROJECT_LEARNINGS.md`
- 基準: IPA「応用情報技術者試験 シラバス Ver.7.2」
- 技術: HTML / CSS / JavaScript / JSON
- Deployment: GitHub Pages

## Project Profile

`STATIC + DATA + LEARNING + TOOL + PUBLIC-CONTENT`

このRepositoryでは、教材の分かりやすさ・学習導線・教材Dataの参照整合・保存互換・GitHub Pages相対Path・公開情報の扱いを重点確認します。

## 現在の開発Phase

`REQUIREMENTS.md` の順番を正本とし、現在は **Phase 1（進行中）** です。

1. **Phase 1** — 教材品質、Lesson / Unit再編、学習導線、関連問題、図解、横断検索、必要なUI改善
2. **Phase 2** — 5段階理解状態、適応型復習、弱点分析、診断テスト
3. **Phase 3** — 効果の高いLessonへのインタラクティブ教材・実践Tool

### Phase 1で現在入っているもの

- Lesson / Practice / Case / Mock / Official / Glossaryの既存Runtime
- Homeから学習・演習・管理へ進むLauncher
- `html/search.html` の横断検索
  - Lesson
  - 用語
  - 短問
  - 学習分野
  - 公開公式問題
- SearchはLesson / Unitを先に読み、用語・短問・公式問題は検索時に遅延読込
- 基礎理論 `FND-01`〜`FND-07` のPhase 1 Pilot
  - 重要度 / 頻出度
  - APでの見られ方
  - 前提 / 関連Lesson
  - 関連用語 / 関連短問 / 公開公式問題Mapping
  - 学習途中の小確認
- アルゴリズム・プログラミング `ALG-01`〜`ALG-11` / `PROG-01`〜`PROG-04` のPhase 1 Pilot
  - 既存本文・ID・URL・Storageを維持
  - 重要度 / 頻出度 / APでの見られ方
  - 前提 / 関連Lesson / 関連用語 / Practice / Official Mapping
  - Lesson途中の小確認を2問ずつ追加
  - Phase 1補助Dataは `json/phase1/` から必要Unitだけ遅延読込
  - 旧Algorithm Auditを再照合し、解消済み範囲と補助範囲Reviewを分離
- Foundation / Algorithmとも末尾確認問題による現行Progress判定は維持
- `json/migrations/lesson-phase1-r26.json` / `json/migrations/lesson-phase1-algorithm-r27.json` による旧ID / URL / Storage互換Contract

**現在のPhase 1 Pilotは完成扱いではありません。** Foundationは公開公式問題の直接Mapping不足、Algorithm / Programmingは補助範囲Reviewと公開公式問題の直接Mapping不足が残るため、どちらも `pilot / in-progress` を維持します。

## 学習の基本導線

**Home → Lessonで理解 → 途中確認 → 末尾確認 → 関連短問 → Case / Mock → 公開公式問題 → 弱点復習**

分からない項目は横断検索からLesson・用語・問題へ戻れます。

## 主なページ

| 用途 | Page |
|---|---|
| Home | `index.html` |
| 学習分野 | `html/roadmap.html` |
| Unit Hub | `html/unit.html?unit=<UNIT_ID>` |
| Lesson | `html/lesson.html?id=<LESSON_ID>` |
| 横断検索 | `html/search.html?q=<QUERY>` |
| 単語辞書 | `html/glossary.html` |
| 短問 | `html/practice.html` |
| 長文Case | `html/cases.html` |
| 模試 | `html/mock.html` |
| 公開公式問題 | `html/official-past.html` |
| 学習進捗 | `html/progress.html` |
| Backup / Restore | `html/data.html` |
| Development Diagnostics | `html/diagnostics.html` |

## 現在の教材Snapshot

件数のRuntime正本は各Manifest / Indexです。次の数字は**固定仕様ではなく現在状態のSnapshot**です。

| 項目 | 現在状態 |
|---|---:|
| IPA大分類 | 9 |
| IPA中分類 | 23 |
| 学習ユニット | 13 |
| 構造化Lesson | 118 |
| 短問 | 139 |
| Lesson→短問直接Coverage | 118 / 118 |
| 長文Case | 16 / 48設問 |
| 旧用語資産 | 1,422語 |
| 2025春・秋 公開午後問題Mapping | 22大問 |

`13 Unit / 118 Lesson` は要件上固定ではありません。Lesson / Unitをmerge・split・移動する場合は、旧ID・URL・学習進捗・Practice / Case / Mock / Official mappingを確認し、Migrationなしで既存Dataを破壊しません。

## Dataの正本

### Project metadata

`json/project-meta.json`

- Product名
- Build
- 採用Guide Version
- Project Profile
- Active Phase
- Deployment
- Backup Schema Version
- Diagnostics Contract

### Lesson

- `json/lessons/lesson-index.json`
- `json/lessons/lesson-index-expansion.json`
- Loader: `js/lesson-data.js`
- Phase 1補助Manifest: `json/phase1/index.json`
- Phase 1補助Runtime: `js/lesson-phase1.js`

Foundation Pilotは各Foundation Lesson JSONへPhase 1 Metadataを保持します。

Algorithm / Programming Pilotは既存15 Lesson本文を変更せず、`json/phase1/algorithm-programming-r27.json` からPhase 1補助Contractを遅延Overlayします。

### Practice

- Manifest: `json/practice/practice-index.json`
- Loader: `js/practice-data.js`

全Lessonに少なくとも1つの直接Practice参照を持つ現行Contractは維持します。

### Case / Mock / Official

- Case: `json/cases/case-index.json`
- Mock: `json/mock/mock-config.json`
- 公開公式問題: `json/past/ap-public-exams.json`

2026年度CBTの非公開実問題を公開問題として扱いません。

### Search

- Page: `html/search.html`
- Runtime: `js/search.js`
- Style: `css/search.css`

Home初期表示で全Terms / Practice / Official Dataを追加読込せず、検索時にだけ拡張Catalogを読みます。

### Migration

- Foundation Pilot: `json/migrations/lesson-phase1-r26.json`
- Algorithm / Programming Pilot: `json/migrations/lesson-phase1-algorithm-r27.json`

いずれも現時点ではIdentity Migrationです。Lesson ID・URL・Unit ID・既存学習Storage Keyを変更していません。将来merge / splitする場合は新しいMigration Contractを追加します。

## 学習状態 / 保存互換

判定の現行正本は `js/study-state.js` です。

- Lesson: 全確認問題回答 + 75%以上で理解確認
- 理解確認後: 現行Runtimeでは14日後に再確認対象
- 4択短問: 最近の結果を重視
- 記述短問: 最低文字数を満たしてから模範解答確認
- 長文Case: 回答後に自己採点
- 個人学習履歴: Browser `localStorage`
- Backup / Restore: `html/data.html`

Phase 2の5段階理解状態・適応型復習は、Phase 1完了前に現行保存Contractを破壊して先行実装しません。

## 崩してはいけない仕様

- `REQUIREMENTS.md` を正式要件のSource of Truthとする。
- 既存Lesson / Term / Question IDを不用意に変更・再利用・削除しない。
- 既存localStorage Keyを変更する場合はMigrationを用意する。
- Product名変更だけを理由にStorage Keyを変更しない。
- Lesson / Practice / Case / MockのRuntime正本を分岐させない。
- GitHub Pagesのサブパスで壊れない相対Pathを維持する。
- Import前Validationを外さない。
- Backup / Restoreで元Dataを先に破壊しない。
- 公式問題と独自問題を混同しない。
- 2026 CBT非公開実問題を公開問題として扱わない。
- `23/23` や `118/118` を試験対策の完全性と表現しない。
- 未完成のPhase 1分野を完成扱いしない。

## Validation

Workflow: `.github/workflows/validate.yml`

主な確認:

- JavaScript構文
- JSON / Manifest / ID / Reference
- Curriculum / Audit
- Lesson→Practice直接Coverage
- Case / Mock / Official mapping
- Runtime architecture
- Search wiring
- Project metadata / LEARNING Profile
- Phase 1 Foundation Pilot Contract
- Phase 1 Algorithm / Programming Pilot Contract
- Legacy ID / URL / Storage identity migration
- PUBLIC-CONTENT Metadata
- Playwright Browser Smoke
- Algorithm Phase 1 Browser Smoke
- Visual Review screenshot生成

Phase 1専用Validator:

- `tests/validate-phase1-foundation.mjs`
- `tests/validate-phase1-algorithm.mjs`
- `tests/e2e-phase1-algorithm.mjs`

## Documentation

- 正式要件: `REQUIREMENTS.md`
- 現行概要: `README.md`
- 現行仕様: `docs/仕様書.md`
- 作業履歴: `docs/作業報告書.md`
- 長期Project Memory: `PROJECT_LEARNINGS.md`
- Test説明: `tests/README.md`

## 完成の考え方

「コードを書いた」「Commitした」「Static CIが通った」だけでは完成扱いにしません。

分野単位で、教材・問題・検索・Migration・PC / Smartphone表示・Validationを揃えてから新版へ切り替えます。Phase全体の完成条件は `REQUIREMENTS.md` と最新版 `web-project-guide` を正本とします。
