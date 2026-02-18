# AI Debate Simulator — Strategy Lab

Gemini / Claude APIを使った**AIディベートシミュレーター**。2つのAIペルソナがテーマについて議論し、最終的にエグゼクティブサマリーを生成します。

## 機能

- **リアルタイムストリーミング** — 各AIの発言がトークン単位で表示される
- **Firebase Auth 認証** — 承認されたユーザーのみが AI モデルにアクセス可能
- **カスタマイズ可能なペルソナ** — 名前・役割・システムプロンプトを自由に編集
- **コンテキスト入力** — 既存レポートや制約条件を渡してディベートの前提にできる
- **多言語対応** — 日本語 / English で議論を実施
- **コピー & エクスポート** — 各発言・コンクルージョンのコピー、全文Markdownダウンロード
- **モデル選択** — ペルソナごとに異なる Gemini / Claude モデルを割り当て可能

## セットアップ

**前提条件:** Node.js 18+

```bash
# 1. 依存パッケージのインストール
npm install

# 2. 環境変数の設定
cp .env.example .env.local
# .env.local を編集して必要な値を設定（下記参照）

# 3. 開発サーバーの起動（2つのターミナルで実行、または一括起動）
npm run dev:all        # Vite + API サーバーを同時起動（推奨）
# または個別に:
# npm run dev          # Vite dev server (port 3000)
# npm run dev:server   # API proxy server (port 3001)
```

ブラウザで http://localhost:3000 を開く。

## 環境変数

`.env.local` ファイルを作成し、使用するモデルに応じて設定してください。

```bash
# ── Gemini ────────────────────────────────────────────────
VITE_GEMINI_API_KEY="your_gemini_api_key"   # https://aistudio.google.com/apikey
GEMINI_API_KEY="your_gemini_api_key"

# ── Claude via Vertex AI ──────────────────────────────────
# Vertex AI API を呼び出す GCP プロジェクト（Claude が Model Garden で有効なもの）
VERTEX_PROJECT_ID="your_vertex_gcp_project_id"
VERTEX_REGION="us-east5"   # Claude モデルは us-east5 / europe-west1 / asia-southeast1

# Firebase プロジェクトと Vertex プロジェクトが異なる場合に設定
# （同じ場合は省略可能。VERTEX_PROJECT_ID が代わりに使用される）
FIREBASE_PROJECT_ID="your_firebase_project_id"

# ── Firebase (Authentication) ─────────────────────────────
VITE_FIREBASE_API_KEY="your_api_key"
VITE_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_project_id.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_messaging_sender_id"
VITE_FIREBASE_APP_ID="your_app_id"
```

### Claude (Vertex AI) の認証

Claude モデルは Google Cloud の認証情報が必要です。ローカル開発では Application Default Credentials を使用します。

```bash
gcloud auth application-default login
```

Vertex AI で Claude を有効化するには [Model Garden](https://console.cloud.google.com/vertex-ai/model-garden) から対象モデルのページを開き、アクセスを有効化してください。

### 利用可能な Claude モデル（Vertex AI）

| モデル | ID |
|---|---|
| Claude Opus 4.6 | `claude-opus-4-6` |
| Claude Sonnet 4.5 | `claude-sonnet-4-5` |

## デプロイ (Cloud Run)

本プロジェクトは Docker 化されており、Cloud Build + Cloud Run へのデプロイが容易です。

```bash
# 1. イメージのビルドとプッシュ（cloudbuild.yaml を使用）
gcloud builds submit \
  --project=YOUR_FIREBASE_PROJECT_ID \
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

# 2. Cloud Run へデプロイ
gcloud run deploy debate-app \
  --image=gcr.io/YOUR_FIREBASE_PROJECT_ID/debate-app:latest \
  --project=YOUR_FIREBASE_PROJECT_ID \
  --region=us-central1 \
  --allow-unauthenticated \
  --set-env-vars="\
FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID,\
VERTEX_PROJECT_ID=YOUR_VERTEX_PROJECT_ID,\
VERTEX_REGION=us-east5,\
GEMINI_API_KEY=YOUR_VALUE"
```

### デプロイ後の Firebase 設定（重要）

1. **Firebase コンソールで Google ログインを有効化**
   - [Authentication > Sign-in method] で Google を有効にします。
2. **承認済みドメインの追加**
   - [Authentication > Settings > Authorized domains] に Cloud Run のサービス URL（`https://...run.app`）を追加します。
3. **Firestore に許可ユーザーを追加**
   - `allowed_users` コレクションにアクセスを許可するユーザーのメールアドレスをドキュメントIDとして追加します。

## スクリプト

| コマンド             | 説明                                   |
| -------------------- | -------------------------------------- |
| `npm run dev:all`    | Vite + API サーバーを同時起動          |
| `npm run dev`        | Vite dev server のみ起動（port 3000）  |
| `npm run dev:server` | API proxy server のみ起動（port 3001） |
| `npm run build`      | プロダクションビルド                   |
| `npm run preview`    | ビルド成果物のプレビュー               |
| `npm run lint`       | TypeScript型チェック                   |

## 技術スタック

- **React 19** + **TypeScript**
- **Vite 6** — バンドラー
- **Tailwind CSS v4** — スタイリング
- **@anthropic-ai/vertex-sdk** — Claude (Vertex AI) クライアント
- **@google/genai** — Gemini API クライアント
- **Express** — API プロキシサーバー
- **Firebase** — 認証 / Firestore（ホワイトリスト管理）
- **react-markdown** — Markdownレンダリング
- **lucide-react** — アイコン

## プロジェクト構成

```
src/
├── types.ts          # 型定義
├── constants.ts      # デフォルトペルソナ・モデル一覧
├── utils.ts          # ユーティリティ（cn, copy, export）
├── hooks/
│   └── useDebate.ts  # ディベートロジック（ストリーミング対応）
├── App.tsx           # メインUI
├── main.tsx
└── index.css
server.ts             # Claude (Vertex AI) API プロキシサーバー
Dockerfile            # Cloud Run 向けコンテナ定義
cloudbuild.yaml       # Cloud Build ビルド設定
```
