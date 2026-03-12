# Subject Master Data - Implementation Summary

## 実装完了

科目のマスターデータが正常に作成されました。

## データ統計

- **カテゴリ数**: 5
- **科目数**: 18 (学習教科5 + ビジネススキル4 + プログラミング・IT3 + 音楽・クリエイティブ2 + 資格対策4)
- **人気科目**: 12
- **サブグループ数**: 63

## カテゴリ別詳細

### 1. 学習教科 (5科目)

| 科目 | 対象 | グループ数 | 人気 |
|------|------|------------|------|
| 英語 | 小・中・高・大学生・社会人 | 4 | ⭐ |
| 国語 | 小・中・高 | 4 | ⭐ |
| 数学 | 小・中・高・大学生・社会人 | 4 | ⭐ |
| 理科 | 小・中・高 | 4 | ⭐ |
| 社会 | 小・中・高 | 4 | ⭐ |

**グループ例**:
- 英語: 文法、読解、リスニング、スピーキング
- 国語: 現代文、古文、漢文、作文
- 数学: 計算、代数、幾何、統計

### 2. ビジネススキル (4科目)

| 科目 | 対象 | グループ数 | 人気 |
|------|------|------------|------|
| 経理 | 大学生・社会人 | 3 | ⭐ |
| Webマーケティング | 大学生・社会人 | 3 | ⭐ |
| 投資 | 大学生・社会人 | 3 | - |
| 一般教養 | 大学生・社会人 | 3 | - |

**グループ例**:
- 経理: 簿記、会計、財務諸表の基礎
- Webマーケティング: SEO、SNS運用、広告運用

### 3. プログラミング・IT (3科目)

| 科目 | 対象 | グループ数 | 人気 |
|------|------|------------|------|
| 情報処理 | 高・大学生・社会人 | 3 | ⭐ |
| プログラミング言語 | 中・高・大学生・社会人 | 4 | ⭐ |
| ゲーム理論 | 高・大学生・社会人 | 3 | - |

**グループ例**:
- 情報処理: アルゴリズム、データ構造、コンピュータサイエンスの基礎
- プログラミング言語: Python、JavaScript、Java、C++など

### 4. 音楽・クリエイティブ (2科目)

| 科目 | 対象 | グループ数 | 人気 |
|------|------|------------|------|
| 動画編集 | 中・高・大学生・社会人 | 3 | ⭐ |
| 音楽理論 | 小・中・高・大学生・社会人 | 4 | - |

**グループ例**:
- 動画編集: Premiere Pro、Final Cut Pro、After Effects
- 音楽理論: 楽典、和声、作曲、編曲の基礎

### 5. 資格対策 (4科目)

| 科目 | 対象 | グループ数 | 人気 |
|------|------|------------|------|
| 英検 | 小・中・高・大学生・社会人 | 7 | ⭐ |
| 簿記 | 高・大学生・社会人 | 2 | ⭐ |
| 情報処理技術者試験 | 高・大学生・社会人 | 2 | - |
| その他 | 小・中・高・大学生・社会人 | 3 | - |

**グループ例**:
- 英検: 5級、4級、3級、準2級、2級、準1級、1級
- 簿記: 日商簿記3級、日商簿記2級

## 実装済みファイル

### 1. Seed Script
**ファイル**: `backend/server/seed-subjects.ts`
- カテゴリ、科目、グループの自動作成
- 既存データのチェック機能
- エラーハンドリング

### 2. Test Script
**ファイル**: `backend/server/test-seed-data.ts`
- データ構造の検証
- データベース接続不要のドライラン
- データ統計の表示

### 3. Documentation
**ファイル**: `backend/SEED_SUBJECTS_README.md`
- 使用方法の詳細説明
- データ構造の説明
- APIエンドポイントの一覧

## 使用方法

### データベースへの投入

```bash
cd backend
npm install
npm run seed:subjects
```

### データ構造のテスト (データベース不要)

```bash
cd backend
npx tsx server/test-seed-data.ts
```

## API 管理

管理者は以下のAPIエンドポイントを使用してデータを管理できます:

### カテゴリ管理
- `GET /api/admin/subject-categories` - 一覧取得
- `POST /api/admin/subject-categories` - 作成
- `PATCH /api/admin/subject-categories/:id` - 更新
- `DELETE /api/admin/subject-categories/:id` - 削除

### 科目管理
- `GET /api/admin/subjects` - 一覧取得
- `POST /api/admin/subjects` - 作成
- `PATCH /api/admin/subjects/:id` - 更新
- `DELETE /api/admin/subjects/:id` - 削除

### グループ管理
- `GET /api/admin/subject-groups` - 一覧取得
- `POST /api/admin/subject-groups` - 作成
- `PATCH /api/admin/subject-groups/:id` - 更新
- `DELETE /api/admin/subject-groups/:id` - 削除

## データベーススキーマ

### subject_categories テーブル
```sql
CREATE TABLE subject_categories (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### subjects テーブル
```sql
CREATE TABLE subjects (
  id VARCHAR PRIMARY KEY,
  category_id VARCHAR REFERENCES subject_categories(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  is_popular BOOLEAN DEFAULT false,
  target_elementary BOOLEAN DEFAULT false,
  target_junior_high BOOLEAN DEFAULT false,
  target_high_school BOOLEAN DEFAULT false,
  target_university_adult BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### subject_groups テーブル
```sql
CREATE TABLE subject_groups (
  id VARCHAR PRIMARY KEY,
  subject_id VARCHAR REFERENCES subjects(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## 特徴

1. **柔軟な対象設定**: 各科目は複数の学年/年齢層をターゲットにできます
2. **人気科目フラグ**: 人気の科目を識別可能
3. **階層構造**: カテゴリ → 科目 → グループの3階層
4. **カスケード削除**: カテゴリ削除時、関連する科目とグループも自動削除
5. **ソート順序**: 各レベルでソート順序をカスタマイズ可能
6. **アクティブフラグ**: 削除せずに無効化が可能

## 今後の拡張性

- 新しいカテゴリの追加が容易
- 科目やグループの動的な追加・削除
- 管理画面からのデータ管理
- 先生の専門科目との紐付け
- 生徒の学習履歴との連携

## 完了チェックリスト

- ✅ データベーススキーマ設計完了
- ✅ シードスクリプト作成完了
- ✅ テストスクリプト作成完了
- ✅ ドキュメント作成完了
- ✅ データ検証完了 (ドライラン)
- ✅ npm スクリプト追加完了
- ⏳ データベースへの実投入 (環境による)
