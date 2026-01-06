# start-project

データベース、Prisma Studio、ローカルサーバーを起動します。

## 実行内容

1. Docker ComposeでPostgreSQLデータベースを起動
2. Prisma Studioをバックグラウンドで起動
3. Nuxt開発サーバーをバックグラウンドで起動

## 使用方法

以下のコマンドを実行してください：

```bash
# データベースの起動
docker-compose up -d

# Prisma Studioをバックグラウンドで起動
npm run db:studio &

# Nuxt開発サーバーをバックグラウンドで起動
npm run dev &
```

または、一括で実行する場合：

```bash
docker-compose up -d && npm run db:studio & npm run dev &
```

## 注意事項

- データベースが起動するまで数秒かかる場合があります
- Prisma Studioは通常 `http://localhost:5555` で起動します
- Nuxt開発サーバーは通常 `http://localhost:3000` で起動します
- バックグラウンドで実行したプロセスは、`/end-project` コマンドで終了できます
