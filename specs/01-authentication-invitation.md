# 認証・招待系ページ仕様書

## 概要

認証と招待機能に関するページの機能仕様を記載します。

---

## 1. トップページ (`/`)

### 基本情報

- **ページパス**: `/`
- **ファイル**: `pages/index.vue`
- **ミドルウェア**: なし（自動リダイレクト）

### 主要機能

- ログインページへの自動リダイレクト

### 処理フロー

```mermaid
flowchart LR
    Start([ページアクセス]) --> Mount["onMounted実行"]
    Mount --> Redirect["navigateTo('/login')"]
    Redirect --> End([ログインページへ遷移])
    
    style Start fill:#e1f5ff
    style End fill:#c8e6c9
    style Mount fill:#fff3e0
    style Redirect fill:#f3e5f5
```

### 実装詳細

- クライアントサイドでのみリダイレクト処理を実行
- `onMounted`フック内で`navigateTo('/login')`を呼び出し
- リダイレクト中は「リダイレクト中...」というメッセージを表示

---

## 2. ログインページ (`/login`)

### 基本情報

- **ページパス**: `/login`
- **ファイル**: `pages/login.vue`
- **ミドルウェア**: `guest`（未認証ユーザーのみアクセス可能）
- **レイアウト**: `AuthLayout`

### 主要機能

- メールアドレスとパスワードによるログイン
- エラーメッセージの表示
- サインアップページへのリンク
- リダイレクト先の指定（`redirect`クエリパラメータ）

### 処理フロー

```mermaid
flowchart TD
    Start([ページ表示]) --> Input["フォーム入力<br/>email/password"]
    Input --> Click["ログインボタン<br/>クリック"]
    Click --> API["POST /api/auth/login"]
    API --> Check{"認証成功?"}
    
    Check -->|"成功"| SaveToken["トークン保存<br/>accessToken/refreshToken"]
    SaveToken --> SaveUser["ユーザー情報保存<br/>useAuth.setUser"]
    SaveUser --> SaveCookie["クッキーに保存<br/>accessToken"]
    SaveCookie --> CheckRedirect{"リダイレクト先<br/>指定あり?"}
    CheckRedirect -->|"あり"| RedirectCustom["指定先へ遷移<br/>query.redirect"]
    CheckRedirect -->|"なし"| RedirectDefault["/projectsへ遷移"]
    
    Check -->|"失敗"| Error["エラーメッセージ表示<br/>401以外のエラー"]
    
    style Start fill:#e1f5ff
    style RedirectCustom fill:#c8e6c9
    style RedirectDefault fill:#c8e6c9
    style Error fill:#ffcdd2
    style Check fill:#fff9c4
    style CheckRedirect fill:#fff9c4
    style API fill:#e1bee7
    style SaveToken fill:#dcedc8
    style SaveUser fill:#dcedc8
    style SaveCookie fill:#dcedc8
```

### API呼び出し

#### POST /api/auth/login

**リクエスト**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス**:
```json
{
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "ユーザー名"
  }
}
```

### 権限・アクセス制御

- 未認証ユーザーのみアクセス可能（`guest`ミドルウェア）
- 認証済みユーザーがアクセスした場合は自動的にリダイレクト

### UI要素

- **フォーム項目**:
  - メールアドレス（必須、email型）
  - パスワード（必須、password型）
- **ボタン**: ログインボタン（ローディング中は無効化）
- **エラーハンドリング**: エラー時は赤背景でメッセージを表示
- **リンク**: サインアップページへのリンク

### エラーハンドリング

- 401エラーの場合はエラーメッセージを表示しない（ミドルウェアでリダイレクトされるため）
- その他のエラーはエラーメッセージを表示

---

## 3. サインアップページ (`/signup`)

### 基本情報

- **ページパス**: `/signup`
- **ファイル**: `pages/signup.vue`
- **ミドルウェア**: `guest`（未認証ユーザーのみアクセス可能）
- **レイアウト**: `AuthLayout`

### 主要機能

- 新規ユーザー登録
- メールアドレス、名前、パスワードの入力
- ログインページへのリンク

### 処理フロー

```mermaid
flowchart TD
    Start([ページ表示]) --> Input["フォーム入力<br/>email/name/password"]
    Input --> Click["登録ボタン<br/>クリック"]
    Click --> Signup["POST /api/auth/signup<br/>Cookieにトークン設定"]
    Signup --> Check{"登録成功?"}
    
    Check -->|"成功"| GetUser["GET /api/auth/me<br/>ユーザー情報取得"]
    GetUser --> SaveUser["ユーザー情報保存<br/>useAuth.setUser"]
    SaveUser --> Redirect["/projectsへ遷移"]
    
    Check -->|"失敗"| Error["エラーメッセージ表示<br/>401以外のエラー"]
    
    style Start fill:#e1f5ff
    style Redirect fill:#c8e6c9
    style Error fill:#ffcdd2
    style Check fill:#fff9c4
    style Signup fill:#e1bee7
    style GetUser fill:#e1bee7
    style SaveUser fill:#dcedc8
```

### API呼び出し

#### POST /api/auth/signup

**リクエスト**:
```json
{
  "email": "user@example.com",
  "name": "ユーザー名",
  "password": "password123"
}
```

**レスポンス**: 成功時、Cookieにトークンが設定される

#### GET /api/auth/me

**レスポンス**:
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "name": "ユーザー名"
}
```

### 権限・アクセス制御

- 未認証ユーザーのみアクセス可能（`guest`ミドルウェア）

### UI要素

- **フォーム項目**:
  - メールアドレス（必須、email型）
  - 名前（必須、text型）
  - パスワード（必須、password型、8文字以上）
- **ボタン**: 登録ボタン（ローディング中は無効化）
- **エラーハンドリング**: エラー時は赤背景でメッセージを表示
- **リンク**: ログインページへのリンク

### エラーハンドリング

- 401エラーの場合はエラーメッセージを表示しない
- その他のエラーはエラーメッセージを表示

---

## 4. ダッシュボード (`/dashboard`)

### 基本情報

- **ページパス**: `/dashboard`
- **ファイル**: `pages/dashboard.vue`
- **ミドルウェア**: `auth`（認証必須）
- **レイアウト**: `DashboardLayout`

### 主要機能

- ユーザー情報の表示
- クイックアクション（プロジェクト一覧へのリンク、ログアウト）

### 処理フロー

```mermaid
flowchart TD
    Start([ページ表示]) --> Auth["認証チェック<br/>auth middleware"]
    Auth --> GetUser["ユーザー情報取得<br/>useAuth.user"]
    GetUser --> Display["ユーザー情報表示<br/>ID/email/name"]
    Display --> Action{"アクション選択"}
    
    Action -->|"プロジェクト一覧"| Projects["/projectsへ遷移"]
    Action -->|"ログアウト"| Logout["logout実行<br/>useAuth.logout"]
    Logout --> Login["/loginへ遷移"]
    
    style Start fill:#e1f5ff
    style Projects fill:#c8e6c9
    style Login fill:#c8e6c9
    style Auth fill:#fff9c4
    style GetUser fill:#dcedc8
    style Display fill:#dcedc8
    style Action fill:#fff9c4
    style Logout fill:#ffccbc
```

### API呼び出し

- ユーザー情報は`useAuth()` composableから取得（既に認証時に取得済み）

### 権限・アクセス制御

- 認証済みユーザーのみアクセス可能（`auth`ミドルウェア）

### UI要素

- **カード**: ユーザー情報カード（ID、メールアドレス、名前）
- **クイックアクションカード**:
  - プロジェクト一覧へのリンクボタン
  - ログアウトボタン（削除スタイル）

### エラーハンドリング

- 認証エラーの場合は自動的にログインページへリダイレクト

---

## 5. 招待承認ページ (`/invitations/[token]`)

### 基本情報

- **ページパス**: `/invitations/:token`
- **ファイル**: `pages/invitations/[token].vue`
- **ミドルウェア**: なし（認証不要だが、承認には認証が必要）
- **レイアウト**: `AuthLayout`

### 主要機能

- 招待情報の表示
- 招待の承認
- 招待ステータスの確認（保留中、承認済み、期限切れなど）
- 未認証ユーザーへのログイン案内

### 処理フロー

```mermaid
flowchart TD
    Start([ページ表示]) --> GetInv["GET /api/invitations/:token"]
    GetInv --> CheckFetch{"招待情報取得<br/>成功?"}
    
    CheckFetch -->|"失敗"| ErrorFetch["エラーメッセージ表示"]
    CheckFetch -->|"成功"| Display["招待情報表示<br/>会社名/email/種別/ステータス"]
    
    Display --> CheckAuth{"認証済み?"}
    
    CheckAuth -->|"未認証"| ShowLogin["ログイン案内表示<br/>ログインボタン"]
    CheckAuth -->|"認証済み"| CheckStatus{"ステータス確認"}
    
    CheckStatus -->|"保留中かつ有効期限内"| ShowAccept["承認ボタン表示"]
    CheckStatus -->|"承認済み"| ShowAccepted["承認済みメッセージ"]
    CheckStatus -->|"期限切れ"| ShowExpired["期限切れメッセージ"]
    
    ShowAccept --> ClickAccept["承認ボタン<br/>クリック"]
    ClickAccept --> Accept["POST /api/invitations/:token/accept"]
    Accept --> CheckAccept{"承認成功?"}
    
    CheckAccept -->|"成功"| Redirect["/projectsへ遷移"]
    CheckAccept -->|"失敗"| ErrorAccept["エラーメッセージ表示"]
    
    style Start fill:#e1f5ff
    style Redirect fill:#c8e6c9
    style ErrorFetch fill:#ffcdd2
    style ErrorAccept fill:#ffcdd2
    style CheckFetch fill:#fff9c4
    style CheckAuth fill:#fff9c4
    style CheckStatus fill:#fff9c4
    style CheckAccept fill:#fff9c4
    style GetInv fill:#e1bee7
    style Accept fill:#e1bee7
    style Display fill:#dcedc8
    style ShowAccept fill:#c5e1a5
    style ShowAccepted fill:#fff9c4
    style ShowExpired fill:#ffccbc
    style ShowLogin fill:#b3e5fc
```

### API呼び出し

#### GET /api/invitations/:token

**レスポンス**:
```json
{
  "id": "invitation_id",
  "email": "user@example.com",
  "companyName": "会社名",
  "userType": 1,
  "status": "PENDING",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

#### POST /api/invitations/:token/accept

**レスポンス**: 成功時、会社への所属が作成される

### 権限・アクセス制御

- ページ自体は認証不要でアクセス可能
- 招待の承認には認証が必要
- 未認証ユーザーはログインページへのリンクが表示される

### UI要素

- **招待情報カード**:
  - 会社名
  - メールアドレス
  - ユーザー種別（バッジ表示）
  - ステータス（バッジ表示）
  - 有効期限
- **ボタン**:
  - ログインボタン（未認証時）
  - 承認ボタン（保留中かつ有効期限内の場合）
- **メッセージ**:
  - 承認済みメッセージ
  - 期限切れメッセージ
  - エラーメッセージ

### エラーハンドリング

- 招待情報取得失敗時はエラーメッセージを表示
- 承認失敗時はエラーメッセージを表示

### ユーザー種別とステータス

**ユーザー種別**:
- 1: 管理者（defaultバッジ）
- 2: メンバー（secondaryバッジ）
- 3: パートナー（outlineバッジ）
- 4: 顧客（outlineバッジ）

**ステータス**:
- PENDING: 保留中（defaultバッジ）
- ACCEPTED: 承認済み（secondaryバッジ）
- REJECTED: 拒否済み（destructiveバッジ）
- EXPIRED: 期限切れ（outlineバッジ）

