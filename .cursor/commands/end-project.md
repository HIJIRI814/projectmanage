# end-project

データベース、Prisma Studio、ローカルサーバーを停止します。

## 実行内容

1. Docker ComposeでPostgreSQLデータベースを停止
2. Prisma Studioのプロセスを終了
3. Nuxt開発サーバーのプロセスを終了

## 使用方法

以下のコマンドを実行してください：

```bash
# データベースの停止
docker-compose down

# Prisma Studioのプロセスを終了（ポート5555を使用しているプロセス）
lsof -ti:5555 | xargs kill -9 2>/dev/null || true

# Nuxt開発サーバーのプロセスを終了（ポート3000を使用しているプロセス）
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
```

または、一括で実行する場合：

```bash
docker-compose down && lsof -ti:5555 | xargs kill -9 2>/dev/null || true && lsof -ti:3000 | xargs kill -9 2>/dev/null || true
```

## 注意事項

- プロセスが既に終了している場合でもエラーにはなりません（`|| true`でエラーを無視）
- データベースのデータは保持されます（`docker-compose down`はコンテナのみを停止）
- データベースのデータも削除したい場合は `docker-compose down -v` を使用してください

This command will be available in chat with /end-project
