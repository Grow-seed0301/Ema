# Subject Master Data Seeding

このドキュメントでは、科目のマスターデータを作成する方法について説明します。

## 概要

このシードスクリプトは、以下のデータを作成します:

### 科目カテゴリ (Subject Categories)
1. **学習教科** - 小学生から高校生向けの教科
2. **ビジネススキル** - 社会人向けビジネススキル
3. **プログラミング・IT** - プログラミングとIT関連
4. **音楽・クリエイティブ** - 音楽と創作活動
5. **資格対策** - 各種資格試験対策

### 科目 (Subjects)

#### 学習教科
- 英語 (文法、読解、リスニング、スピーキング)
- 国語 (現代文、古文、漢文、作文)
- 数学 (計算、代数、幾何、統計)
- 理科 (物理、化学、生物、地学)
- 社会 (地理、歴史、公民、現代社会)

#### ビジネススキル
- 経理 (簿記、会計、財務諸表の基礎)
- Webマーケティング (SEO、SNS運用、広告運用)
- 投資 (株式、投資信託、資産運用の基礎知識)
- 一般教養 (ビジネスマナー、経済、法律の基礎)

#### プログラミング・IT
- 情報処理 (アルゴリズム、データ構造、コンピュータサイエンスの基礎)
- プログラミング言語 (Python、JavaScript、Java、C++など)
- ゲーム理論 (ゲーム開発の基礎、Unity、Unreal Engine)

#### 音楽・クリエイティブ
- 動画編集 (Premiere Pro、Final Cut Pro、After Effects)
- 音楽理論 (楽典、和声、作曲、編曲の基礎)

#### 資格対策
- 英検 (5級、4級、3級、準2級、2級、準1級、1級)
- 簿記 (日商簿記3級、日商簿記2級)
- 情報処理技術者試験 (基本情報、応用情報)
- その他 (TOEIC、漢検、数検など)

## 前提条件

1. データベースが作成されていること
2. `DATABASE_URL` 環境変数が設定されていること
3. データベースのマイグレーションが実行済みであること

## 実行方法

### 1. データベースのプッシュ (初回のみ)

```bash
cd backend
npm run db:push
```

### 2. シードスクリプトの実行

```bash
cd backend
npm run seed:subjects
```

## 確認方法

シードスクリプト実行後、以下のようなサマリーが表示されます:

```
=== Summary ===
Total categories: 5
Total subjects: 19
Total groups: XX
```

## データ構造

### Subject Categories テーブル
- `id`: UUID (Primary Key)
- `name`: カテゴリ名
- `sortOrder`: 表示順序
- `isActive`: 有効/無効フラグ
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

### Subjects テーブル
- `id`: UUID (Primary Key)
- `categoryId`: カテゴリID (Foreign Key)
- `name`: 科目名
- `isPopular`: 人気科目フラグ
- `targetElementary`: 小学生対象フラグ
- `targetJuniorHigh`: 中学生対象フラグ
- `targetHighSchool`: 高校生対象フラグ
- `targetUniversityAdult`: 大学生・社会人対象フラグ
- `sortOrder`: 表示順序
- `isActive`: 有効/無効フラグ
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

### Subject Groups テーブル
- `id`: UUID (Primary Key)
- `subjectId`: 科目ID (Foreign Key)
- `name`: グループ名 (例: 文法、読解など)
- `sortOrder`: 表示順序
- `isActive`: 有効/無効フラグ
- `createdAt`: 作成日時
- `updatedAt`: 更新日時

## API エンドポイント

管理者向けのAPIエンドポイントは既に実装されています:

### Subject Categories
- `GET /api/admin/subject-categories` - カテゴリ一覧取得
- `POST /api/admin/subject-categories` - カテゴリ作成
- `PATCH /api/admin/subject-categories/:id` - カテゴリ更新
- `DELETE /api/admin/subject-categories/:id` - カテゴリ削除

### Subjects
- `GET /api/admin/subjects?categoryId=xxx` - 科目一覧取得
- `POST /api/admin/subjects` - 科目作成
- `PATCH /api/admin/subjects/:id` - 科目更新
- `DELETE /api/admin/subjects/:id` - 科目削除

### Subject Groups
- `GET /api/admin/subject-groups?subjectId=xxx` - グループ一覧取得
- `POST /api/admin/subject-groups` - グループ作成
- `PATCH /api/admin/subject-groups/:id` - グループ更新
- `DELETE /api/admin/subject-groups/:id` - グループ削除

## 注意事項

- シードスクリプトは、既にデータが存在する場合は実行をスキップします
- データを再作成する場合は、既存のデータを手動で削除してください
- カテゴリを削除すると、関連する科目とグループも自動的に削除されます (CASCADE)

## トラブルシューティング

### "DATABASE_URL must be set" エラー
- データベース接続文字列が環境変数に設定されているか確認してください
- Replitの場合、データベースがプロビジョニングされているか確認してください

### "Subject categories already exist" メッセージ
- データが既に存在します
- 再作成する場合は、管理画面またはデータベースツールで既存データを削除してください

### npm コマンドが見つからない
- Node.js がインストールされているか確認してください
- backend ディレクトリで `npm install` を実行してください
