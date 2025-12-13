# ドメイン層の詳細

## 概要

ドメイン層は、アプリケーションのビジネスロジックの核心を表現するレイヤーです。このレイヤーは、フレームワークや技術的な詳細から完全に独立しており、純粋なビジネスロジックのみを含みます。

## ディレクトリ構造

```
domain/
├── user/
│   ├── model/
│   │   ├── User.ts                    # ユーザーエンティティ
│   │   ├── Email.ts                   # メールアドレス値オブジェクト
│   │   ├── PasswordHash.ts            # パスワードハッシュ値オブジェクト
│   │   ├── UserType.ts                # ユーザータイプ値オブジェクト
│   │   ├── IUserRepository.ts         # ユーザーリポジトリインターフェース
│   │   └── *.test.ts                  # テストファイル
│   └── service/
│       ├── AuthDomainService.ts       # 認証ドメインサービス
│       └── *.test.ts
└── project/
    └── model/
        ├── Project.ts                 # プロジェクトエンティティ
        ├── IProjectRepository.ts      # プロジェクトリポジトリインターフェース
        └── *.test.ts
```

## エンティティ

### User（ユーザーエンティティ）

**ファイル**: `domain/user/model/User.ts`

ユーザーを表現するエンティティです。ビジネスロジックと不変性を保証します。

#### 主な特徴

- **不変性**: コンストラクタはprivateで、ファクトリメソッド経由でのみ作成可能
- **値オブジェクトの使用**: Email、PasswordHash、UserTypeValueを使用
- **ビジネスロジック**: パスワード検証、管理者チェックなどのメソッド

#### 主要メソッド

```typescript
// 新規ユーザーの作成（パスワードをハッシュ化）
static async create(
  id: string,
  email: Email,
  plainPassword: string,
  name: string,
  userType: UserType = UserType.CUSTOMER
): Promise<User>

// 既存データからの再構築（DBから取得したデータをエンティティに変換）
static reconstruct(
  id: string,
  email: string,
  hashedPassword: string,
  name: string,
  userType: number,
  createdAt: Date,
  updatedAt: Date
): User

// パスワード検証
async verifyPassword(plainPassword: string): Promise<boolean>

// 管理者チェック
isAdministrator(): boolean
```

#### 使用例

```typescript
// 新規ユーザーの作成
const email = new Email('user@example.com');
const user = await User.create(
  uuidv4(),
  email,
  'password123',
  'John Doe',
  UserType.CUSTOMER
);

// パスワード検証
const isValid = await user.verifyPassword('password123');

// 管理者チェック
if (user.isAdministrator()) {
  // 管理者向けの処理
}
```

### Project（プロジェクトエンティティ）

**ファイル**: `domain/project/model/Project.ts`

プロジェクトを表現するエンティティです。

#### 主な特徴

- **シンプルな構造**: 名前、説明、タイムスタンプのみ
- **不変性**: コンストラクタはprivate

#### 主要メソッド

```typescript
// 新規プロジェクトの作成
static create(
  id: string,
  name: string,
  description: string | null = null
): Project

// 既存データからの再構築
static reconstruct(
  id: string,
  name: string,
  description: string | null,
  createdAt: Date,
  updatedAt: Date
): Project
```

## 値オブジェクト（Value Objects）

値オブジェクトは、識別子を持たず、値そのもので識別される不変オブジェクトです。

### Email（メールアドレス値オブジェクト）

**ファイル**: `domain/user/model/Email.ts`

メールアドレスを表現する値オブジェクトです。

#### 主な特徴

- **バリデーション**: コンストラクタでメールアドレスの形式を検証
- **正規化**: 小文字に変換して保存
- **不変性**: 一度作成されたら変更不可

#### 実装

```typescript
export class Email {
  private readonly value: string;

  constructor(email: string) {
    if (!this.isValid(email)) {
      throw new Error('Invalid email format');
    }
    this.value = email.toLowerCase();
  }

  private isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

#### 使用例

```typescript
try {
  const email = new Email('User@Example.com');
  console.log(email.toString()); // 'user@example.com'
} catch (error) {
  // 無効なメールアドレスの場合、エラーがスローされる
}
```

### PasswordHash（パスワードハッシュ値オブジェクト）

**ファイル**: `domain/user/model/PasswordHash.ts`

パスワードのハッシュを表現する値オブジェクトです。

#### 主な特徴

- **セキュリティ**: bcryptを使用したハッシュ化
- **バリデーション**: 最小8文字の制約
- **検証機能**: 平文パスワードとの照合

#### 実装

```typescript
export class PasswordHash {
  private readonly value: string;

  private constructor(hashedPassword: string) {
    this.value = hashedPassword;
  }

  // 平文パスワードからハッシュを作成
  static async create(plainPassword: string): Promise<PasswordHash> {
    if (plainPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    const hashed = await bcrypt.hash(plainPassword, 10);
    return new PasswordHash(hashed);
  }

  // 既存のハッシュから値オブジェクトを作成
  static fromHash(hashedPassword: string): PasswordHash {
    return new PasswordHash(hashedPassword);
  }

  // パスワード検証
  async verify(plainPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, this.value);
  }

  toString(): string {
    return this.value;
  }
}
```

#### 使用例

```typescript
// 新規パスワードのハッシュ化
const passwordHash = await PasswordHash.create('password123');

// 既存のハッシュから値オブジェクトを作成
const existingHash = PasswordHash.fromHash('$2b$10$...');

// パスワード検証
const isValid = await passwordHash.verify('password123');
```

### UserTypeValue（ユーザータイプ値オブジェクト）

**ファイル**: `domain/user/model/UserType.ts`

ユーザーの種類を表現する値オブジェクトです。

#### ユーザータイプの種類

```typescript
export enum UserType {
  ADMINISTRATOR = 1,  // 管理者
  MEMBER = 2,        // メンバー
  PARTNER = 3,       // パートナー
  CUSTOMER = 4,      // 顧客
}
```

#### 主な特徴

- **型安全性**: enumと値オブジェクトの組み合わせ
- **ラベル機能**: 日本語ラベルの取得
- **ビジネスロジック**: 管理者チェックなどのメソッド

#### 実装

```typescript
export class UserTypeValue {
  private readonly value: UserType;

  constructor(value: UserType) {
    if (!Object.values(UserType).includes(value)) {
      throw new Error('Invalid user type');
    }
    this.value = value;
  }

  static fromNumber(value: number): UserTypeValue {
    if (!Object.values(UserType).includes(value as UserType)) {
      throw new Error('Invalid user type');
    }
    return new UserTypeValue(value as UserType);
  }

  toNumber(): number {
    return this.value;
  }

  getLabel(): string {
    return UserTypeLabel[this.value];
  }

  equals(other: UserTypeValue): boolean {
    return this.value === other.value;
  }

  isAdministrator(): boolean {
    return this.value === UserType.ADMINISTRATOR;
  }
}
```

#### 使用例

```typescript
// 値オブジェクトの作成
const userType = new UserTypeValue(UserType.ADMINISTRATOR);
const userTypeFromNumber = UserTypeValue.fromNumber(1);

// ラベルの取得
console.log(userType.getLabel()); // '管理者'

// 管理者チェック
if (userType.isAdministrator()) {
  // 管理者向けの処理
}
```

## リポジトリインターフェース

リポジトリインターフェースは、永続化の抽象化を提供します。実装はインフラストラクチャ層にあります。

### IUserRepository

**ファイル**: `domain/user/model/IUserRepository.ts`

ユーザーの永続化を抽象化するインターフェースです。

#### メソッド

```typescript
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findAll(): Promise<User[]>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}
```

#### 特徴

- **ドメインオブジェクトの使用**: Email値オブジェクトを引数として受け取る
- **エンティティの返却**: Userエンティティを返す
- **非同期**: すべてのメソッドが非同期

### IProjectRepository

**ファイル**: `domain/project/model/IProjectRepository.ts`

プロジェクトの永続化を抽象化するインターフェースです。

#### メソッド

```typescript
export interface IProjectRepository {
  findAll(): Promise<Project[]>;
  findById(id: string): Promise<Project | null>;
  save(project: Project): Promise<Project>;
  delete(id: string): Promise<void>;
}
```

## ドメインサービス

### AuthDomainService（認証ドメインサービス）

**ファイル**: `domain/user/service/AuthDomainService.ts`

認証に関するドメインロジックを提供するサービスです。

#### 主な特徴

- **エンティティに属さないロジック**: 複数のエンティティにまたがるロジック
- **再利用性**: 複数のユースケースで使用可能

#### メソッド

```typescript
export class AuthDomainService {
  // ユーザーの認証
  async authenticateUser(user: User, plainPassword: string): Promise<boolean> {
    return await user.verifyPassword(plainPassword);
  }

  // メールアドレスのバリデーション
  isEmailValid(email: Email): boolean {
    return email.toString().length > 0;
  }
}
```

#### 使用例

```typescript
const authService = new AuthDomainService();
const isAuthenticated = await authService.authenticateUser(user, 'password123');
```

## 設計原則

### 1. 不変性（Immutability）

エンティティと値オブジェクトは、一度作成されたら変更できません。変更が必要な場合は、新しいインスタンスを作成します。

### 2. カプセル化（Encapsulation）

ビジネスロジックはエンティティや値オブジェクト内にカプセル化され、外部から直接アクセスできません。

### 3. 値オブジェクトの使用

プリミティブ型の代わりに値オブジェクトを使用することで、型安全性とビジネスルールの強制を実現します。

### 4. ファクトリメソッド

エンティティの作成は、ファクトリメソッド（`create`、`reconstruct`）を通じて行います。

## テスト

ドメイン層の各コンポーネントには、対応するテストファイル（`.test.ts`）があります。

### テストの例

```typescript
// domain/user/model/Email.test.ts
describe('Email', () => {
  it('should create valid email', () => {
    const email = new Email('test@example.com');
    expect(email.toString()).toBe('test@example.com');
  });

  it('should throw error for invalid email', () => {
    expect(() => new Email('invalid')).toThrow('Invalid email format');
  });
});
```

## ベストプラクティス

1. **値オブジェクトの使用**: プリミティブ型の代わりに値オブジェクトを使用する
2. **不変性の維持**: エンティティと値オブジェクトを不変にする
3. **ビジネスロジックの配置**: ビジネスロジックはエンティティやドメインサービスに配置する
4. **リポジトリインターフェース**: 永続化の詳細はリポジトリインターフェースで抽象化する
5. **テストの記述**: すべてのドメインロジックにテストを記述する

## 関連ドキュメント

- [アーキテクチャ概要](./architecture-overview.md)
- [アプリケーション層の詳細](./application-layer.md)
- [インフラストラクチャ層の詳細](./infrastructure-layer.md)

