# 画像アップロードAPI仕様書

## 概要

本ドキュメントは、教育マッチングアプリケーションにおける画像アップロード機能の仕様を定義します。
画像アップロードには **Presigned URL方式** を採用しており、セキュアで効率的なファイルアップロードを実現しています。

## アップロード方式

### Presigned URL方式の利点

1. **セキュリティ**: アプリケーションサーバーを経由せず、直接クラウドストレージにアップロード
2. **パフォーマンス**: サーバー負荷を軽減し、アップロード速度を向上
3. **スケーラビリティ**: 大量の同時アップロードに対応可能

### アップロードフロー

```
クライアント → API: アップロードURL取得リクエスト
API → クライアント: Presigned URL返却
クライアント → Cloud Storage: 画像を直接アップロード
クライアント → API: アップロード完了通知 & URL更新
```

---

## 1. プロフィール画像アップロード

プロフィール画像（アバター）のアップロード機能。生徒と教師の両方で利用可能。

### 1.1 アップロードURL取得

アップロード用のPresigned URLを取得します。

**エンドポイント:**
```
POST /api/student/profile-image/upload
POST /api/teacher/profile-image/upload
```

**認証:** Bearer Token必須

**リクエストボディ:** なし

**成功レスポンス (200):**
```json
{
  "uploadURL": "https://storage.googleapis.com/bucket-name/profile-images/uuid?X-Goog-Signature=..."
}
```

**エラーレスポンス:**
- `401 Unauthorized`: 認証トークンが無効
- `404 Not Found`: ユーザーが見つからない
- `500 Internal Server Error`: アップロードURL生成失敗

### 1.2 画像アップロード実行

取得したPresigned URLに対して画像をアップロードします。

**エンドポイント:** （手順1.1で取得したURL）

**HTTPメソッド:** `PUT`

**ヘッダー:**
```
Content-Type: image/jpeg (または image/png, image/webp)
```

**リクエストボディ:** 画像ファイルのバイナリデータ

**成功レスポンス:** `200 OK` (ボディなし)

**制約:**
- 最大ファイルサイズ: 5MB
- 対応形式: JPEG, PNG, WebP
- アスペクト比: 1:1 推奨

### 1.3 プロフィール画像URL更新

アップロード完了後、プロフィールに画像URLを設定します。

**エンドポイント:**
```
PUT /api/student/profile-image
PUT /api/teacher/profile-image
```

**認証:** Bearer Token必須

**リクエストボディ:**
```json
{
  "profileImageURL": "https://storage.googleapis.com/bucket-name/profile-images/uuid"
}
```

**注意:** クエリパラメータ（署名情報等）は除去し、ベースURLのみを送信してください。

**成功レスポンス (200):**
```json
{
  "success": true,
  "data": {
    "message": "Profile image updated",
    "objectPath": "/objects/public/profile-images/uuid",
    "user": {
      "id": "user-id",
      "name": "ユーザー名",
      "email": "user@example.com",
      "avatarUrl": "/objects/public/profile-images/uuid"
    }
  }
}
```

**エラーレスポンス:**
- `400 Bad Request`: profileImageURLが未指定
- `401 Unauthorized`: 認証トークンが無効
- `404 Not Found`: ユーザーが見つからない
- `500 Internal Server Error`: 更新失敗

---

## 2. チャット画像送信

チャットメッセージとして画像を送信する機能。

### 2.1 アップロードURL取得

チャット画像用のPresigned URLを取得します。

**エンドポイント:**
```
POST /api/student/chats/:chatId/image/upload
POST /api/teacher/chats/:chatId/image/upload
```

**認証:** Bearer Token必須

**パスパラメータ:**
- `chatId`: チャットID

**リクエストボディ:** なし

**成功レスポンス (200):**
```json
{
  "uploadURL": "https://storage.googleapis.com/bucket-name/chat-images/uuid?X-Goog-Signature=..."
}
```

**エラーレスポンス:**
- `401 Unauthorized`: 認証トークンが無効
- `403 Forbidden`: チャットへのアクセス権限なし
- `404 Not Found`: チャットが見つからない
- `500 Internal Server Error`: アップロードURL生成失敗

### 2.2 画像アップロード実行

取得したPresigned URLに対して画像をアップロードします。

**エンドポイント:** （手順2.1で取得したURL）

**HTTPメソッド:** `PUT`

**ヘッダー:**
```
Content-Type: image/jpeg (または image/png, image/webp)
```

**リクエストボディ:** 画像ファイルのバイナリデータ

**成功レスポンス:** `200 OK` (ボディなし)

**制約:**
- 最大ファイルサイズ: 10MB
- 対応形式: JPEG, PNG, WebP

### 2.3 画像メッセージ送信

アップロード完了後、画像URLを含むメッセージを送信します。

**エンドポイント:**
```
POST /api/student/chats/:chatId/image
POST /api/teacher/chats/:chatId/image
```

**認証:** Bearer Token必須

**パスパラメータ:**
- `chatId`: チャットID

**リクエストボディ:**
```json
{
  "imageURL": "https://storage.googleapis.com/bucket-name/chat-images/uuid"
}
```

**注意:** クエリパラメータ（署名情報等）は除去し、ベースURLのみを送信してください。

**成功レスポンス (201):**
```json
{
  "success": true,
  "data": {
    "id": "message-id",
    "senderId": "user-id",
    "senderType": "user",
    "text": "",
    "imageUrl": "/objects/chat-images/uuid",
    "createdAt": "2024-01-14T12:34:56.789Z",
    "time": "12:34"
  }
}
```

**エラーレスポンス:**
- `400 Bad Request`: imageURLが未指定
- `401 Unauthorized`: 認証トークンが無効
- `403 Forbidden`: チャットへのアクセス権限なし
- `404 Not Found`: チャットが見つからない
- `500 Internal Server Error`: メッセージ送信失敗

---

## 3. 画像の取得・表示

アップロードされた画像を取得・表示する方法。

### 3.1 パブリック画像（プロフィール画像）

**URL形式:**
```
/objects/public/profile-images/{uuid}
```

**アクセス:** 認証不要（公開）

**例:**
```
GET /objects/public/profile-images/abc123-def456-ghi789
```

### 3.2 プライベート画像（チャット画像）

**URL形式:**
```
/objects/chat-images/{uuid}
```

**アクセス:** 認証必須、チャット参加者のみ

**例:**
```
GET /objects/chat-images/abc123-def456-ghi789
Authorization: Bearer <access_token>
```

---

## 4. 実装ガイドライン

### クライアント側の実装フロー

#### プロフィール画像アップロード

```typescript
// 1. ユーザーが画像を選択
const imageUri = await pickImage();

// 2. アップロードURL取得
const { uploadURL } = await getProfileImageUploadUrl();

// 3. 画像をバイナリとして取得
const response = await fetch(imageUri);
const blob = await response.blob();

// 4. Presigned URLに直接アップロード
await fetch(uploadURL, {
  method: 'PUT',
  body: blob,
  headers: {
    'Content-Type': blob.type || 'image/jpeg',
  },
});

// 5. クエリパラメータを除去してベースURLを取得
const url = new URL(uploadURL);
const storageURL = `${url.origin}${url.pathname}`;

// 6. プロフィールを更新
await updateProfileImage(storageURL);
```

#### チャット画像送信

```typescript
// 1. ユーザーが画像を選択
const imageUri = await pickImage();

// 2. アップロードURL取得
const { uploadURL } = await getChatImageUploadUrl(chatId);

// 3. 画像をバイナリとして取得
const response = await fetch(imageUri);
const blob = await response.blob();

// 4. Presigned URLに直接アップロード
await fetch(uploadURL, {
  method: 'PUT',
  body: blob,
  headers: {
    'Content-Type': blob.type || 'image/jpeg',
  },
});

// 5. クエリパラメータを除去してベースURLを取得
const url = new URL(uploadURL);
const storageURL = `${url.origin}${url.pathname}`;

// 6. 画像メッセージを送信
await sendChatImage(chatId, storageURL);
```

### サーバー側の実装ポイント

#### Presigned URL生成

```typescript
// プロフィール画像用（パブリック）
async getPublicObjectUploadURL(): Promise<string> {
  const objectId = randomUUID();
  const fullPath = `${publicObjectDir}/profile-images/${objectId}`;
  return signObjectURL({
    bucketName,
    objectName,
    method: 'PUT',
    ttlSec: 900, // 15分
  });
}

// チャット画像用（プライベート）
async getChatImageUploadURL(): Promise<string> {
  const objectId = randomUUID();
  const fullPath = `${privateObjectDir}/chat-images/${objectId}`;
  return signObjectURL({
    bucketName,
    objectName,
    method: 'PUT',
    ttlSec: 900, // 15分
  });
}
```

#### ACL設定

```typescript
// プロフィール画像: パブリック読み取り可能
await setObjectAclPolicy(objectFile, {
  owner: userId,
  visibility: 'public',
});

// チャット画像: チャット参加者のみアクセス可能
await setObjectAclPolicy(objectFile, {
  owner: userId,
  visibility: 'private',
  allowedUsers: [participant1Id, participant2Id],
});
```

---

## 5. セキュリティ考慮事項

### ファイルサイズ制限

- プロフィール画像: 最大5MB
- チャット画像: 最大10MB
- 制限を超える場合はクライアント側で事前にリサイズ

### ファイル形式検証

- 許可形式: JPEG, PNG, WebP
- Content-Typeヘッダーで検証
- 拡張子チェック（クライアント側）

### アクセス制御

- プロフィール画像: 公開（誰でも閲覧可能）
- チャット画像: プライベート（チャット参加者のみ）
- ACLポリシーで厳密に管理

### Presigned URLの有効期限

- 生成から15分間有効
- 期限切れの場合は再取得が必要

---

## 6. エラーハンドリング

### 一般的なエラーケース

| エラー | 原因 | 対処方法 |
|--------|------|----------|
| アップロードURL取得失敗 | 認証エラー、サーバーエラー | 再ログイン、または再試行 |
| アップロード失敗 | ネットワークエラー、ファイルサイズ超過 | ファイルサイズ確認、ネットワーク確認後に再試行 |
| URL更新失敗 | 不正なURL、サーバーエラー | URLの形式確認、再試行 |

### クライアント側のエラー表示

```typescript
try {
  await uploadImage(imageUri);
} catch (error) {
  Alert.alert(
    'エラー',
    '画像のアップロードに失敗しました。もう一度お試しください。',
    [{ text: 'OK' }]
  );
}
```

---

## 7. テスト方法

### 単体テスト

1. **アップロードURL生成**: 正しい形式のURLが生成されることを確認
2. **ACL設定**: 適切なアクセス権限が設定されることを確認
3. **URL正規化**: クエリパラメータが正しく除去されることを確認

### 統合テスト

1. **プロフィール画像アップロード**: エンドツーエンドで画像がアップロードされることを確認
2. **チャット画像送信**: 画像メッセージが正しく送信・表示されることを確認
3. **アクセス制御**: 権限のないユーザーがプライベート画像にアクセスできないことを確認

---

## 8. パフォーマンス最適化

### 画像の最適化

- **リサイズ**: アップロード前にクライアント側でリサイズ
- **圧縮**: quality: 0.8 程度で圧縮
- **キャッシュ**: expo-imageを使用してキャッシュ機能を活用

### 推奨設定

```typescript
// ImagePicker設定
{
  allowsEditing: true,
  aspect: [1, 1],  // プロフィール画像
  quality: 0.8,    // 80%品質で圧縮
}

// expo-image設定
<Image
  source={{ uri: imageUrl }}
  cachePolicy="memory-disk"  // メモリとディスクにキャッシュ
  contentFit="cover"
/>
```

---

## 9. 将来の拡張

### 考慮すべき機能

- [ ] 画像編集機能（トリミング、フィルター）
- [ ] 動画アップロード対応
- [ ] プログレスバー表示
- [ ] バックグラウンドアップロード
- [ ] 複数画像の一括アップロード
- [ ] サムネイル自動生成

---

## まとめ

本仕様書で定義された画像アップロード機能は、Presigned URL方式を採用することで、
セキュアで効率的な画像アップロードを実現しています。

**重要なポイント:**
1. 3ステップのアップロードフロー（URL取得 → アップロード → URL更新）
2. クエリパラメータの除去
3. 適切なACL設定
4. エラーハンドリング

この仕様に従って実装することで、信頼性の高い画像アップロード機能を提供できます。
