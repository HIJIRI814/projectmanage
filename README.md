# Nuxt App

Nuxt 3 + Prisma + PostgreSQL を使用した認証機能付きアプリケーション

プロジェクト・シート管理システムで、会社機能とプロジェクトの可視性制御を実装しています。

## 主な機能

- **認証・認可**: Supabase Auth ベースの認証システム
- **会社管理**: 複数の会社を作成・管理可能
- **ユーザー管理**: ユーザーは複数の会社に所属でき、会社ごとに異なる権限（管理者・メンバー・パートナー・顧客）を持つ
- **会社間パートナーシップ**: 会社間の連携関係を管理
- **会社招待**: メールアドレスでユーザーを会社に招待（保留中・承認済み・拒否・期限切れのステータス管理）
- **プロジェクト管理**: プロジェクトの作成・編集・削除
  - **可視性設定**: プライベート・社内公開・公開の3種類
  - **会社連携**: プロジェクトを複数の会社に関連付け可能
  - **クライアント会社**: プロジェクトにクライアント会社を指定可能
- **シート管理**: プロジェクト内でシートを作成・編集
- **シートバージョン管理**: シートのバージョン履歴と復元機能
- **画像管理**: シートに画像をアップロードし、バージョンごとにバックアップ
- **マーカーコメント**: シートのマーカーに対してコメントを投稿・表示（1階層のリプライ対応）

## セットアップ

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/)にアクセスしてアカウントを作成
2. 新しいプロジェクトを作成
3. プロジェクト設定から以下を取得：
   - Project URL (`SUPABASE_URL`)
   - Anon key (`SUPABASE_ANON_KEY`)
   - Service role key (`SUPABASE_SERVICE_ROLE_KEY`)
   - Database connection string (`DATABASE_URL`)

### 2. Supabase Storageバケットの作成

1. Supabaseダッシュボードで「Storage」に移動
2. 新しいバケットを作成：
   - バケット名: `sheets`
   - 公開バケット: 有効（読み取りは公開、書き込みは認証済みユーザーのみ）

### 3. 依存関係のインストール

```bash
npm install
```

### 4. 環境変数の設定

`.env`ファイルを作成し、以下の環境変数を設定：

```env
# Database
# ローカル開発用
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nuxt_app?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/nuxt_app?schema=public"

# Supabase (Production) - Vercel等のサーバーレス環境
# DATABASE_URL: 接続プーリング用（Supabaseダッシュボードの「Session mode」から取得）
# DIRECT_URL: 通常の接続（Supabaseダッシュボードの「Transaction mode」から取得、マイグレーション用）
# DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public"
# DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?schema=public"

# Supabase
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

**接続プーリング用の接続文字列の取得方法：**
1. Supabaseダッシュボードにアクセス
2. 「Settings」→「Database」に移動
3. 「Connection string」セクションで以下を取得：
   - **DATABASE_URL**: 「Session mode」を選択 → 「Connection pooling」の接続文字列をコピー
   - **DIRECT_URL**: 「Transaction mode」を選択 → 通常の接続文字列をコピー
4. 両方の接続文字列で`[YOUR-PASSWORD]`を実際のデータベースパスワードに置き換え

### 5. データベースマイグレーション

```bash
npm run db:migrate
```

**注意**: ローカル開発環境では、Docker Composeを使用してPostgreSQLを起動することも可能です。その場合は`.env`の`DATABASE_URL`をローカル接続文字列に変更してください。

### 6. テストデータの作成（オプション）

```bash
npm run db:seed
```

**注意**: シード実行時、既存の全レコードが削除され、新しいテストデータが作成されます。

#### テスト会社（4社）

- **株式会社テック** (company-1)
- **デザインスタジオ** (company-2)
- **マーケティング代理店** (company-3)
- **クライアント企業** (company-4)

#### テストユーザー情報（全員パスワード: `password123`）

**会社1（株式会社テック）のユーザー:**
- `admin1@tech.com` - テック管理者（管理者権限）
- `member1@tech.com` - テックメンバー1（メンバー権限）
- `member2@tech.com` - テックメンバー2（メンバー権限）
- `customer1@tech.com` - テック顧客1（顧客権限）

**会社2（デザインスタジオ）のユーザー:**
- `admin2@design.com` - デザイン管理者（管理者権限）
- `member3@design.com` - デザインメンバー（メンバー権限）

**会社3（マーケティング代理店）のユーザー:**
- `admin3@marketing.com` - マーケティング管理者（管理者権限）

**会社4（クライアント企業）のユーザー:**
- `customer2@client.com` - クライアントユーザー（顧客権限）

**複数会社所属ユーザー:**
- `multi@example.com` - 複数所属ユーザー
  - 会社1: メンバー権限
  - 会社2: メンバー権限

#### テストプロジェクト（8件）

**プライベートプロジェクト:**
- プライベートプロジェクト1: 単一メンバーのみ
- プライベートプロジェクト2: 複数メンバー

**社内公開プロジェクト:**
- 社内公開プロジェクト1: 会社1の社内公開
- 社内公開プロジェクト2: 会社2の社内公開

**公開プロジェクト:**
- 公開プロジェクト1: 会社1と会社2の共同プロジェクト
- 公開プロジェクト2: 会社1、会社2、会社3の3社共同プロジェクト

**クライアントプロジェクト:**
- クライアントプロジェクト1: 会社4をクライアントに持つプロジェクト
- クライアントプロジェクト2: 会社1が運営、会社4がクライアント

#### 会社間パートナーシップ

- 会社1 ↔ 会社2
- 会社1 ↔ 会社3

#### 会社招待（様々なステータス）

- `pending@example.com` - 保留中（会社1）
- `accepted@example.com` - 承認済み（会社1）
- `rejected@example.com` - 拒否（会社2）
- `expired@example.com` - 期限切れ（会社3）

### 7. 開発サーバーの起動

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

## 開発ルール

### ドキュメント更新の必須性

**機能を実装・改修した際は、必ず以下のドキュメントを更新すること：**

1. **`specs/`ディレクトリ内の該当仕様書**
   - 新機能追加時: 該当する仕様書に機能を追加
   - 既存機能改修時: 該当する仕様書の内容を更新

2. **`README.md`**
   - 主な機能セクションに新機能を追加
   - データモデルセクションに新エンティティを追加（データベース変更時）
   - プロジェクト構造セクションを更新（新ディレクトリ追加時）

詳細は`.cursor/rules/specs.mdc`ファイルを参照してください。

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
# Database
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres?schema=public"

# Supabase
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### ローカル開発環境

ローカル開発環境でDocker Composeを使用する場合：

```bash
docker-compose up -d
```

その後、`.env`の`DATABASE_URL`をローカル接続文字列に変更：

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nuxt_app?schema=public"
```

## 技術スタック

- **Nuxt 3** - Vue.jsフレームワーク
- **Prisma** - ORM
- **PostgreSQL** - データベース（Supabase）
- **Supabase Auth** - 認証システム
- **Supabase Storage** - ファイルストレージ
- **Pinia** - 状態管理
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
- **CompanyPartnership**: 会社間のパートナーシップ関係
- **CompanyInvitation**: 会社への招待（ステータス: PENDING, ACCEPTED, REJECTED, EXPIRED）
- **Project**: プロジェクト（可視性: PRIVATE, COMPANY_INTERNAL, PUBLIC）
- **ProjectMember**: プロジェクトメンバー
- **ProjectCompany**: プロジェクトと会社の関連（プロジェクトを運営する会社）
- **ProjectClient**: プロジェクトとクライアント会社の関連
- **Sheet**: シート
- **SheetVersion**: シートのバージョン履歴
- **SheetMarker**: シートのマーカー（番号/四角タイプ）
- **SheetMarkerComment**: マーカーへのコメント（リプライ対応、1階層まで）

### プロジェクトの可視性

- **PRIVATE**: プロジェクトメンバーのみ閲覧可能
- **COMPANY_INTERNAL**: 関連付けられた会社の管理者・メンバーが閲覧可能
- **PUBLIC**: 全てのユーザーが閲覧可能

## デプロイ

### Vercelへのデプロイ

1. [Vercel](https://vercel.com/)にアクセスしてアカウントを作成
2. GitHubリポジトリをVercelに接続
3. プロジェクト設定で以下を確認：
   - Framework Preset: `Nuxt.js`
   - Build Command: `npm run build`
   - Output Directory: `.output`
4. 環境変数を設定：
   - `DATABASE_URL`: Supabaseの接続プーリング用PostgreSQL接続文字列（Session mode推奨）
     - Supabaseダッシュボードの「Settings」→「Database」→「Connection string」→「Session mode」から取得
     - 接続プーリング用の接続文字列をそのまま使用（Supabaseダッシュボードから直接コピー推奨）
   - `DIRECT_URL`: Supabaseの通常接続用PostgreSQL接続文字列（Transaction mode）
     - Supabaseダッシュボードの「Settings」→「Database」→「Connection string」→「Transaction mode」から取得
     - マイグレーション実行時に使用（Prismaの`directUrl`として使用）
   - `SUPABASE_URL`: SupabaseプロジェクトURL
   - `SUPABASE_ANON_KEY`: Supabase Anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service role key
   - `JWT_ACCESS_SECRET`: JWTアクセストークンのシークレット（32文字以上のランダム文字列）
   - `JWT_REFRESH_SECRET`: JWTリフレッシュトークンのシークレット（32文字以上のランダム文字列）
5. デプロイを実行

### 注意事項

- Supabase Storageバケット`sheets`が作成されていることを確認
- 環境変数が正しく設定されていることを確認
- データベースマイグレーションはSupabaseのSQL Editorから実行するか、Vercelのビルド時に実行するように設定
