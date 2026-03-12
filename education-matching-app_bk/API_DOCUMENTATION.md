# Education App - バックエンドAPI仕様書

## 概要

本ドキュメントは、教育モバイルアプリケーションに必要なすべてのAPIエンドポイントを記載しています。APIはREST形式で、JSONフォーマットを使用します。

## ベースURL
```
https://api.yourserver.com/v1
```

## 認証
ヘッダーにBearer Tokenを使用：
```
Authorization: Bearer <access_token>
```

## 画像アップロード

画像アップロードには **Presigned URL方式** を採用しています。詳細は [IMAGE_UPLOAD_API_SPEC.md](./IMAGE_UPLOAD_API_SPEC.md) を参照してください。

**基本フロー:**
1. アップロードURL取得APIを呼び出す
2. 取得したPresigned URLに画像を直接アップロード（PUT）
3. 画像URL更新APIでプロフィール/チャットを更新

---

## 1. 認証API

### 1.1 アカウント登録
```
POST /auth/register
```

**リクエストボディ:**
```json
{
  "name": "string",        // ユーザー名（必須、2-50文字）
  "email": "string",       // メールアドレス（必須、有効なメール形式）
  "password": "string",    // パスワード（必須、8文字以上）
  "role": "string"         // 役割: "student" または "teacher"（必須）
}
```

**成功レスポンス (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "name": "string",
      "email": "string",
      "role": "string",
      "createdAt": "datetime"
    },
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

**エラーレスポンス (400/409):**
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "このメールアドレスは既に登録されています"
  }
}
```

---

### 1.2 ログイン
```
POST /auth/login
```

**リクエストボディ:**
```json
{
  "email": "string",       // メールアドレス（必須）
  "password": "string"     // パスワード（必須）
}
```

**成功レスポンス (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "name": "string",
      "email": "string",
      "role": "string",
      "avatarUrl": "string | null",
      "plan": {
        "id": "string",
        "name": "string",
        "remainingLessons": "number"
      },
      "rank": {
        "level": "string",      // "bronze" | "silver" | "gold" | "platinum"
        "points": "number"
      }
    },
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

---

### 1.3 Googleログイン
```
POST /auth/google
```

**リクエストボディ:**
```json
{
  "idToken": "string"      // Google ID Token（OAuth経由）
}
```

**レスポンス:** 1.2と同様

---

### 1.4 Appleログイン
```
POST /auth/apple
```

**リクエストボディ:**
```json
{
  "identityToken": "string",  // Apple Identity Token
  "authorizationCode": "string"
}
```

**レスポンス:** 1.2と同様

---

### 1.5 パスワードを忘れた場合
```
POST /auth/forgot-password
```

**リクエストボディ:**
```json
{
  "email": "string"        // 登録済みメールアドレス
}
```

**成功レスポンス (200):**
```json
{
  "success": true,
  "message": "確認コードをメールに送信しました"
}
```

---

### 1.6 認証コード確認
```
POST /auth/verify-code
```

**リクエストボディ:**
```json
{
  "email": "string",
  "code": "string"         // 6桁のOTPコード
}
```

**成功レスポンス (200):**
```json
{
  "success": true,
  "data": {
    "resetToken": "string"  // パスワードリセット用トークン
  }
}
```

---

### 1.7 パスワードリセット
```
POST /auth/reset-password
```

**リクエストボディ:**
```json
{
  "resetToken": "string",
  "newPassword": "string"  // 新しいパスワード（8文字以上）
}
```

**成功レスポンス (200):**
```json
{
  "success": true,
  "message": "パスワードが更新されました"
}
```

---

### 1.8 トークンリフレッシュ
```
POST /auth/refresh-token
```

**リクエストボディ:**
```json
{
  "refreshToken": "string"
}
```

**成功レスポンス (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

---

### 1.9 ログアウト
```
POST /auth/logout
```

**ヘッダー:** Bearer Token必須

**成功レスポンス (200):**
```json
{
  "success": true,
  "message": "ログアウトしました"
}
```

---

## 2. ユーザープロフィールAPI

### 2.1 プロフィール取得
```
GET /users/me
```

**ヘッダー:** Bearer Token必須

**成功レスポンス (200):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "email": "string",
    "phone": "string | null",
    "role": "string",
    "avatarUrl": "string | null",
    "dateOfBirth": "date | null",
    "gender": "string | null",       // "male" | "female" | "other"
    "address": "string | null",
    "bio": "string | null",
    "plan": {
      "id": "string",
      "name": "string",              // "ライト" | "スタンダード" | "プレミアム"
      "remainingLessons": "number",
      "totalLessons": "number",
      "expiryDate": "datetime"
    },
    "rank": {
      "level": "string",             // "bronze" | "silver" | "gold" | "platinum"
      "points": "number",
      "nextLevelPoints": "number"
    },
    "learningGoal": {
      "title": "string",
      "progress": "number"           // 0-100
    },
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

---

### 2.2 プロフィール更新（生徒）
```
PUT /users/me
```

**ヘッダー:** Bearer Token必須

**リクエストボディ:**
```json
{
  "name": "string",
  "phone": "string | null",
  "dateOfBirth": "date | null",
  "gender": "string | null",
  "address": "string | null",
  "learningGoal": "string | null"
}
```

**レスポンス:** 2.1と同様

---

### 2.3 プロフィール更新（教師）
```
PUT /users/me/teacher
```

**ヘッダー:** Bearer Token必須（teacherロール）

**リクエストボディ:**
```json
{
  "name": "string",
  "phone": "string | null",
  "dateOfBirth": "date | null",
  "gender": "string | null",
  "bio": "string | null",
  "subjects": ["string"],           // ["数学", "物理", "化学"]
  "pricePerHour": "number",
  "education": "string | null",
  "experience": "string | null",
  "teachingStyle": ["string"],      // ["個別最適化", "対話型"]
  "achievements": ["string"]
}
```

---

### 2.4 プロフィール画像アップロード

プロフィール画像のアップロードは3ステップで行います：

#### ステップ1: アップロードURL取得
```
POST /student/profile-image/upload
POST /teacher/profile-image/upload
```

**ヘッダー:** Bearer Token必須

**成功レスポンス (200):**
```json
{
  "uploadURL": "https://storage.googleapis.com/bucket-name/profile-images/uuid?..."
}
```

#### ステップ2: 画像アップロード

取得したURLに直接PUT

**リクエスト:**
- Method: PUT
- Body: 画像のバイナリデータ
- Content-Type: image/jpeg, image/png, または image/webp
- 最大5MB

#### ステップ3: プロフィール更新
```
PUT /student/profile-image
PUT /teacher/profile-image
```

**リクエストボディ:**
```json
{
  "profileImageURL": "https://storage.googleapis.com/bucket-name/profile-images/uuid"
}
```

**成功レスポンス (200):**
```json
{
  "success": true,
  "data": {
    "message": "Profile image updated",
    "objectPath": "/objects/public/profile-images/uuid",
    "user": {
      "id": "string",
      "name": "string",
      "email": "string",
      "avatarUrl": "/objects/public/profile-images/uuid"
    }
  }
}
```

---

### 2.5 メールアドレス変更
```
POST /users/me/change-email
```

**ヘッダー:** Bearer Token必須

**リクエストボディ:**
```json
{
  "newEmail": "string",
  "password": "string"     // 現在のパスワード確認
}
```

---

### 2.6 パスワード変更
```
POST /users/me/change-password
```

**ヘッダー:** Bearer Token必須

**リクエストボディ:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

---

## 3. 教師API

### 3.1 おすすめ教師一覧取得
```
GET /teachers/recommended
```

**ヘッダー:** Bearer Token必須

**クエリパラメータ:**
| パラメータ | 型 | 説明 |
|-------|------|-------------|
| limit | number | 取得件数（デフォルト: 10） |

**成功レスポンス (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "age": "number",
      "avatarUrl": "string | null",
      "avatarColor": "string",       // アバターがない場合の背景色
      "specialty": "string",         // 専門科目
      "subjects": ["string"],
      "rating": "number",            // 0-5
      "reviewCount": "number",
      "pricePerHour": "number",
      "favorites": "string",         // "128" - お気に入り数
      "isFavorite": "boolean"        // ユーザーがお気に入り登録済みか
    }
  ]
}
```

---

### 3.2 教師検索
```
GET /teachers/search
```

**ヘッダー:** Bearer Token必須

**クエリパラメータ:**
| パラメータ | 型 | 説明 |
|-------|------|-------------|
| q | string | 検索キーワード（名前、科目） |
| subjects | string | 科目、カンマ区切り: "数学,物理" |
| priceMin | number | 最低料金/時間 |
| priceMax | number | 最高料金/時間 |
| ratingMin | number | 最低評価（0-5） |
| gender | string | "male" \| "female" |
| sortBy | string | "rating" \| "price" \| "reviewCount" \| "createdAt" |
| sortOrder | string | "asc" \| "desc" |
| page | number | ページ（デフォルト: 1） |
| limit | number | ページあたりの件数（デフォルト: 20） |

**成功レスポンス (200):**
```json
{
  "success": true,
  "data": {
    "teachers": [
      {
        "id": "string",
        "name": "string",
        "age": "number",
        "avatarUrl": "string | null",
        "avatarColor": "string",
        "specialty": "string",
        "subjects": ["string"],
        "rating": "number",
        "reviewCount": "number",
        "pricePerHour": "number",
        "favorites": "string",
        "isFavorite": "boolean"
      }
    ],
    "pagination": {
      "currentPage": "number",
      "totalPages": "number",
      "totalItems": "number",
      "hasNext": "boolean",
      "hasPrev": "boolean"
    }
  }
}
```

---

### 3.3 教師詳細取得
```
GET /teachers/:teacherId
```

**ヘッダー:** Bearer Token必須

**パスパラメータ:**
| パラメータ | 型 | 説明 |
|-------|------|-------------|
| teacherId | string | 教師ID |

**成功レスポンス (200):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "age": "number",
    "gender": "string",
    "avatarUrl": "string | null",
    "avatarColor": "string",
    "bio": "string",
    "specialty": "string",
    "subjects": ["string"],
    "rating": "number",
    "reviewCount": "number",
    "pricePerHour": "number",
    "totalStudents": "number",
    "totalLessons": "number",
    "isFavorite": "boolean",
    "education": "string",
    "experience": "string",
    "teachingStyles": ["string"],    // ["個別最適化", "対話型", "基礎重視"]
    "achievements": [
      {
        "icon": "string",            // "award" | "file-text" | "trending-up"
        "text": "string"
      }
    ],
    "availableSlots": [
      {
        "date": "date",
        "timeSlots": ["string"]      // ["10:00 - 11:00", "14:00 - 15:00"]
      }
    ]
  }
}
```

---

### 3.4 教師の空き状況取得
```
GET /teachers/:teacherId/availability
```

**ヘッダー:** Bearer Token必須

**クエリパラメータ:**
| パラメータ | 型 | 説明 |
|-------|------|-------------|
| month | number | 月（1-12） |
| year | number | 年 |

**成功レスポンス (200):**
```json
{
  "success": true,
  "data": {
    "availableDates": [
      {
        "date": "2024-10-03",
        "dayOfWeek": "木",
        "timeSlots": [
          {
            "startTime": "10:00",
            "endTime": "11:00",
            "isBooked": false
          },
          {
            "startTime": "14:00",
            "endTime": "15:00",
            "isBooked": false
          }
        ]
      }
    ]
  }
}
```

---

### 3.5 教師のレビュー取得
```
GET /teachers/:teacherId/reviews
```

**ヘッダー:** Bearer Token必須

**クエリパラメータ:**
| パラメータ | 型 | 説明 |
|-------|------|-------------|
| filter | string | "all" \| "student" \| "parent" |
| page | number | ページ（デフォルト: 1） |
| limit | number | ページあたりの件数（デフォルト: 10） |

**成功レスポンス (200):**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "string",
        "userId": "string",
        "userType": "string",        // "大学生" | "高校生" | "社会人"
        "gender": "string",          // "男性" | "女性"
        "avatarColor": "string",
        "rating": "number",          // 1-5
        "content": "string",
        "createdAt": "datetime",
        "timeAgo": "string"          // "2週間前"
      }
    ],
    "stats": {
      "averageRating": "number",
      "totalReviews": "number",
      "ratingDistribution": {
        "5": "number",
        "4": "number",
        "3": "number",
        "2": "number",
        "1": "number"
      }
    },
    "pagination": {
      "currentPage": "number",
      "totalPages": "number",
      "totalItems": "number"
    }
  }
}
```

---

### 3.6 お気に入り教師の追加/削除
```
POST /teachers/:teacherId/favorite
```

**ヘッダー:** Bearer Token必須

**リクエストボディ:**
```json
{
  "isFavorite": "boolean"    // true = 追加, false = 削除
}
```

**成功レスポンス (200):**
```json
{
  "success": true,
  "data": {
    "isFavorite": "boolean",
    "totalFavorites": "number"
  }
}
```

---

### 3.7 お気に入り教師一覧取得
```
GET /users/me/favorite-teachers
```

**ヘッダー:** Bearer Token必須

**成功レスポンス (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "age": "number",
      "avatarUrl": "string | null",
      "avatarColor": "string",
      "specialty": "string",
      "rating": "number",
      "reviewCount": "number",
      "pricePerHour": "number",
      "favorites": "string",
      "isFavorite": true
    }
  ]
}
```

---

## 4. 予約API

### 4.1 新規予約作成
```
POST /bookings
```

**ヘッダー:** Bearer Token必須

**リクエストボディ:**
```json
{
  "teacherId": "string",
  "lessonType": "string",           // "高校数学III - 微分積分"
  "date": "date",                   // "2024-10-17"
  "timeSlot": "string",             // "14:00 - 15:00"
  "format": "string"                // "online" | "offline"
}
```

**成功レスポンス (201):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "teacherId": "string",
    "teacherName": "string",
    "lessonType": "string",
    "date": "date",
    "time": "string",
    "dayOfWeek": "string",           // "木"
    "format": "string",
    "status": "string",              // "pending" | "confirmed" | "completed" | "cancelled"
    "price": "number",
    "createdAt": "datetime"
  }
}
```

---

### 4.2 予約済みレッスン一覧取得（今後）
```
GET /bookings/upcoming
```

**ヘッダー:** Bearer Token必須

**成功レスポンス (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "teacherId": "string",
      "teacherName": "string",
      "teacherAvatar": "string | null",
      "avatarColor": "string",
      "lessonTitle": "string",
      "date": "date",
      "time": "string",
      "dayOfWeek": "string",
      "format": "string",
      "status": "string"
    }
  ]
}
```

---

### 4.3 授業履歴取得
```
GET /bookings/history
```

**ヘッダー:** Bearer Token必須

**クエリパラメータ:**
| パラメータ | 型 | 説明 |
|-------|------|-------------|
| status | string | "completed" \| "cancelled" \| "all" |
| page | number | ページ |
| limit | number | ページあたりの件数 |

**成功レスポンス (200):**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "string",
        "teacherId": "string",
        "teacherName": "string",
        "avatarColor": "string",
        "lessonTitle": "string",
        "date": "date",
        "time": "string",
        "dayOfWeek": "string",
        "isCompleted": "boolean",
        "hasReview": "boolean"
      }
    ],
    "pagination": {
      "currentPage": "number",
      "totalPages": "number",
      "totalItems": "number"
    }
  }
}
```

---

### 4.4 予約キャンセル
```
DELETE /bookings/:bookingId
```

**ヘッダー:** Bearer Token必須

**リクエストボディ:**
```json
{
  "reason": "string"        // キャンセル理由（任意）
}
```

**成功レスポンス (200):**
```json
{
  "success": true,
  "message": "予約をキャンセルしました"
}
```

---

## 5. レビューAPI

### 5.1 レビュー投稿
```
POST /reviews
```

**ヘッダー:** Bearer Token必須

**リクエストボディ:**
```json
{
  "bookingId": "string",    // 完了したレッスンのID
  "teacherId": "string",
  "rating": "number",       // 1-5
  "content": "string"       // レビュー内容（10-500文字）
}
```

**成功レスポンス (201):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "rating": "number",
    "content": "string",
    "createdAt": "datetime"
  }
}
```

---

### 5.2 ユーザーのレビュー取得
```
GET /users/me/reviews
```

**ヘッダー:** Bearer Token必須

**成功レスポンス (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "teacherId": "string",
      "teacherName": "string",
      "lessonType": "string",
      "rating": "number",
      "content": "string",
      "createdAt": "datetime",
      "timeAgo": "string"
    }
  ]
}
```

---

### 5.3 最新レビュー取得
```
GET /student/reviews/latest
```

**ヘッダー:** Bearer Token必須

**クエリパラメータ:**
| パラメータ | 型 | 説明 |
|-------|------|-------------|
| limit | number | 取得件数（デフォルト: 10） |

**成功レスポンス (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "teacherId": "string",
      "teacherName": "string",
      "rating": "number",
      "content": "string",
      "userType": "string",        // "大学生" | "高校生" | "社会人"
      "createdAt": "datetime",
      "timeAgo": "string",         // "2週間前"
      "avatarColor": "string"
    }
  ]
}
```

---

## 6. チャットAPI

### 6.1 チャット一覧取得
```
GET /chats
```

**ヘッダー:** Bearer Token必須

**成功レスポンス (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "participantId": "string",
      "participantName": "string",
      "participantAvatar": "string | null",
      "lastMessage": "string",
      "lastMessageTime": "datetime",
      "timeAgo": "string",           // "10分前"
      "unreadCount": "number",
      "subjects": [
        {
          "label": "string",         // "数学"
          "color": "string"          // "#E3F2FD"
        }
      ]
    }
  ]
}
```

---

### 6.2 チャットメッセージ取得
```
GET /chats/:chatId/messages
```

**ヘッダー:** Bearer Token必須

**クエリパラメータ:**
| パラメータ | 型 | 説明 |
|-------|------|-------------|
| before | datetime | この時点より前のメッセージを取得（ページネーション） |
| limit | number | リクエストあたりのメッセージ数（デフォルト: 50） |

**成功レスポンス (200):**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "string",
        "senderId": "string",
        "senderType": "string",      // "user" or "teacher"
        "text": "string",
        "createdAt": "datetime",
        "time": "string",            // "10:30"
        "isMe": "boolean",
        "isRead": "boolean",
        "isImage": "boolean",
        "imageUrl": "string | null"
      }
    ],
    "hasMore": "boolean"
  }
}
```

---

### 6.3 メッセージ送信
```
POST /chats/:chatId/messages
```

**ヘッダー:** Bearer Token必須

**リクエストボディ:**
```json
{
  "text": "string"          // メッセージ内容
}
```

**成功レスポンス (201):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "senderId": "string",
    "senderType": "string",    // "user" or "teacher"
    "text": "string",
    "createdAt": "datetime",
    "time": "string"
  }
}
```

---

### 6.4 チャット画像送信

チャット画像の送信は3ステップで行います：

#### ステップ1: アップロードURL取得
```
POST /student/chats/:chatId/image/upload
POST /teacher/chats/:chatId/image/upload
```

**ヘッダー:** Bearer Token必須

**成功レスポンス (200):**
```json
{
  "uploadURL": "https://storage.googleapis.com/bucket-name/chat-images/uuid?..."
}
```

#### ステップ2: 画像アップロード

取得したURLに直接PUT

**リクエスト:**
- Method: PUT
- Body: 画像のバイナリデータ
- Content-Type: image/jpeg, image/png, または image/webp
- 最大10MB

#### ステップ3: 画像メッセージ送信
```
POST /student/chats/:chatId/image
POST /teacher/chats/:chatId/image
```

**リクエストボディ:**
```json
{
  "imageURL": "https://storage.googleapis.com/bucket-name/chat-images/uuid"
}
```

**成功レスポンス (201):**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "senderId": "string",
    "senderType": "string",
    "text": "",
    "imageUrl": "/objects/chat-images/uuid",
    "createdAt": "datetime",
    "time": "string"
  }
}
```

---

### 6.5 既読にする
```
POST /chats/:chatId/read
```

**ヘッダー:** Bearer Token必須

**成功レスポンス (200):**
```json
{
  "success": true
}
```

---

### 6.6 新規チャット作成
```
POST /chats
```

**ヘッダー:** Bearer Token必須

**リクエストボディ:**
```json
{
  "teacherId": "string"
}
```

**成功レスポンス (201):**
```json
{
  "success": true,
  "data": {
    "chatId": "string"
  }
}
```

---

## 7. プラン・決済API

### 7.1 プラン一覧取得
```
GET /plans
```

**ヘッダー:** Bearer Token必須

**成功レスポンス (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",              // "ライト" | "スタンダード" | "プレミアム"
      "price": "number",             // 12000
      "lessonsPerMonth": "number",
      "features": ["string"],
      "isPopular": "boolean"
    }
  ]
}
```

---

### 7.2 追加オプション取得
```
GET /plans/options
```

**ヘッダー:** Bearer Token必須

**成功レスポンス (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",              // "授業追加購入"
      "price": "number",             // 6000
      "unit": "string",              // "回"
      "description": "string"
    }
  ]
}
```

---

### 7.3 プラン購入/アップグレード
```
POST /subscriptions
```

**ヘッダー:** Bearer Token必須

**リクエストボディ:**
```json
{
  "planId": "string",
  "paymentMethodId": "string",      // 決済方法ID
  "options": [                       // 追加オプション（任意）
    {
      "optionId": "string",
      "quantity": "number"
    }
  ]
}
```

**成功レスポンス (201):**
```json
{
  "success": true,
  "data": {
    "subscriptionId": "string",
    "planName": "string",
    "totalAmount": "number",
    "startDate": "datetime",
    "endDate": "datetime",
    "remainingLessons": "number"
  }
}
```

---

### 7.4 決済履歴取得
```
GET /payments/history
```

**ヘッダー:** Bearer Token必須

**成功レスポンス (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "planName": "string",
      "amount": "number",
      "paymentMethod": "string",
      "status": "string",            // "completed" | "pending" | "failed"
      "createdAt": "datetime"
    }
  ]
}
```

---

## 8. 通知API

### 8.1 通知一覧取得
```
GET /notifications
```

**ヘッダー:** Bearer Token必須

**クエリパラメータ:**
| パラメータ | 型 | 説明 |
|-------|------|-------------|
| page | number | ページ |
| limit | number | ページあたりの件数 |

**成功レスポンス (200):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "string",
        "type": "string",            // "booking" | "message" | "payment" | "system"
        "title": "string",
        "body": "string",
        "isRead": "boolean",
        "data": {                    // タイプに応じた追加データ
          "bookingId": "string",
          "chatId": "string"
        },
        "createdAt": "datetime"
      }
    ],
    "unreadCount": "number"
  }
}
```

---

### 8.2 既読にする
```
POST /notifications/:notificationId/read
```

**ヘッダー:** Bearer Token必須

---

### 8.3 すべて既読にする
```
POST /notifications/read-all
```

**ヘッダー:** Bearer Token必須

---

### 8.4 プッシュ通知トークン登録
```
POST /users/me/push-token
```

**ヘッダー:** Bearer Token必須

**リクエストボディ:**
```json
{
  "token": "string",         // Expoプッシュトークン
  "platform": "string"       // "ios" | "android"
}
```

---

## 9. ホーム画面API

### 9.1 ホームデータ取得
```
GET /home
```

**ヘッダー:** Bearer Token必須

**成功レスポンス (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "name": "string",
      "plan": {
        "name": "string",
        "remainingLessons": "number"
      },
      "learningGoal": {
        "title": "string",
        "progress": "number"
      }
    },
    "nextLesson": {
      "id": "string",
      "teacherName": "string",
      "lessonTitle": "string",
      "date": "date",
      "time": "string",
      "dayOfWeek": "string"
    } | null,
    "recommendedTeachers": [
      {
        "id": "string",
        "name": "string",
        "specialty": "string",
        "avatarColor": "string"
      }
    ],
    "recentReviews": [
      {
        "id": "string",
        "teacherName": "string",
        "subject": "string",
        "rating": "number",
        "comment": "string",
        "timeAgo": "string",
        "avatarColor": "string"
      }
    ]
  }
}
```

---

## 10. 設定API

### 10.1 設定取得
```
GET /users/me/settings
```

**ヘッダー:** Bearer Token必須

**成功レスポンス (200):**
```json
{
  "success": true,
  "data": {
    "theme": "string",               // "light" | "dark" | "system"
    "language": "string",            // "ja" | "en" | "vi"
    "notifications": {
      "push": "boolean",
      "email": "boolean",
      "booking": "boolean",
      "message": "boolean",
      "promotion": "boolean"
    }
  }
}
```

---

### 10.2 設定更新
```
PUT /users/me/settings
```

**ヘッダー:** Bearer Token必須

**リクエストボディ:**
```json
{
  "theme": "string",
  "language": "string",
  "notifications": {
    "push": "boolean",
    "email": "boolean",
    "booking": "boolean",
    "message": "boolean",
    "promotion": "boolean"
  }
}
```

---

## エラーコード

| コード | HTTPステータス | 説明 |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | トークンが無効または期限切れ |
| FORBIDDEN | 403 | アクセス権限なし |
| NOT_FOUND | 404 | リソースが見つかりません |
| VALIDATION_ERROR | 400 | データが無効です |
| EMAIL_EXISTS | 409 | メールアドレスは既に存在します |
| INVALID_CREDENTIALS | 401 | メールアドレスまたはパスワードが間違っています |
| SLOT_NOT_AVAILABLE | 409 | 時間枠は既に予約されています |
| INSUFFICIENT_LESSONS | 400 | レッスン回数が不足しています |
| PAYMENT_FAILED | 402 | 決済に失敗しました |

---

## WebSocketイベント（リアルタイムチャット）

### 接続
```
wss://api.yourserver.com/ws?token=<access_token>
```

### サーバーからのイベント
```json
// 新規メッセージ
{
  "event": "new_message",
  "data": {
    "chatId": "string",
    "message": {
      "id": "string",
      "senderId": "string",
      "senderType": "string",      // "user" or "teacher"
      "text": "string",
      "createdAt": "datetime"
    }
  }
}

// 既読
{
  "event": "messages_read",
  "data": {
    "chatId": "string",
    "readBy": "string"
  }
}

// 入力中
{
  "event": "typing",
  "data": {
    "chatId": "string",
    "userId": "string",
    "isTyping": "boolean"
  }
}
```

### クライアントからのイベント
```json
// メッセージ送信
{
  "event": "send_message",
  "data": {
    "chatId": "string",
    "text": "string"
  }
}

// 入力中
{
  "event": "typing",
  "data": {
    "chatId": "string",
    "isTyping": "boolean"
  }
}
```

---

## バックエンド開発者向けメモ

1. **認証**: JWTを使用（アクセストークン: 15分、リフレッシュトークン: 7日）

2. **レート制限**: ユーザーあたり100リクエスト/分を推奨

3. **ページネーション**: 大きなリスト（メッセージ、レビュー）にはカーソルベースのページネーションを使用

4. **ファイルアップロード**: S3/クラウドストレージのpresigned URLを使用

5. **リアルタイム**: チャット用WebSocket、シンプルにしたい場合はFirebase/Pusherも可

6. **タイムゾーン**: すべてのdatetimeはUTC、クライアント側でローカルタイムゾーン（Asia/Tokyo）に変換

7. **バリデーション**: 
   - メール: 有効な形式
   - パスワード: 8文字以上、英数字を含む
   - 名前: 2-50文字
   - レビュー内容: 10-500文字

8. **ソフトデリート**: users、bookingsに適用して履歴を保持

9. **キャッシング**: セッション、頻繁にアクセスされるデータ（教師リスト、プラン）にRedisを使用

10. **プッシュ通知**: Expo Push Notificationサービスと連携

---

## 実装済みエンドポイント

以下のエンドポイントが実装されています：

### 学生向け
- `POST /api/student/register` - 学生登録
- `POST /api/student/login` - 学生ログイン
- `POST /api/student/logout` - ログアウト
- `GET /api/student/user` - 現在の学生ユーザー情報取得
- `GET /api/student/teachers/recommended` - おすすめ教師一覧取得（新規追加）
- `GET /api/student/bookings/upcoming` - 次回レッスン取得（新規追加）
- `GET /api/student/reviews/latest` - 最新レビュー取得（新規追加）

### 教師向け
- `POST /api/teacher/register` - 教師登録
- `POST /api/teacher/login` - 教師ログイン
- `POST /api/teacher/logout` - ログアウト
- `GET /api/teacher/user` - 現在の教師ユーザー情報取得

### 管理者向け
- `POST /api/admin/login` - 管理者ログイン
- `GET /api/admin/user` - 現在の管理者情報取得
- その他管理機能

**注:** APIエンドポイントには役割ベースのプレフィックス（`/student/`, `/teacher/`, `/admin/`）が付きます。
このドキュメントの簡略表記（例：`/teachers/recommended`）は、実際には `/api/student/teachers/recommended` として実装されています。
