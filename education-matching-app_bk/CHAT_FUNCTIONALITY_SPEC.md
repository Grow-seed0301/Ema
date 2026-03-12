# チャット機能 仕様書

## 目次
1. [概要](#概要)
2. [アーキテクチャ](#アーキテクチャ)
3. [データモデル](#データモデル)
4. [API エンドポイント](#apiエンドポイント)
5. [フロントエンド実装](#フロントエンド実装)
6. [主要フロー](#主要フロー)
7. [セキュリティ考慮事項](#セキュリティ考慮事項)
8. [導入ガイド](#導入ガイド)

---

## 概要

### 機能概要
本チャット機能は、教育マッチングアプリにおいて生徒と教師の間でリアルタイムメッセージングを可能にする機能です。ユーザー間のコミュニケーションを円滑にし、レッスンの調整や質問の対応などを容易にします。

### 主要機能
- **チャットリスト表示**: ユーザーの全てのチャットを一覧表示
- **メッセージング**: テキストメッセージの送受信
- **既読管理**: メッセージの既読/未読状態の追跡
- **検索機能**: チャット参加者名による検索
- **未読バッジ**: 未読メッセージ数の表示
- **タイムスタンプ**: メッセージの送信時刻表示
- **画像メッセージ対応**: 画像送信のためのUI（実装準備済み）

### 対応ユーザータイプ
- **生徒 (Student)**: 教師とチャット可能
- **教師 (Teacher)**: 生徒とチャット可能

---

## アーキテクチャ

### システム構成

```
┌─────────────────────────────────────────────────────────┐
│                  React Native App                        │
│  ┌───────────────────────┐  ┌─────────────────────────┐ │
│  │  ChatListScreen.tsx   │  │   ChatScreen.tsx        │ │
│  │  - チャット一覧表示    │  │   - メッセージ送受信    │ │
│  │  - 検索機能           │  │   - 既読管理            │ │
│  │  - 未読数表示         │  │   - リアルタイム表示    │ │
│  └───────────┬───────────┘  └──────────┬──────────────┘ │
└──────────────┼──────────────────────────┼────────────────┘
               │                          │
               │    services/api.ts       │
               │                          │
               └──────────────┬───────────┘
                              │
                      HTTP/REST API
                              │
┌─────────────────────────────┴───────────────────────────┐
│                    Backend API Server                    │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Route Handlers                           │ │
│  │  ┌──────────────────┐  ┌──────────────────┐       │ │
│  │  │ student/chat.ts  │  │ teacher/chat.ts  │       │ │
│  │  └────────┬─────────┘  └────────┬─────────┘       │ │
│  │           │                      │                 │ │
│  │           └──────────┬───────────┘                 │ │
│  │                      │                             │ │
│  │           ┌──────────┴─────────┐                   │ │
│  │           │  shared/chat.ts    │                   │ │
│  │           │  共通ハンドラー     │                   │ │
│  │           └──────────┬─────────┘                   │ │
│  └──────────────────────┼──────────────────────────── │ │
│                         │                              │
│  ┌──────────────────────┴─────────────────────────┐   │
│  │          storage.ts (Data Access Layer)        │   │
│  │  - getUserChats()                              │   │
│  │  - getChatMessages()                           │   │
│  │  - sendMessage()                               │   │
│  │  - markMessagesAsRead()                        │   │
│  └──────────────────────┬─────────────────────────┘   │
└─────────────────────────┼─────────────────────────────┘
                          │
                   PostgreSQL
                          │
              ┌───────────┴───────────┐
              │   Tables              │
              │  - chats              │
              │  - chat_messages      │
              │  - users              │
              │  - teachers           │
              └───────────────────────┘
```

### 技術スタック

#### フロントエンド
- **React Native**: モバイルアプリケーションフレームワーク
- **TypeScript**: 型安全な開発
- **React Navigation**: 画面遷移管理
- **AsyncStorage**: ローカルストレージ（トークン管理）
- **Expo Vector Icons**: アイコン表示

#### バックエンド
- **Node.js + Express**: REST APIサーバー
- **TypeScript**: 型安全なバックエンド開発
- **Drizzle ORM**: データベースORM
- **PostgreSQL**: リレーショナルデータベース

### 認証方式
- **JWT (JSON Web Token)**: Bearer トークン認証
- **役割ベースアクセス制御**: student/teacher 別のエンドポイント

---

## データモデル

### データベーススキーマ

#### chats テーブル
チャットルーム情報を管理するテーブル

```typescript
{
  id: string (UUID, Primary Key)
  participant1Id: string (Foreign Key → users.id)
  participant2Id: string (Foreign Key → teachers.id)
  lastMessageAt: timestamp (最終メッセージ送信日時)
  createdAt: timestamp (作成日時)
}
```

**制約とインデックス**:
- `participant1Id` は users テーブル（生徒）への外部キー
- `participant2Id` は teachers テーブル（教師）への外部キー
- チャット検索のため `lastMessageAt` にインデックス推奨

**現在の設計上の制限**:
- 現在の実装では、チャットは生徒と教師の間でのみ作成可能
- 生徒同士や教師同士のチャットは不可
- より柔軟な設計が必要な場合は、参加者テーブルを統合するか、中間テーブルを使用することを推奨

#### chat_messages テーブル
メッセージ情報を管理するテーブル

```typescript
{
  id: string (UUID, Primary Key)
  chatId: string (Foreign Key → chats.id)
  senderId: string (送信者ID)
  senderType: 'user' | 'teacher' (送信者タイプ)
  text: string (メッセージ本文)
  imageUrl: string (optional, 画像URL)
  isRead: boolean (既読フラグ, default: false)
  createdAt: timestamp (送信日時)
}
```

**制約とインデックス**:
- `chatId` は chats テーブルへの外部キー
- `senderType` は 'user' または 'teacher' のみ許可（CHECK制約）
- メッセージ取得最適化のため `chatId` と `createdAt` の複合インデックス推奨

### データ型定義

#### TypeScript型定義

```typescript
// Chat型
interface Chat {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessageAt: Date | null;
  createdAt: Date;
}

// ChatMessage型
interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderType: 'user' | 'teacher';
  text: string;
  imageUrl?: string;
  isRead: boolean;
  createdAt: Date;
}

// フロントエンド用のメッセージ型
interface Message {
  id: string;
  text: string;
  time: string;         // "HH:MM" 形式
  isMe: boolean;        // 自分が送信したメッセージか
  isRead?: boolean;     // 既読状態
  isImage?: boolean;    // 画像メッセージか
}

// チャットリストアイテム型
interface ChatItem {
  id: string;
  participantId: string;
  name: string;
  lastMessage: string;
  time: string;         // "5分前" などの相対時間
  unreadCount: number;
  subjects: Array<{
    label: string;
    color: string;
  }>;
}
```

---

## APIエンドポイント

### 認証
全てのエンドポイントは認証が必要です。
```
Authorization: Bearer <access_token>
```

### 共通レスポンス形式

成功時:
```json
{
  "success": true,
  "data": { ... }
}
```

エラー時:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ"
  }
}
```

### 生徒用エンドポイント

#### 1. チャットリスト取得
```
GET /api/student/chats
```

**説明**: 認証された生徒の全てのチャットを取得

**レスポンス**:
```json
{
  "success": true,
  "data": [
    {
      "id": "chat-uuid",
      "participantId": "teacher-uuid",
      "participantName": "田中先生",
      "participantAvatar": "https://...",
      "lastMessage": "明日のレッスンについて...",
      "lastMessageTime": "2024-01-15T10:30:00Z",
      "timeAgo": "5分前",
      "unreadCount": 2,
      "subjects": [
        { "label": "数学", "color": "#3B82F6" }
      ]
    }
  ]
}
```

#### 2. チャット作成または取得
```
GET /api/student/chats/with/:participantId
```

**説明**: 指定した教師とのチャットを取得、存在しない場合は新規作成

**パラメータ**:
- `participantId` (path): 教師のID

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "id": "chat-uuid",
    "participant1Id": "student-uuid",
    "participant2Id": "teacher-uuid",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

#### 3. メッセージ一覧取得
```
GET /api/student/chats/:chatId/messages?before=&limit=50
```

**説明**: 指定したチャットのメッセージを取得（ページネーション対応）

**パラメータ**:
- `chatId` (path): チャットID
- `before` (query, optional): この日時より前のメッセージを取得
- `limit` (query, optional): 取得件数（デフォルト: 50, 最大: 100）

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "message-uuid",
        "senderId": "user-uuid",
        "senderType": "user",
        "text": "こんにちは",
        "createdAt": "2024-01-15T10:30:00Z",
        "time": "10:30",
        "isMe": true,
        "isRead": true,
        "isImage": false,
        "imageUrl": null
      }
    ],
    "hasMore": false
  }
}
```

#### 4. メッセージ送信
```
POST /api/student/chats/:chatId/messages
```

**説明**: チャットに新しいメッセージを送信

**パラメータ**:
- `chatId` (path): チャットID

**リクエストボディ**:
```json
{
  "text": "メッセージ本文"
}
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "id": "message-uuid",
    "senderId": "user-uuid",
    "senderType": "user",
    "text": "メッセージ本文",
    "createdAt": "2024-01-15T10:30:00Z",
    "time": "10:30"
  }
}
```

#### 5. メッセージ既読化
```
POST /api/student/chats/:chatId/read
```

**説明**: チャット内の未読メッセージを全て既読にする

**パラメータ**:
- `chatId` (path): チャットID

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

### 教師用エンドポイント

教師用エンドポイントは生徒用とほぼ同じ構造ですが、パスが異なります：

- `GET /api/teacher/chats` - チャットリスト取得
- `GET /api/teacher/chats/with/:participantId` - チャット作成または取得（生徒と）
- `GET /api/teacher/chats/:chatId/messages` - メッセージ一覧取得
- `POST /api/teacher/chats/:chatId/messages` - メッセージ送信
- `POST /api/teacher/chats/:chatId/read` - メッセージ既読化

**注意**: 教師の場合、`participantId` は生徒のIDを指定します。

### エラーコード

| コード | 説明 |
|--------|------|
| `UNAUTHORIZED` | 認証エラー（401） |
| `FORBIDDEN` | アクセス権限なし（403） |
| `NOT_FOUND` | リソースが見つからない（404） |
| `VALIDATION_ERROR` | 入力データエラー（400） |
| `FETCH_FAILED` | データ取得失敗（500） |
| `SEND_FAILED` | メッセージ送信失敗（500） |
| `UPDATE_FAILED` | データ更新失敗（500） |

---

## フロントエンド実装

### 画面構成

#### 1. ChatListScreen.tsx
チャット一覧画面

**主な機能**:
- チャットリストの表示
- 検索機能（参加者名）
- 未読バッジ表示
- 最終メッセージとタイムスタンプ表示
- チャット画面への遷移

**状態管理**:
```typescript
const [searchText, setSearchText] = useState('');
const [chats, setChats] = useState<ChatItem[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

**主要な処理フロー**:
1. 画面フォーカス時に `apiService.getChats()` でチャット一覧取得
2. 検索テキストでフィルタリング
3. チャットアイテムタップで ChatScreen へ遷移

**UIコンポーネント**:
- 検索バー（上部固定）
- スクロール可能なチャットリスト
- 各チャットアイテム：
  - アバター
  - 参加者名
  - 最終メッセージ
  - タイムスタンプ
  - 未読バッジ
  - 科目タグ

#### 2. ChatScreen.tsx
個別チャット画面

**主な機能**:
- メッセージ履歴の表示
- メッセージの送信
- 既読状態の表示
- キーボード対応
- 自動スクロール

**状態管理**:
```typescript
const [inputText, setInputText] = useState('');
const [messages, setMessages] = useState<Message[]>([]);
const [loading, setLoading] = useState(true);
const [sending, setSending] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**主要な処理フロー**:
1. マウント時に `apiService.getChatMessages()` でメッセージ履歴取得
2. 入室時に `apiService.markMessagesAsRead()` で既読化
3. 送信ボタンタップで `apiService.sendMessage()` でメッセージ送信
4. 送信成功後、ローカル状態を更新して画面に反映

**UIコンポーネント**:
- メッセージリスト（FlatList）
- 日付ヘッダー
- メッセージバブル（自分/相手で異なるスタイル）
- 入力エリア（下部固定）:
  - 添付ボタン（画像）
  - テキスト入力
  - 絵文字ボタン
  - 送信ボタン

### API サービス (services/api.ts)

チャット関連のAPIメソッド:

```typescript
class ApiService {
  // チャット一覧取得
  async getChats(): Promise<ApiResponse<ChatItem[]>>

  // チャット作成または取得
  async getOrCreateChat(participantId: string): Promise<ApiResponse<Chat>>

  // メッセージ取得
  async getChatMessages(
    chatId: string,
    params?: { before?: string; limit?: number }
  ): Promise<ApiResponse<{ messages: Message[], hasMore: boolean }>>

  // メッセージ送信
  async sendMessage(
    chatId: string,
    text: string
  ): Promise<ApiResponse<Message>>

  // メッセージ既読化
  async markMessagesAsRead(chatId: string): Promise<ApiResponse<{ success: boolean }>>

  // ユーザーロール取得（student/teacher）
  getUserRole(): string
}
```

**認証処理**:
- AsyncStorage からアクセストークンを取得
- 全てのリクエストに `Authorization: Bearer <token>` ヘッダーを付与
- ユーザーロール（student/teacher）に応じてエンドポイントを切り替え

### ナビゲーション

```typescript
// RootNavigator.tsx でのルート定義
type MainStackParamList = {
  ChatList: undefined;
  Chat: {
    chatId: string;
    name: string;
    participantId: string;
  };
}

// 遷移例
navigation.navigate('Chat', {
  chatId: chat.id,
  name: chat.name,
  participantId: chat.participantId
});
```

### スタイリング

**テーマシステム**:
- `useTheme()` フックでダークモード/ライトモード対応
- カラーテーマ:
  - `theme.primary`: プライマリカラー
  - `theme.background*`: 背景色（階層別）
  - `theme.text*`: テキスト色（階層別）
  - `theme.border`: ボーダー色
  - `theme.error`: エラー色

**レスポンシブデザイン**:
- `useSafeAreaInsets()` でセーフエリア対応
- `KeyboardAvoidingView` でキーボード表示時の調整

---

## 主要フロー

### 1. チャット一覧表示フロー

```
[ユーザー] → [ChatListScreen] → [API Service] → [Backend] → [Database]
                    ↓
              画面フォーカス
                    ↓
         apiService.getChats()
                    ↓
         GET /api/{role}/chats
                    ↓
              handleGetChats()
                    ↓
        storage.getUserChats(userId)
                    ↓
         chats + users/teachers JOIN
                    ↓
            未読数カウント計算
                    ↓
         タイムスタンプフォーマット
                    ↓
            レスポンス返却
                    ↓
         [ChatListScreen] 画面更新
                    ↓
            チャットリスト表示
```

### 2. メッセージ送信フロー

```
[ユーザー] → [ChatScreen] → [API Service] → [Backend] → [Database]
                ↓
         入力 + 送信ボタン
                ↓
      apiService.sendMessage()
                ↓
    POST /api/{role}/chats/:chatId/messages
                ↓
         { text: "..." }
                ↓
        handleSendMessage()
                ↓
     チャット存在確認 + 権限確認
                ↓
    storage.sendMessage({
      chatId,
      senderId,
      senderType,
      text
    })
                ↓
      chat_messages テーブルに挿入
                ↓
    chats.lastMessageAt 更新
                ↓
         メッセージ返却
                ↓
    [ChatScreen] ローカル状態更新
                ↓
        メッセージ表示
                ↓
       自動スクロール（下部）
```

### 3. 既読管理フロー

```
[ユーザー] → [ChatScreen] → [API Service] → [Backend] → [Database]
                ↓
        チャット画面入室
                ↓
   apiService.markMessagesAsRead()
                ↓
   POST /api/{role}/chats/:chatId/read
                ↓
      handleMarkMessagesAsRead()
                ↓
    チャット存在確認 + 権限確認
                ↓
  storage.markMessagesAsRead(chatId, userId)
                ↓
    UPDATE chat_messages
    SET isRead = true
    WHERE chatId = ? 
      AND senderId != ?
                ↓
         成功レスポンス
                ↓
    [送信者のChatScreen] 既読表示更新
```

### 4. チャット作成フロー（初回メッセージ送信時）

```
[生徒] → [TeacherDetailScreen] → [API Service] → [Backend] → [Database]
              ↓
        「メッセージ」ボタンタップ
              ↓
    apiService.getOrCreateChat(teacherId)
              ↓
    GET /api/student/chats/with/:teacherId
              ↓
      handleGetOrCreateChat()
              ↓
    教師存在確認
              ↓
  storage.getChatBetweenUsers(studentId, teacherId)
              ↓
       既存チャット検索
              ↓
    存在しない場合:
    storage.createChat({
      participant1Id: studentId,
      participant2Id: teacherId
    })
              ↓
        chats テーブルに挿入
              ↓
        チャットID返却
              ↓
    [ChatScreen] へ遷移
```

---

## セキュリティ考慮事項

### 1. 認証・認可

**JWT トークン認証**:
- 全エンドポイントで `isAuthenticated` ミドルウェアによる認証チェック
- トークンから `userId` を抽出し、`req.userId` に設定
- トークンの有効期限チェック

**アクセス制御**:
```typescript
// チャット参加者確認の例
if (chat.participant1Id !== userId && chat.participant2Id !== userId) {
  return sendError(res, "Unauthorized to access this chat", "UNAUTHORIZED", 403);
}
```

### 2. 入力検証

**メッセージテキスト検証**:
```typescript
if (!text || typeof text !== "string" || text.trim().length === 0) {
  return sendError(res, "Message text is required", "VALIDATION_ERROR", 400);
}
```

**文字数制限**:
- フロントエンド: `maxLength={1000}` で入力制限
- バックエンド: text.trim() で前後空白削除

### 3. データプライバシー

**チャット参加者の限定**:
- チャットは必ず2人の参加者のみ（1対1）
- 他ユーザーのチャット内容にはアクセス不可
- 参加者確認を全エンドポイントで実施

**個人情報の取り扱い**:
- **現状**: メッセージは平文でデータベースに保存
- **推奨**: 教育コンテキストでの機密性を考慮し、メッセージの暗号化（at-rest encryption）を実装することを強く推奨
- ユーザー削除時のチャット履歴の処理を考慮（GDPR対応）

### 4. SQL インジェクション対策

**Drizzle ORM の使用**:
- パラメータ化されたクエリを自動生成
- 直接的なSQL文字列結合を避ける

```typescript
// 安全なクエリ例
await db.select()
  .from(chats)
  .where(eq(chats.id, chatId));
```

### 5. XSS (Cross-Site Scripting) 対策

**フロントエンド**:
- React Native の自動エスケープ機能を活用
- `dangerouslySetInnerHTML` の使用を避ける
- ユーザー入力をそのままレンダリング

**バックエンド**:
- テキストのサニタイゼーションは実施せず、元のテキストを保存
- 表示時にフロントエンドで安全にレンダリング

### 6. レート制限

**推奨実装**:
- メッセージ送信のレート制限（推奨: 1分に10メッセージ）
- API呼び出しのレート制限（例: 1分に60リクエスト）

```typescript
// 実装例（未実装の場合の推奨）
import rateLimit from 'express-rate-limit';

const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分
  max: 10,             // 最大10メッセージ
  message: 'メッセージ送信が早すぎます。少し待ってから再度お試しください。'
});

app.post('/api/*/chats/:chatId/messages', messageLimiter, ...);
```

**注意**: あまりに厳しいレート制限（例: 1秒に1メッセージ）は、自然な会話の流れを妨げる可能性があります。スパム防止と使いやすさのバランスを考慮してください。

---

## 導入ガイド

このチャット機能を他のシステムに導入する手順を説明します。

### 前提条件

- Node.js 16以上
- PostgreSQL 12以上
- React Native開発環境（Expo推奨）

### ステップ1: データベーススキーマの作成

```sql
-- chats テーブル
-- 注意: 現在の設計では participant1 は生徒、participant2 は教師に限定されています
-- より柔軟な設計（生徒同士、教師同士のチャット）が必要な場合は、
-- 参加者テーブルの統合または中間テーブルの使用を検討してください
CREATE TABLE chats (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id VARCHAR NOT NULL REFERENCES users(id),
  participant2_id VARCHAR NOT NULL REFERENCES teachers(id),
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- chat_messages テーブル
CREATE TABLE chat_messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id VARCHAR NOT NULL REFERENCES chats(id),
  sender_id VARCHAR NOT NULL,
  sender_type VARCHAR NOT NULL CHECK (sender_type IN ('user', 'teacher')),
  text TEXT,
  image_url VARCHAR,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_chats_last_message_at ON chats(last_message_at);
CREATE INDEX idx_chat_messages_chat_id_created_at ON chat_messages(chat_id, created_at);
```

### ステップ2: バックエンドの実装

#### 2.1 必要なファイルをコピー

```
backend/server/
├── routes/
│   ├── shared/
│   │   └── chat.ts          # 共通ハンドラー
│   ├── student/
│   │   └── chat.ts          # 生徒用ルート
│   └── teacher/
│       └── chat.ts          # 教師用ルート
├── storage.ts               # データアクセス層に以下を追加:
│   ├── getUserChats()
│   ├── getChat()
│   ├── getChatBetweenUsers()
│   ├── createChat()
│   ├── getChatMessages()
│   ├── sendMessage()
│   └── markMessagesAsRead()
└── utils/
    └── dateTime.ts          # formatTimeAgo() を実装
```

#### 2.2 ルートの登録

```typescript
// backend/server/index.ts または routes.ts
import { registerStudentChatRoutes } from './routes/student/chat';
import { registerTeacherChatRoutes } from './routes/teacher/chat';

export function registerRoutes(app: Express) {
  // ... 他のルート
  registerStudentChatRoutes(app);
  registerTeacherChatRoutes(app);
}
```

### ステップ3: フロントエンドの実装

#### 3.1 必要なファイルをコピー

```
screens/
├── ChatListScreen.tsx       # チャット一覧画面
└── ChatScreen.tsx           # 個別チャット画面

services/
└── api.ts                   # 以下のメソッドを追加:
    ├── getChats()
    ├── getOrCreateChat()
    ├── getChatMessages()
    ├── sendMessage()
    └── markMessagesAsRead()
```

#### 3.2 ナビゲーションの設定

```typescript
// navigation/RootNavigator.tsx
import ChatListScreen from '@/screens/ChatListScreen';
import ChatScreen from '@/screens/ChatScreen';

type MainStackParamList = {
  // ... 他の画面
  ChatList: undefined;
  Chat: {
    chatId: string;
    name: string;
    participantId: string;
  };
};

function MainStack() {
  return (
    <Stack.Navigator>
      {/* ... 他の画面 */}
      <Stack.Screen 
        name="ChatList" 
        component={ChatListScreen}
        options={{ title: 'チャット' }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ title: 'チャット' }}
      />
    </Stack.Navigator>
  );
}
```

#### 3.3 タブナビゲーションへの追加（オプション）

```typescript
// navigation/MainTabNavigator.tsx
<Tab.Screen
  name="ChatList"
  component={ChatListScreen}
  options={{
    title: 'チャット',
    tabBarIcon: ({ color }) => (
      <Feather name="message-circle" size={24} color={color} />
    ),
  }}
/>
```

### ステップ4: 環境変数の設定

```env
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your-secret-key
API_BASE_URL=https://your-api-domain.com/api
```

### ステップ5: 依存関係のインストール

```bash
# バックエンド
cd backend
npm install express drizzle-orm pg

# フロントエンド
cd ..
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-safe-area-context
npm install @react-native-async-storage/async-storage
```

### ステップ6: 動作確認

#### テストユーザーの作成

```sql
-- 生徒ユーザー
INSERT INTO users (id, email, name) 
VALUES ('student-1', 'student@example.com', '山田太郎');

-- 教師ユーザー
INSERT INTO teachers (id, email, name, subjects)
VALUES ('teacher-1', 'teacher@example.com', '田中先生', ARRAY['数学', '英語']);
```

#### 動作確認手順

1. 生徒アカウントでログイン
2. 教師詳細画面から「メッセージ」ボタンをタップ
3. チャット画面でメッセージを送信
4. 教師アカウントでログイン
5. チャット一覧に未読バッジが表示されることを確認
6. チャット画面を開いて既読化されることを確認

### カスタマイズポイント

#### 1. メッセージ送信時の通知

```typescript
// backend/server/routes/shared/chat.ts の sendMessage に追加
import { sendPushNotification } from '../utils/notifications';

export async function handleSendMessage(req, res, options) {
  // ... メッセージ送信処理
  
  // 通知送信
  const recipientId = chat.participant1Id === userId 
    ? chat.participant2Id 
    : chat.participant1Id;
  
  await sendPushNotification(recipientId, {
    title: '新しいメッセージ',
    body: text,
    data: { chatId, type: 'chat_message' }
  });
}
```

#### 2. 画像送信機能の実装

```typescript
// 画像アップロード処理の追加
import multer from 'multer';
import { uploadToS3 } from '../utils/storage';

const upload = multer({ dest: 'uploads/' });

app.post(
  '/api/*/chats/:chatId/messages/image',
  isAuthenticated,
  upload.single('image'),
  async (req, res) => {
    const imageUrl = await uploadToS3(req.file);
    await storage.sendMessage({
      chatId: req.params.chatId,
      senderId: req.userId,
      senderType: options.userType,
      imageUrl,
    });
    // ...
  }
);
```

#### 3. リアルタイム更新（WebSocket）

```typescript
// Socket.io を使用したリアルタイム通信
import { Server } from 'socket.io';

const io = new Server(server);

io.on('connection', (socket) => {
  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
  });
  
  socket.on('send_message', async (data) => {
    const message = await storage.sendMessage(data);
    io.to(data.chatId).emit('new_message', message);
  });
});
```

#### 4. メッセージ検索機能

```typescript
// 全文検索機能の追加
export async function searchMessages(userId: string, query: string) {
  const userChats = await storage.getUserChats(userId);
  const chatIds = userChats.map(c => c.id);
  
  return await db.select()
    .from(chatMessages)
    .where(
      and(
        inArray(chatMessages.chatId, chatIds),
        ilike(chatMessages.text, `%${query}%`)
      )
    )
    .orderBy(desc(chatMessages.createdAt));
}
```

### トラブルシューティング

#### 問題: メッセージが表示されない

**確認事項**:
1. ネットワーク接続を確認
2. ブラウザコンソールでAPIエラーを確認
3. バックエンドログで認証エラーを確認
4. データベース接続を確認

#### 問題: 未読数が更新されない

**確認事項**:
1. `markMessagesAsRead` が正しく呼ばれているか確認
2. `isRead` フラグが正しく更新されているか確認
3. チャット一覧の再読み込みタイミングを確認

#### 問題: チャットが作成できない

**確認事項**:
1. 外部キー制約エラーがないか確認
2. `participant1Id` と `participant2Id` が正しいテーブルを参照しているか確認
3. ユーザーが存在するか確認

---

## まとめ

本チャット機能は以下の特徴を持ちます：

✅ **シンプルで拡張性の高いアーキテクチャ**
- 明確な責任分離（ルート → ハンドラー → ストレージ）
- 共通ハンドラーによるコードの再利用

✅ **セキュアな実装**
- JWT認証とアクセス制御
- 参加者検証によるプライバシー保護

✅ **良好なUX**
- 既読管理
- 未読バッジ
- リアルタイム感のある UI

✅ **他システムへの導入が容易**
- 明確な依存関係
- 段階的な実装が可能
- カスタマイズポイントが豊富

このドキュメントを参考に、他のシステムへの導入やカスタマイズを行ってください。
