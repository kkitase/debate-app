# AI Debate Simulator — Strategy Lab

Gemini / Claude を使った **AI ディベートシミュレーター**。2つのAIペルソナが設定されたテーマで議論し、最終的にエグゼクティブサマリーを自動生成します。

> **デフォルトシナリオ:** Google Cloud Japan のマーケッター（ねごりん）vs. グローバル戦略責任者（トランプ）が、日本市場向けコンテンツのローカライズ戦略について議論します。ペルソナ・テーマは UI から自由に変更できます。

---

## アーキテクチャ

```
ブラウザ (React)
  │
  ├─ Gemini モデル → @google/genai SDK で直接呼び出し（ブラウザから）
  │
  └─ Claude モデル → /api/claude/stream (Express proxy server)
                        │
                        └─ Vertex AI (AnthropicVertex SDK)
```

Claude は API キーではなく **Google Cloud の IAM 認証**で動作するため、ブラウザから直接呼び出せません。Express プロキシサーバーが仲介します。

認証フロー:

1. ユーザーが Firebase Auth（Google ログイン）でサインイン
2. Firebase ID Token を取得してリクエストヘッダーに付与
3. サーバーが Token を検証 + Firestore のホワイトリスト照合
4. 認証通過後、Vertex AI へリクエスト転送

---

## 必要なもの

| 項目                        | 用途                                            |
| --------------------------- | ----------------------------------------------- |
| Node.js 18+                 | フロントエンド・サーバーの実行                  |
| Google Cloud CLI (`gcloud`) | Vertex AI 認証・デプロイ                        |
| Firebase プロジェクト       | 認証（Google ログイン）+ ユーザーホワイトリスト |
| GCP プロジェクト            | Vertex AI（Claude）の呼び出し                   |
| Google AI Studio API キー   | Gemini モデルの呼び出し                         |

> Firebase プロジェクトと GCP プロジェクトは同じでも別でも構いません。

---

## セットアップ手順

### 1. Firebase プロジェクトの準備

1. [Firebase コンソール](https://console.firebase.google.com/) でプロジェクトを作成（または既存を使用）
2. **Authentication を有効化**
   - [Authentication > Sign-in method] → Google を有効にする
3. **Firestore を有効化**
   - [Firestore Database] → データベースを作成（リージョンは任意）
4. **ホワイトリストにユーザーを追加**
   - Firestore で `allowed_users` コレクションを作成
   - アクセスを許可したいユーザーのメールアドレスをドキュメントIDとして追加
   ```
   allowed_users/
     ├── user@example.com   ← ドキュメントID = メールアドレス（内容は空でOK）
     └── other@example.com
   ```
5. **ウェブアプリを登録**してSDK設定を取得
   - [プロジェクト設定 > マイアプリ] → ウェブアプリを追加
   - `firebaseConfig` の値をメモ（後で環境変数に設定）

### 2. GCP プロジェクトの準備（Claude を使う場合）

```bash
# 必要な API を有効化
gcloud services enable aiplatform.googleapis.com --project=YOUR_GCP_PROJECT_ID

# Vertex AI Model Garden で Claude を有効化（ブラウザ操作が必要）
# 以下の URL を開いて「Enable」ボタンをクリック:
# https://console.cloud.google.com/vertex-ai/publishers/anthropic/model-garden/claude-opus-4-6?project=YOUR_GCP_PROJECT_ID
# https://console.cloud.google.com/vertex-ai/publishers/anthropic/model-garden/claude-sonnet-4-5?project=YOUR_GCP_PROJECT_ID
```

> Claude モデルは `us-east5` / `europe-west1` / `asia-southeast1` リージョンのみ対応しています。

### 3. ローカル開発環境のセットアップ

```bash
# リポジトリをクローン
git clone https://github.com/kkitase/debate-app.git
cd debate-app

# 依存パッケージのインストール
npm install

# 環境変数ファイルを作成
cp .env.example .env.local
# .env.local を編集（次のセクション参照）

# Claude 用のローカル認証（Application Default Credentials）
gcloud auth application-default login

# 開発サーバー起動（Vite + Express を同時起動）
npm run dev:all
```

ブラウザで http://localhost:3000 を開く。

---

## 環境変数

`.env.local` に以下を設定してください。

```bash
# ── Gemini ────────────────────────────────────────────────
# https://aistudio.google.com/apikey で取得
VITE_GEMINI_API_KEY="your_gemini_api_key"
GEMINI_API_KEY="your_gemini_api_key"     # サーバーサイド用（現在未使用だが予約）

# ── Claude via Vertex AI ──────────────────────────────────
# Model Garden で Claude が有効化されている GCP プロジェクト ID
VERTEX_PROJECT_ID="your_gcp_project_id"

# Claude が使えるリージョン（global は不可）
VERTEX_REGION="us-east5"

# Firebase と Vertex が別プロジェクトの場合のみ設定
# 同じプロジェクトなら不要（VERTEX_PROJECT_ID が使われる）
FIREBASE_PROJECT_ID="your_firebase_project_id"

# ── Firebase ──────────────────────────────────────────────
# Firebase コンソール > プロジェクト設定 > マイアプリ から取得
VITE_FIREBASE_API_KEY="your_api_key"
VITE_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_project_id.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_messaging_sender_id"
VITE_FIREBASE_APP_ID="your_app_id"
```

### 変数の使われ方まとめ

| 変数                  | どこで使うか                                           |
| --------------------- | ------------------------------------------------------ |
| `VITE_*`              | フロントエンド（Vite ビルド時に埋め込み）              |
| `VERTEX_PROJECT_ID`   | サーバー：Vertex AI の呼び出し先プロジェクト           |
| `VERTEX_REGION`       | サーバー：Claude モデルのリージョン                    |
| `FIREBASE_PROJECT_ID` | サーバー：Firebase ID Token の検証プロジェクト         |
| `GEMINI_API_KEY`      | サーバーサイド予約（現在 Gemini はブラウザ直呼び出し） |

---

## ペルソナのカスタマイズ

デフォルトペルソナは `src/constants.ts` の `DEFAULT_PERSONAS` で定義されています。

| フィールド          | 説明                        |
| ------------------- | --------------------------- |
| `name`              | UI に表示される名前         |
| `title`             | 役職（サブテキスト）        |
| `description`       | ペルソナカードの説明文      |
| `systemInstruction` | AI に渡すシステムプロンプト |

UIからも一時的に変更可能（リセットボタンで `DEFAULT_PERSONAS` に戻る）。永続的に変えたい場合は `src/constants.ts` を直接編集してください。

---

## デプロイ (Cloud Run)

Cloud Build でイメージをビルドし、Cloud Run にデプロイします。

### 事前準備

```bash
# Cloud Run・Cloud Build・Container Registry API を有効化
gcloud services enable run.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com \
  --project=YOUR_FIREBASE_PROJECT_ID

# Cloud Build サービスアカウントに Storage 権限を付与
# （プロジェクト番号は gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)" で確認）
gcloud projects add-iam-policy-binding YOUR_FIREBASE_PROJECT_ID \
  --member="serviceAccount:PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
  --role="roles/storage.admin"

# Vertex が別プロジェクトの場合: Cloud Run のサービスアカウントに Vertex AI 権限を付与
gcloud projects add-iam-policy-binding YOUR_VERTEX_PROJECT_ID \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

### ビルド

```bash
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
```

### デプロイ

```bash
gcloud run deploy debate-app \
  --image=gcr.io/YOUR_FIREBASE_PROJECT_ID/debate-app:latest \
  --project=YOUR_FIREBASE_PROJECT_ID \
  --region=us-central1 \
  --allow-unauthenticated \
  --set-env-vars="\
FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID,\
VERTEX_PROJECT_ID=YOUR_VERTEX_PROJECT_ID,\
VERTEX_REGION=us-east5,\
GEMINI_API_KEY=YOUR_GEMINI_API_KEY"
```

### デプロイ後の Firebase 設定

Cloud Run の URL（`https://xxxx.run.app`）が払い出されたら:

1. [Firebase > Authentication > Settings > Authorized domains] に Cloud Run の URL を追加
2. Firestore の `allowed_users` コレクションにアクセスを許可するユーザーのメールを追加

---

## 利用可能なモデル

| モデル            | プロバイダー                   | ID                       |
| ----------------- | ------------------------------ | ------------------------ |
| Gemini 3 Flash    | Google AI (ブラウザ直呼び出し) | `gemini-3-flash-preview` |
| Gemini 3 Pro      | Google AI (ブラウザ直呼び出し) | `gemini-3-pro-preview`   |
| Gemini 3.1 Pro    | Google AI (ブラウザ直呼び出し) | `gemini-3.1-pro-preview` |
| Claude Opus 4.6   | Vertex AI (サーバー経由)       | `claude-opus-4-6`        |
| Claude Sonnet 4.5 | Vertex AI (サーバー経由)       | `claude-sonnet-4-5`      |

---

## スクリプト

| コマンド             | 説明                                   |
| -------------------- | -------------------------------------- |
| `npm run dev:all`    | Vite + API サーバーを同時起動（推奨）  |
| `npm run dev`        | Vite dev server のみ（port 3000）      |
| `npm run dev:server` | Express proxy server のみ（port 3001） |
| `npm run build`      | プロダクションビルド                   |
| `npm run lint`       | TypeScript 型チェック                  |

---

## プロジェクト構成

```
debate-app/
├── src/
│   ├── constants.ts       # デフォルトペルソナ・モデル定義
│   ├── types.ts           # 型定義
│   ├── utils.ts           # ユーティリティ（コピー・エクスポート）
│   ├── App.tsx            # メイン UI
│   ├── main.tsx
│   ├── index.css
│   ├── hooks/
│   │   └── useDebate.ts   # ディベートロジック（ストリーミング）
│   └── lib/
│       └── firebase.ts    # Firebase 初期化
├── personas/              # ペルソナ定義のサンプル（Markdown）
├── server.ts              # Express API プロキシ（Claude 用）
├── Dockerfile             # Cloud Run 向けコンテナ
├── cloudbuild.yaml        # Cloud Build 設定
├── firebase.json          # Firebase CLI 設定
├── firestore.rules        # Firestore セキュリティルール
└── .env.example           # 環境変数テンプレート
```

---

## 技術スタック

- **React 19** + **TypeScript**
- **Vite 6** — バンドラー
- **Tailwind CSS v4** — スタイリング
- **@anthropic-ai/vertex-sdk** — Claude (Vertex AI) クライアント
- **@google/genai** — Gemini API クライアント
- **Express** — API プロキシサーバー
- **Firebase Auth** — Google ログイン認証
- **Firestore** — ユーザーホワイトリスト管理
- **Cloud Build + Cloud Run** — CI/CD・ホスティング
