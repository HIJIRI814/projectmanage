# Nuxt App

Nuxt 3 + Prisma + PostgreSQL を使用した認証機能付きアプリケーション

プロジェクト・シート管理システムで、会社機能とプロジェクトの可視性制御を実装しています。

## 主な機能

- **認証・認可**: JWT ベースの認証システム
- **会社管理**: 複数の会社を作成・管理可能
- **ユーザー管理**: ユーザーは複数の会社に所属でき、会社ごとに異なる権限（管理者・メンバー・パートナー・顧客）を持つ
- **プロジェクト管理**: プロジェクトの作成・編集・削除
  - **可視性設定**: プライベート・社内公開・公開の3種類
  - **会社連携**: プロジェクトを複数の会社に関連付け可能
- **シート管理**: プロジェクト内でシートを作成・編集
- **シートバージョン管理**: シートのバージョン履歴と復元機能
- **画像管理**: シートに画像をアップロードし、バージョンごとにバックアップ

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

### 4. テストデータの作成（オプション）

```bash
npm run db:seed
```

テストユーザー情報（全員パスワード: `password123`）:
- **管理者ユーザー**: `admin@example.com`
  - 会社1: 管理者権限
  - 会社2: メンバー権限
- **メンバーユーザー**: `member@example.com`
  - 会社1: メンバー権限
- **顧客ユーザー**: `customer@example.com`
  - 会社1: 顧客権限

テストデータには以下のプロジェクトが含まれます:
- **プライベートプロジェクト**: 作成者のみ閲覧可能
- **社内公開プロジェクト**: 同じ会社の管理者・メンバーが閲覧可能
- **公開プロジェクト**: 全てのユーザーが閲覧可能

### 5. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは `http://localhost:3000` で起動します。

## 使用方法

1. ブラウザで `http://localhost:3000/login` にアクセス
2. テストユーザーのメールアドレスとパスワードでログイン
3. ログイン成功後、プロジェクト一覧ページに遷移します

### 権限による機能の違い

- **管理者（ADMINISTRATOR）**: 全ての機能にアクセス可能（会社管理、ユーザー管理、プロジェクト管理）
- **メンバー（MEMBER）**: プロジェクトの作成・編集、社内公開プロジェクトの閲覧・編集が可能
- **パートナー（PARTNER）**: 今後実装予定
- **顧客（CUSTOMER）**: 公開プロジェクトの閲覧のみ可能（今後条件付きで編集可能になる予定）

## プロジェクト構造

このプロジェクトはDDD（ドメイン駆動設計）の構造に従っています：

```
domain/          # ドメイン層（ビジネスロジック）
  ├── company/   # 会社ドメイン
  ├── project/   # プロジェクトドメイン
  ├── sheet/     # シートドメイン
  └── user/      # ユーザードメイン
application/     # アプリケーション層（ユースケース）
  ├── company/   # 会社関連ユースケース
  ├── project/   # プロジェクト関連ユースケース
  ├── sheet/     # シート関連ユースケース
  └── userCompany/ # ユーザー会社関連ユースケース
infrastructure/  # インフラストラクチャ層（技術的実装）
  ├── auth/      # 認証関連
  ├── company/   # 会社リポジトリ実装
  ├── project/   # プロジェクトリポジトリ実装
  ├── sheet/     # シートリポジトリ実装
  └── user/      # ユーザーリポジトリ実装
server/api/      # APIエンドポイント
  ├── auth/      # 認証API
  ├── companies/ # 会社管理API
  ├── projects/  # プロジェクト管理API
  └── manage/    # 管理機能API
composables/     # 再利用可能なロジック
stores/          # Piniaストア（内部実装）
pages/           # ページコンポーネント
  ├── companies/ # 会社管理ページ
  ├── projects/  # プロジェクト管理ページ
  └── manage/    # 管理機能ページ
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
- **Vitest** - テストフレームワーク
- **Playwright** - E2Eテスト

## テスト

### DDDテスト

レイヤーごとにテストを実行:

```bash
# ドメイン層のテスト
npm test domain

# インフラストラクチャ層のテスト
npm test infrastructure

# アプリケーション層のテスト
npm test application

# 全テスト実行
npm test
```

### E2Eテスト

Playwright MCPを使用してE2Eテストを実行できます。

## データモデル

### 主要なエンティティ

- **Company**: 会社
- **User**: ユーザー
- **UserCompany**: ユーザーと会社の関連（会社ごとのユーザータイプを保持）
- **Project**: プロジェクト（可視性: PRIVATE, COMPANY_INTERNAL, PUBLIC）
- **ProjectCompany**: プロジェクトと会社の関連
- **Sheet**: シート
- **SheetVersion**: シートのバージョン履歴

### プロジェクトの可視性

- **PRIVATE**: プロジェクトメンバーのみ閲覧可能
- **COMPANY_INTERNAL**: 関連付けられた会社の管理者・メンバーが閲覧可能
- **PUBLIC**: 全てのユーザーが閲覧可能
