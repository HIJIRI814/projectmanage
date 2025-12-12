# Nuxt App

Nuxt 3 + Prisma + PostgreSQL を使用した認証機能付きアプリケーション

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Dockerでデータベースを起動

```bash
docker-compose up -d
```

### 3. データベースマイグレーション

```bash
npm run db:migrate
```

### 4. テストユーザーの作成（オプション）

```bash
npm run db:seed
```

テストユーザー情報:
- メールアドレス: `test@example.com`
- パスワード: `password123`

### 5. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは `http://localhost:3000` で起動します。

## 使用方法

1. ブラウザで `http://localhost:3000/login` にアクセス
2. テストユーザーのメールアドレスとパスワードでログイン
3. ログイン成功後、ダッシュボードに遷移します

## プロジェクト構造

このプロジェクトはDDD（ドメイン駆動設計）の構造に従っています：

```
domain/          # ドメイン層（ビジネスロジック）
application/     # アプリケーション層（ユースケース）
infrastructure/  # インフラストラクチャ層（技術的実装）
server/api/      # APIエンドポイント
composables/     # 再利用可能なロジック
stores/          # Piniaストア（内部実装）
pages/           # ページコンポーネント
```

## スクリプト

- `npm run dev` - 開発サーバーを起動
- `npm run build` - プロダクションビルド
- `npm run db:migrate` - データベースマイグレーション
- `npm run db:generate` - Prismaクライアントを生成
- `npm run db:studio` - Prisma Studioを起動
- `npm run db:seed` - テストデータをシード

## 環境変数

`.env`ファイルに以下の環境変数を設定してください：

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nuxt_app?schema=public"
JWT_ACCESS_SECRET="your-access-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
```

## 技術スタック

- **Nuxt 3** - Vue.jsフレームワーク
- **Prisma** - ORM
- **PostgreSQL** - データベース
- **Pinia** - 状態管理
- **JWT** - 認証トークン
- **bcrypt** - パスワードハッシュ化
- **zod** - バリデーション
