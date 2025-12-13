# インフラストラクチャ層の詳細

## 概要

インフラストラクチャ層は、技術的な実装の詳細を担当するレイヤーです。ドメイン層で定義されたインターフェースを実装し、データベースアクセスや外部サービスとの連携を行います。

## ディレクトリ構造

```
infrastructure/
├── auth/
│   ├── jwtService.ts                  # JWTサービス実装
│   ├── jwtService.test.ts
│   ├── userRepositoryImpl.ts          # ユーザーリポジトリ実装
│   └── userRepositoryImpl.test.ts
├── project/
│   ├── projectRepositoryImpl.ts       # プロジェクトリポジトリ実装
│   └── projectRepositoryImpl.test.ts
└── prisma/
    └── prismaClient.ts                # Prismaクライアント
```

## リポジトリ実装

リポジトリ実装は、ドメイン層で定義されたリポジトリインターフェースを実装し、データベースへのアクセスを提供します。

### UserRepositoryImpl（ユーザーリポジトリ実装）

**ファイル**: `infrastructure/auth/userRepositoryImpl.ts`

ユーザーの永続化を実装するリポジトリです。

#### 実装

```typescript
export class UserRepositoryImpl implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const userData = await prismaClient.user.findUnique({
      where: { id },
    });

    if (!userData) {
      return null;
    }

    return User.reconstruct(
      userData.id,
      userData.email,
      userData.passwordHash,
      userData.name,
      userData.userType,
      userData.createdAt,
      userData.updatedAt
    );
  }

  async findByEmail(email: Email): Promise<User | null> {
    const userData = await prismaClient.user.findUnique({
      where: { email: email.toString() },
    });

    if (!userData) {
      return null;
    }

    return User.reconstruct(
      userData.id,
      userData.email,
      userData.passwordHash,
      userData.name,
      userData.userType,
      userData.createdAt,
      userData.updatedAt
    );
  }

  async save(user: User): Promise<User> {
    const userData = await prismaClient.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email.toString(),
        passwordHash: user.passwordHash.toString(),
        name: user.name,
        userType: user.userType.toNumber(),
        updatedAt: new Date(),
      },
      create: {
        id: user.id,
        email: user.email.toString(),
        passwordHash: user.passwordHash.toString(),
        name: user.name,
        userType: user.userType.toNumber(),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });

    return User.reconstruct(
      userData.id,
      userData.email,
      userData.passwordHash,
      userData.name,
      userData.userType,
      userData.createdAt,
      userData.updatedAt
    );
  }

  async findAll(): Promise<User[]> {
    const usersData = await prismaClient.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return usersData.map((userData) =>
      User.reconstruct(
        userData.id,
        userData.email,
        userData.passwordHash,
        userData.name,
        userData.userType,
        userData.createdAt,
        userData.updatedAt
      )
    );
  }

  async delete(id: string): Promise<void> {
    await prismaClient.user.delete({
      where: { id },
    });
  }
}
```

#### 主な特徴

- **ドメインオブジェクトの変換**: Prismaのデータモデルとドメインエンティティの相互変換
- **reconstructメソッドの使用**: データベースから取得したデータをエンティティに再構築
- **値オブジェクトの変換**: Email、PasswordHash、UserTypeValueを文字列や数値に変換

#### データフロー

```
Prismaデータモデル → User.reconstruct() → Userエンティティ
Userエンティティ → 値オブジェクトのtoString()/toNumber() → Prismaデータモデル
```

### ProjectRepositoryImpl（プロジェクトリポジトリ実装）

**ファイル**: `infrastructure/project/projectRepositoryImpl.ts`

プロジェクトの永続化を実装するリポジトリです。

#### 実装

```typescript
export class ProjectRepositoryImpl implements IProjectRepository {
  async findById(id: string): Promise<Project | null> {
    const projectData = await prismaClient.project.findUnique({
      where: { id },
    });

    if (!projectData) {
      return null;
    }

    return Project.reconstruct(
      projectData.id,
      projectData.name,
      projectData.description,
      projectData.createdAt,
      projectData.updatedAt
    );
  }

  async findAll(): Promise<Project[]> {
    const projectsData = await prismaClient.project.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return projectsData.map((projectData) =>
      Project.reconstruct(
        projectData.id,
        projectData.name,
        projectData.description,
        projectData.createdAt,
        projectData.updatedAt
      )
    );
  }

  async save(project: Project): Promise<Project> {
    const projectData = await prismaClient.project.upsert({
      where: { id: project.id },
      update: {
        name: project.name,
        description: project.description,
        updatedAt: new Date(),
      },
      create: {
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });

    return Project.reconstruct(
      projectData.id,
      projectData.name,
      projectData.description,
      projectData.createdAt,
      projectData.updatedAt
    );
  }

  async delete(id: string): Promise<void> {
    await prismaClient.project.delete({
      where: { id },
    });
  }
}
```

## 外部サービス実装

### JwtService（JWTサービス）

**ファイル**: `infrastructure/auth/jwtService.ts`

JWTトークンの生成と検証を提供するサービスです。

#### 実装

```typescript
export class JwtService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'secret';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
  }

  generateAccessToken(userId: string): string {
    return jwt.sign({ userId }, this.accessTokenSecret, {
      expiresIn: '15m',
    });
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, this.refreshTokenSecret, {
      expiresIn: '7d',
    });
  }

  verifyAccessToken(token: string): { userId: string } {
    try {
      return jwt.verify(token, this.accessTokenSecret) as { userId: string };
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  verifyRefreshToken(token: string): { userId: string } {
    try {
      return jwt.verify(token, this.refreshTokenSecret) as { userId: string };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
}
```

#### 主な特徴

- **トークンの生成**: アクセストークン（15分）とリフレッシュトークン（7日）を生成
- **トークンの検証**: トークンの有効性を検証し、ユーザーIDを抽出
- **環境変数の使用**: シークレットキーは環境変数から取得

#### 使用例

```typescript
const jwtService = new JwtService();

// トークンの生成
const accessToken = jwtService.generateAccessToken('user-id');
const refreshToken = jwtService.generateRefreshToken('user-id');

// トークンの検証
try {
  const { userId } = jwtService.verifyAccessToken(accessToken);
  console.log('User ID:', userId);
} catch (error) {
  console.error('Invalid token');
}
```

## Prismaクライアント

### prismaClient

**ファイル**: `infrastructure/prisma/prismaClient.ts`

Prismaクライアントのシングルトンインスタンスを提供します。

#### 実装

```typescript
import { PrismaClient } from '@prisma/client';

export const prismaClient = new PrismaClient();
```

#### 使用例

```typescript
import { prismaClient } from '../infrastructure/prisma/prismaClient';

const users = await prismaClient.user.findMany();
```

## データベーススキーマ

### Userモデル

```prisma
model User {
  id          String   @id @default(uuid())
  email       String   @unique
  passwordHash String
  name        String
  userType    Int      @default(4) // 1: ADMINISTRATOR, 2: MEMBER, 3: PARTNER, 4: CUSTOMER
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  projectMembers ProjectMember[]

  @@map("users")
}
```

### Projectモデル

```prisma
model Project {
  id          String   @id @default(uuid())
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  members ProjectMember[]

  @@map("projects")
}
```

### ProjectMemberモデル

```prisma
model ProjectMember {
  id        String   @id @default(uuid())
  projectId String
  userId    String
  createdAt DateTime @default(now())

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
  @@map("project_members")
}
```

## 設計原則

### 1. 依存性逆転の原則（DIP）

インフラストラクチャ層は、ドメイン層のインターフェースを実装します。これにより、ドメイン層は技術的な詳細に依存しません。

### 2. 変換の責任

リポジトリ実装は、データベースのデータモデルとドメインエンティティの相互変換を担当します。

### 3. エラーハンドリング

外部サービス（JWT、データベース）のエラーを適切に処理し、ドメイン層に適したエラーに変換します。

## テスト

各実装には、対応するテストファイル（`.test.ts`）があります。

### テストの例

```typescript
// infrastructure/auth/userRepositoryImpl.test.ts
describe('UserRepositoryImpl', () => {
  it('should find user by id', async () => {
    const repository = new UserRepositoryImpl();
    const user = await repository.findById('user-id');
    
    expect(user).toBeInstanceOf(User);
    expect(user?.id).toBe('user-id');
  });

  it('should save user', async () => {
    const repository = new UserRepositoryImpl();
    const email = new Email('test@example.com');
    const user = await User.create(
      'user-id',
      email,
      'password123',
      'Test User',
      UserType.CUSTOMER
    );
    
    const savedUser = await repository.save(user);
    expect(savedUser.id).toBe('user-id');
  });
});
```

## ベストプラクティス

1. **インターフェースの実装**: ドメイン層のインターフェースを正確に実装する
2. **変換の責任**: データベースモデルとドメインエンティティの変換を適切に行う
3. **エラーハンドリング**: 外部サービスのエラーを適切に処理する
4. **テストの記述**: すべての実装にテストを記述する
5. **環境変数の使用**: シークレットキーなどの設定は環境変数から取得する

## 関連ドキュメント

- [アーキテクチャ概要](./architecture-overview.md)
- [ドメイン層の詳細](./domain-layer.md)
- [アプリケーション層の詳細](./application-layer.md)
- [API層の詳細](./api-layer.md)

