# AI Debate Simulator — Strategy Lab

Gemini APIを使った**AIディベートシミュレーター**。2つのAIペルソナがテーマについて議論し、最終的にエグゼクティブサマリーを生成します。

## 機能

- **リアルタイムストリーミング** — 各AIの発言がトークン単位で表示される
- **カスタマイズ可能なペルソナ** — 名前・役割・システムプロンプトを自由に編集
- **コンテキスト入力** — 既存レポートや制約条件を渡してディベートの前提にできる
- **多言語対応** — 日本語 / English で議論を実施
- **コピー & エクスポート** — 各発言・コンクルージョンのコピー、全文Markdownダウンロード
- **モデル選択** — ペルソナごとに異なるGeminiモデルを割り当て可能

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
# Gemini モデルを使う場合
GEMINI_API_KEY=your_gemini_api_key   # https://aistudio.google.com/apikey

# Claude (Vertex AI) モデルを使う場合
VERTEX_PROJECT_ID=your_gcp_project_id
VERTEX_REGION=global                 # または us-east1 など

# API proxy サーバーのポート（省略可、デフォルト: 3001）
# SERVER_PORT=3001
```

### Claude (Vertex AI) の認証

Claude モデルは Google Cloud の認証情報が必要です。ローカル開発では Application Default Credentials を使用します。

```bash
gcloud auth application-default login
```

Vertex AI で Claude を有効化するには [GCP コンソール](https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/use-claude) を参照してください。

## スクリプト

| コマンド | 説明 |
|---|---|
| `npm run dev:all` | Vite + API サーバーを同時起動 |
| `npm run dev` | Vite dev server のみ起動（port 3000） |
| `npm run dev:server` | API proxy server のみ起動（port 3001） |
| `npm run build` | プロダクションビルド |
| `npm run preview` | ビルド成果物のプレビュー |
| `npm run lint` | TypeScript型チェック |

## 技術スタック

- **React 19** + **TypeScript**
- **Vite 6** — バンドラー
- **Tailwind CSS v4** — スタイリング
- **@google/genai** — Gemini API クライアント
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
```
