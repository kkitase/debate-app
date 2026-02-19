---
description: Debate App の本番環境へのビルドとデプロイを実行する。
---

# プロダクションデプロイ (Deploy Production)

Debate App の Cloud Build と Cloud Run へのデプロイを自動化・標準化するワークフローです。

---

## Step 1: 事前チェック // turbo

デプロイする前に、ローカルのリポジトリ状態を確認する。

```bash
# 現在のブランチを確認 (mainブランチであることを確認)
git branch --show-current

# 未コミットの変更がないか確認
git status
```

## Step 2: セキュリティと健全性の検証

デプロイ前にプロジェクトの健全性を検証する。

1. 脆弱性スキャン: `npm audit` を実行して重大な脆弱性がないか確認
2. 自動修正可能なものは `npm audit fix` または overrides で対応

## Step 3: Cloud Build でのイメージ作成

Cloud Build にビルドジョブを送信して、コンテナイメージを GCR に作成する。

### 注意事項

- 必ず `.env.local` などの環境変数を参照し、以下の `--substitutions` コマンドに渡すこと。

```bash
# コマンド例 (各 YOUR_VALUE は環境変数から取得して置き換えること)
gcloud builds submit \
  --project=debate-app-kkitase-2026 \
  --config=cloudbuild.yaml \
  "--substitutions=\
_VITE_FIREBASE_API_KEY=YOUR_VALUE,\
_VITE_FIREBASE_AUTH_DOMAIN=YOUR_VALUE,\
_VITE_FIREBASE_PROJECT_ID=YOUR_VALUE,\
_VITE_FIREBASE_STORAGE_BUCKET=YOUR_VALUE,\
_VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_VALUE,\
_VITE_FIREBASE_APP_ID=YOUR_VALUE,\
_VITE_GEMINI_API_KEY=YOUR_VALUE" \
  .
```

## Step 4: Cloud Run へのデプロイ

ビルドされた `latest` イメージを使用して Cloud Run サービスを更新する。

```bash
# コマンド例 (各 YOUR_VALUE は環境変数から取得して置き換えること)
gcloud run deploy debate-app \
  --image=gcr.io/debate-app-kkitase-2026/debate-app:latest \
  --project=debate-app-kkitase-2026 \
  --region=us-central1 \
  --allow-unauthenticated \
  --set-env-vars="\
FIREBASE_PROJECT_ID=YOUR_VALUE,\
VERTEX_PROJECT_ID=YOUR_VALUE,\
VERTEX_REGION=us-east5,\
GEMINI_API_KEY=YOUR_VALUE"
```

## Step 5: 動作確認と報告

デプロイ完了後、以下の手順を実行する。

1. コマンドの出力から、新しいリビジョンが100%のトラフィックを処理しているか確認
2. 出力された **Service URL** をブラウザで開いてフロントエンドが動作しているか確認
3. AIによるデプロイ完了の報告と URL の提示
