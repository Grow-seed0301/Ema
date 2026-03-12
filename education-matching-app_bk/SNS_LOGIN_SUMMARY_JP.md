# SNS Login Implementation Summary

## 概要 (Overview)

このPRでは、Google、Facebook、Twitter、Instagramの4つのSNSプロバイダーを使用したログイン機能を実装しました。

## 実装内容

### ✅ 完了した機能

1. **Googleログイン**: 完全に実装済み
2. **Facebookログイン**: 完全に実装済み
3. **Twitterログイン**: 完全に実装済み
4. **Instagramログイン**: プレースホルダーのみ（Instagram Basic Display APIの追加設定が必要）

### 対応画面

- ✅ ログイン画面 (LoginScreen.tsx)
- ✅ 登録画面 (RegisterScreen.tsx)

### ユーザータイプ対応

- ✅ 生徒 (Student)
- ✅ 教師 (Teacher)

## 技術的な実装

### バックエンド

#### データベース
- `users`テーブルと`teachers`テーブルに`oauthProvider`と`oauthId`フィールドを追加
- マイグレーションスクリプト: `backend/migrations/0004_add_oauth_fields.sql`

#### OAuth設定
- Passport.jsを使用したOAuth認証
- 各プロバイダー用のコールバックルート
- 自動的なユーザー作成とアカウント連携

#### 必要なパッケージ
```bash
npm install passport-google-oauth20 passport-facebook passport-twitter
npm install --save-dev @types/passport-google-oauth20 @types/passport-facebook @types/passport-twitter
```

### フロントエンド

#### 使用ライブラリ
- `expo-auth-session`: OAuth認証フロー
- `expo-web-browser`: ブラウザベースの認証

#### 新しいファイル
- `hooks/useOAuth.ts`: OAuth認証用のカスタムフック
- Updated `contexts/AuthContext.tsx`: OAuth認証メソッドの追加

#### UI更新
- LoginScreen: SNSボタンの機能実装
- RegisterScreen: SNS登録オプションの追加

## セットアップ手順

### 1. OAuth認証情報の設定

各プロバイダーの開発者コンソールでOAuthアプリを作成し、認証情報を取得してください：

#### Google
- [Google Cloud Console](https://console.cloud.google.com/)
- クライアントIDとシークレットを取得

#### Facebook
- [Facebook Developers](https://developers.facebook.com/)
- アプリIDとシークレットを取得

#### Twitter
- [Twitter Developer Portal](https://developer.twitter.com/)
- コンシューマーキーとシークレットを取得

### 2. 環境変数の設定

バックエンドの環境変数（Replit Secretsまたは.envファイル）に以下を追加：

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
TWITTER_CONSUMER_KEY=your_twitter_consumer_key
TWITTER_CONSUMER_SECRET=your_twitter_consumer_secret
OAUTH_CALLBACK_URL=https://your-domain.replit.app
```

### 3. データベースマイグレーションの実行

```bash
cd backend
psql -d your_database < migrations/0004_add_oauth_fields.sql
```

### 4. バックエンドサーバーの再起動

環境変数を設定したら、バックエンドサーバーを再起動してください。

### 5. テスト

1. アプリを開く
2. ログイン画面に移動
3. SNSボタン（Google、Facebook、Twitter）をタップ
4. OAuth認証フローを完了
5. アプリにリダイレクトされることを確認
6. ログインできることを確認

## 既知の制限事項

### Instagram
- Instagram Basic Display APIは複雑な設定が必要
- 現在はボタンが無効化されており、「実装されていません」というメッセージが表示される
- 完全な実装にはInstagram Basic Display APIの追加設定が必要

### セキュリティ
- OAuth コールバックルートにレート制限が実装されていない（推奨される改善点）
- CSRFプロテクション（stateパラメータの検証）が実装されていない

詳細は `SECURITY_SUMMARY_SNS_LOGIN.md` を参照してください。

## ドキュメント

- **OAUTH_SETUP.md**: OAuth プロバイダーの設定ガイド
- **SNS_LOGIN_IMPLEMENTATION_GUIDE.md**: 実装とテストの包括的なガイド（英語）
- **SECURITY_SUMMARY_SNS_LOGIN.md**: セキュリティ分析と推奨事項（英語）

## トラブルシューティング

### SNSボタンが反応しない
- 環境変数が正しく設定されているか確認
- バックエンドサーバーが起動しているか確認
- ブラウザコンソールでエラーを確認

### リダイレクトが機能しない
- app.jsonのディープリンクスキームが正しいか確認
- OAuthプロバイダーのコールバックURLが正しいか確認
- バックエンドのOAUTH_CALLBACK_URLが正しいか確認

### Instagramが動作しない
- Instagramは現在実装されていません
- 完全な実装にはInstagram Basic Display APIの追加設定が必要です

## 次のステップ

1. 各プロバイダーのOAuth認証情報を設定
2. 認証フローを徹底的にテスト
3. 本番環境へのデプロイ前にレート制限とCSRFプロテクションを追加（推奨）
4. Instagram Basic Display APIの実装を検討

## サポート

質問や問題がある場合：
1. OAUTH_SETUP.mdファイルを確認
2. バックエンドログでOAuthエラーを確認
3. 各プロバイダーのデバッグツールでテスト
4. コールバックURLが完全に一致することを確認

## 参考資料

- [Google OAuth ドキュメント](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login ドキュメント](https://developers.facebook.com/docs/facebook-login)
- [Twitter OAuth ドキュメント](https://developer.twitter.com/en/docs/authentication/oauth-1-0a)
- [Expo AuthSession ドキュメント](https://docs.expo.dev/versions/latest/sdk/auth-session/)
