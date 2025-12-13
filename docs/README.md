# ドキュメント一覧

このディレクトリには、Nuxtアプリケーションの実装詳細を説明するドキュメントが含まれています。

## 📚 ドキュメント一覧

### 1. [アーキテクチャ概要](./architecture-overview.md)

アプリケーション全体のアーキテクチャとレイヤー構成について説明します。

- レイヤードアーキテクチャの概要
- 各レイヤーの責務
- データフロー
- 依存関係の方向
- 技術スタック

### 2. [ドメイン層の詳細](./domain-layer.md)

ドメイン層の実装詳細について説明します。

- エンティティ（User, Project）
- 値オブジェクト（Email, PasswordHash, UserTypeValue）
- リポジトリインターフェース
- ドメインサービス
- 設計原則とベストプラクティス

### 3. [アプリケーション層の詳細](./application-layer.md)

アプリケーション層の実装詳細について説明します。

- ユースケース（LoginUser, CreateProject, etc.）
- DTO（Data Transfer Object）
- エラーハンドリング
- テスト戦略

### 4. [インフラストラクチャ層の詳細](./infrastructure-layer.md)

インフラストラクチャ層の実装詳細について説明します。

- リポジトリ実装（UserRepositoryImpl, ProjectRepositoryImpl）
- 外部サービス（JwtService）
- Prismaクライアント
- データベーススキーマ

### 5. [API層の詳細](./api-layer.md)

APIエンドポイントの実装詳細について説明します。

- 認証API（/api/auth/login, /api/auth/me）
- プロジェクトAPI（/api/projects）
- ユーザー管理API（/api/manage/users）
- バリデーション
- エラーハンドリング

### 6. [認証・認可の詳細](./authentication-authorization.md)

認証・認可システムの実装詳細について説明します。

- JWTトークンの生成と検証
- 認証フロー
- 認可の実装
- ミドルウェア
- セキュリティの考慮事項

### 7. [フロントエンド層の詳細](./frontend-layer.md)

フロントエンド層の実装詳細について説明します。

- ページコンポーネント
- コンポーザブル（useAuth）
- Piniaストア
- ミドルウェア
- 状態管理のアーキテクチャ

## 🚀 クイックスタート

### 新しく参加した開発者向け

1. [アーキテクチャ概要](./architecture-overview.md)を読んで、全体像を把握
2. [ドメイン層の詳細](./domain-layer.md)を読んで、ビジネスロジックを理解
3. 実装する機能に応じて、該当するレイヤーのドキュメントを参照

### 機能追加時

1. ドメイン層: エンティティや値オブジェクトの追加
2. アプリケーション層: ユースケースとDTOの追加
3. インフラストラクチャ層: リポジトリ実装の追加
4. API層: エンドポイントの追加
5. フロントエンド層: ページコンポーネントの追加

## 📖 ドキュメントの読み方

### レイヤーごとに理解する

```
1. ドメイン層（ビジネスロジック）
   ↓
2. アプリケーション層（ユースケース）
   ↓
3. インフラストラクチャ層（技術的実装）
   ↓
4. API層（HTTPエンドポイント）
   ↓
5. フロントエンド層（UI）
```

### 機能ごとに理解する

例: 認証機能を理解する場合

1. [認証・認可の詳細](./authentication-authorization.md) - 全体像
2. [ドメイン層の詳細](./domain-layer.md) - Userエンティティ、Email値オブジェクト
3. [アプリケーション層の詳細](./application-layer.md) - LoginUserユースケース
4. [インフラストラクチャ層の詳細](./infrastructure-layer.md) - JwtService、UserRepositoryImpl
5. [API層の詳細](./api-layer.md) - /api/auth/loginエンドポイント
6. [フロントエンド層の詳細](./frontend-layer.md) - useAuthコンポーザブル、ログインページ

## 🔍 用語集

### エンティティ（Entity）

識別子を持ち、ライフサイクルを通じて一貫性を保つドメインオブジェクト。

例: `User`, `Project`

### 値オブジェクト（Value Object）

識別子を持たず、値そのもので識別される不変オブジェクト。

例: `Email`, `PasswordHash`, `UserTypeValue`

### リポジトリ（Repository）

エンティティの永続化を抽象化するインターフェース。

例: `IUserRepository`, `IProjectRepository`

### ユースケース（Use Case）

アプリケーションの具体的な操作を表現するクラス。

例: `LoginUser`, `CreateProject`

### DTO（Data Transfer Object）

レイヤー間でデータを転送するためのオブジェクト。

例: `LoginInput`, `AuthResult`, `ProjectOutput`

## 📝 ドキュメントの更新

ドキュメントは、コードの変更に合わせて定期的に更新してください。

### 更新が必要な場合

- 新しい機能を追加したとき
- 既存の機能を変更したとき
- アーキテクチャを変更したとき
- 設計原則を変更したとき

## 🤝 貢献

ドキュメントの改善提案や誤りの指摘は、IssueまたはPull Requestでお願いします。

## 📚 関連リソース

- [Nuxt 3 公式ドキュメント](https://nuxt.com/)
- [Prisma 公式ドキュメント](https://www.prisma.io/docs)
- [Pinia 公式ドキュメント](https://pinia.vuejs.org/)
- [ドメイン駆動設計（DDD）](https://ja.wikipedia.org/wiki/%E3%83%89%E3%83%A1%E3%82%A4%E3%83%B3%E9%A7%86%E5%8B%95%E8%A8%AD%E8%A8%88)

