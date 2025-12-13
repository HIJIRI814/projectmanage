# アプリケーション層の詳細

## 概要

アプリケーション層は、ユースケースの実装とアプリケーションの調整を担当するレイヤーです。ドメイン層のオブジェクトを組み合わせて、具体的なビジネスシナリオを実現します。

## ディレクトリ構造

```
application/
├── auth/
│   ├── useCases/
│   │   ├── LoginUser.ts              # ログインユースケース
│   │   └── LoginUser.test.ts
│   └── dto/
│       ├── LoginInput.ts             # ログイン入力DTO
│       └── AuthResult.ts              # 認証結果DTO
├── user/
│   ├── useCases/
│   │   ├── CreateUser.ts              # ユーザー作成ユースケース
│   │   ├── UpdateUser.ts              # ユーザー更新ユースケース
│   │   ├── DeleteUser.ts              # ユーザー削除ユースケース
│   │   ├── ListUsers.ts               # ユーザー一覧取得ユースケース
│   │   └── *.test.ts
│   └── dto/
│       ├── CreateUserInput.ts         # ユーザー作成入力DTO
│       ├── UpdateUserInput.ts          # ユーザー更新入力DTO
│       └── UserOutput.ts               # ユーザー出力DTO
└── project/
    ├── useCases/
    │   ├── CreateProject.ts            # プロジェクト作成ユースケース
    │   ├── UpdateProject.ts            # プロジェクト更新ユースケース
    │   ├── DeleteProject.ts            # プロジェクト削除ユースケース
    │   ├── ListProjects.ts            # プロジェクト一覧取得ユースケース
    │   └── *.test.ts
    └── dto/
        ├── CreateProjectInput.ts       # プロジェクト作成入力DTO
        ├── UpdateProjectInput.ts       # プロジェクト更新入力DTO
        └── ProjectOutput.ts            # プロジェクト出力DTO
```

## ユースケース（Use Cases）

ユースケースは、アプリケーションの具体的な操作を表現するクラスです。各ユースケースは単一の責務を持ち、明確な入力と出力を持ちます。

### 認証ユースケース

#### LoginUser（ログインユースケース）

**ファイル**: `application/auth/useCases/LoginUser.ts`

ユーザーのログイン処理を実装するユースケースです。

##### 依存関係

- `IUserRepository`: ユーザーの検索
- `AuthDomainService`: 認証ロジック
- `JwtService`: トークン生成

##### 実装

```typescript
export class LoginUser {
  constructor(
    private userRepository: IUserRepository,
    private authDomainService: AuthDomainService,
    private jwtService: JwtService
  ) {}

  async execute(input: LoginInput): Promise<AuthResult> {
    // 1. ドメインオブジェクトの作成
    const email = new Email(input.email);
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // 2. ドメインサービスを使用して認証
    const isAuthenticated = await this.authDomainService.authenticateUser(
      user,
      input.password
    );

    if (!isAuthenticated) {
      throw new Error('Invalid credentials');
    }

    // 3. JWT トークンの発行
    const accessToken = this.jwtService.generateAccessToken(user.id);
    const refreshToken = this.jwtService.generateRefreshToken(user.id);

    // 4. 結果の返却
    return new AuthResult(accessToken, refreshToken, {
      id: user.id,
      email: user.email.toString(),
      name: user.name,
      userType: user.userType.toNumber(),
    });
  }
}
```

##### 処理フロー

1. **入力の検証**: LoginInput DTOからEmail値オブジェクトを作成
2. **ユーザーの検索**: リポジトリからユーザーを取得
3. **認証**: ドメインサービスを使用してパスワードを検証
4. **トークン生成**: JWTサービスでアクセストークンとリフレッシュトークンを生成
5. **結果の返却**: AuthResult DTOを返却

##### エラーハンドリング

- ユーザーが見つからない場合: `Invalid credentials`
- パスワードが一致しない場合: `Invalid credentials`

### ユーザー管理ユースケース

#### CreateUser（ユーザー作成ユースケース）

**ファイル**: `application/user/useCases/CreateUser.ts`

新規ユーザーの作成を実装するユースケースです。

##### 実装

```typescript
export class CreateUser {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: CreateUserInput): Promise<UserOutput> {
    const email = new Email(input.email);
    
    // メールアドレスの重複チェック
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // ユーザーエンティティの作成
    const user = await User.create(
      uuidv4(),
      email,
      input.password,
      input.name,
      input.userType
    );

    // 永続化
    const savedUser = await this.userRepository.save(user);

    // 出力DTOの作成
    return new UserOutput(
      savedUser.id,
      savedUser.email.toString(),
      savedUser.name,
      savedUser.userType.toNumber(),
      savedUser.createdAt,
      savedUser.updatedAt
    );
  }
}
```

##### 処理フロー

1. **重複チェック**: メールアドレスの重複を確認
2. **エンティティの作成**: User.create()でユーザーエンティティを作成
3. **永続化**: リポジトリで保存
4. **出力の作成**: UserOutput DTOを作成して返却

#### UpdateUser（ユーザー更新ユースケース）

**ファイル**: `application/user/useCases/UpdateUser.ts`

既存ユーザーの更新を実装するユースケースです。

##### 処理フロー

1. **ユーザーの取得**: IDでユーザーを検索
2. **更新データの適用**: 入力DTOから更新データを適用
3. **永続化**: リポジトリで保存
4. **出力の作成**: UserOutput DTOを作成して返却

#### DeleteUser（ユーザー削除ユースケース）

**ファイル**: `application/user/useCases/DeleteUser.ts`

ユーザーの削除を実装するユースケースです。

##### 処理フロー

1. **ユーザーの存在確認**: IDでユーザーを検索
2. **削除**: リポジトリで削除

#### ListUsers（ユーザー一覧取得ユースケース）

**ファイル**: `application/user/useCases/ListUsers.ts`

ユーザー一覧の取得を実装するユースケースです。

##### 処理フロー

1. **一覧取得**: リポジトリからすべてのユーザーを取得
2. **出力DTOの変換**: 各ユーザーをUserOutput DTOに変換

### プロジェクト管理ユースケース

#### CreateProject（プロジェクト作成ユースケース）

**ファイル**: `application/project/useCases/CreateProject.ts`

新規プロジェクトの作成を実装するユースケースです。

##### 実装

```typescript
export class CreateProject {
  constructor(private projectRepository: IProjectRepository) {}

  async execute(input: CreateProjectInput): Promise<ProjectOutput> {
    const project = Project.create(
      uuidv4(),
      input.name,
      input.description || null
    );

    const savedProject = await this.projectRepository.save(project);

    return new ProjectOutput(
      savedProject.id,
      savedProject.name,
      savedProject.description,
      savedProject.createdAt,
      savedProject.updatedAt
    );
  }
}
```

##### 処理フロー

1. **エンティティの作成**: Project.create()でプロジェクトエンティティを作成
2. **永続化**: リポジトリで保存
3. **出力の作成**: ProjectOutput DTOを作成して返却

#### UpdateProject（プロジェクト更新ユースケース）

**ファイル**: `application/project/useCases/UpdateProject.ts`

既存プロジェクトの更新を実装するユースケースです。

#### DeleteProject（プロジェクト削除ユースケース）

**ファイル**: `application/project/useCases/DeleteProject.ts`

プロジェクトの削除を実装するユースケースです。

#### ListProjects（プロジェクト一覧取得ユースケース）

**ファイル**: `application/project/useCases/ListProjects.ts`

プロジェクト一覧の取得を実装するユースケースです。

## DTO（Data Transfer Object）

DTOは、レイヤー間でデータを転送するためのオブジェクトです。ドメインオブジェクトを直接公開せず、必要な情報のみをDTOに変換して返します。

### 認証DTO

#### LoginInput（ログイン入力DTO）

**ファイル**: `application/auth/dto/LoginInput.ts`

ログイン時の入力データを表現するDTOです。

```typescript
export class LoginInput {
  constructor(
    public readonly email: string,
    public readonly password: string
  ) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
  }
}
```

#### AuthResult（認証結果DTO）

**ファイル**: `application/auth/dto/AuthResult.ts`

認証結果を表現するDTOです。

```typescript
export class AuthResult {
  constructor(
    public readonly accessToken: string,
    public readonly refreshToken: string,
    public readonly user: {
      id: string;
      email: string;
      name: string;
      userType: number;
    }
  ) {}
}
```

### ユーザーDTO

#### CreateUserInput（ユーザー作成入力DTO）

**ファイル**: `application/user/dto/CreateUserInput.ts`

新規ユーザー作成時の入力データを表現するDTOです。

#### UpdateUserInput（ユーザー更新入力DTO）

**ファイル**: `application/user/dto/UpdateUserInput.ts`

ユーザー更新時の入力データを表現するDTOです。

#### UserOutput（ユーザー出力DTO）

**ファイル**: `application/user/dto/UserOutput.ts`

ユーザー情報を表現する出力DTOです。

### プロジェクトDTO

#### CreateProjectInput（プロジェクト作成入力DTO）

**ファイル**: `application/project/dto/CreateProjectInput.ts`

新規プロジェクト作成時の入力データを表現するDTOです。

```typescript
export class CreateProjectInput {
  constructor(
    public readonly name: string,
    public readonly description?: string
  ) {}
}
```

#### UpdateProjectInput（プロジェクト更新入力DTO）

**ファイル**: `application/project/dto/UpdateProjectInput.ts`

プロジェクト更新時の入力データを表現するDTOです。

#### ProjectOutput（プロジェクト出力DTO）

**ファイル**: `application/project/dto/ProjectOutput.ts`

プロジェクト情報を表現する出力DTOです。

```typescript
export class ProjectOutput {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}
```

## 設計原則

### 1. 単一責任の原則（SRP）

各ユースケースは、単一の操作のみを担当します。

### 2. 依存性注入（DI）

ユースケースは、コンストラクタで依存関係を受け取ります。これにより、テストが容易になります。

### 3. DTOの使用

ドメインオブジェクトを直接公開せず、DTOを使用して必要な情報のみを返します。

### 4. エラーハンドリング

ユースケース内で適切なエラーハンドリングを行い、明確なエラーメッセージを返します。

## テスト

各ユースケースには、対応するテストファイル（`.test.ts`）があります。

### テストの例

```typescript
// application/auth/useCases/LoginUser.test.ts
describe('LoginUser', () => {
  it('should login successfully with valid credentials', async () => {
    // モックの設定
    const mockUserRepository = {
      findByEmail: jest.fn().mockResolvedValue(mockUser),
    };
    const mockAuthService = {
      authenticateUser: jest.fn().mockResolvedValue(true),
    };
    const mockJwtService = {
      generateAccessToken: jest.fn().mockReturnValue('access-token'),
      generateRefreshToken: jest.fn().mockReturnValue('refresh-token'),
    };

    const useCase = new LoginUser(
      mockUserRepository,
      mockAuthService,
      mockJwtService
    );

    const input = new LoginInput('test@example.com', 'password123');
    const result = await useCase.execute(input);

    expect(result.accessToken).toBe('access-token');
    expect(result.user.email).toBe('test@example.com');
  });
});
```

## ベストプラクティス

1. **単一責任**: 各ユースケースは単一の操作のみを担当する
2. **依存性注入**: コンストラクタで依存関係を受け取る
3. **DTOの使用**: ドメインオブジェクトを直接公開しない
4. **エラーハンドリング**: 適切なエラーメッセージを返す
5. **テストの記述**: すべてのユースケースにテストを記述する

## 関連ドキュメント

- [アーキテクチャ概要](./architecture-overview.md)
- [ドメイン層の詳細](./domain-layer.md)
- [インフラストラクチャ層の詳細](./infrastructure-layer.md)
- [API層の詳細](./api-layer.md)

