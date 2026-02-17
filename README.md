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
# .env.local を編集して GEMINI_API_KEY を設定

# 3. 開発サーバーの起動
npm run dev
```

ブラウザで http://localhost:3000 を開く。

## 環境変数

`.env.local` ファイルを作成し、以下を設定してください。

```
GEMINI_API_KEY=your_api_key_here
```

Gemini APIキーは [Google AI Studio](https://aistudio.google.com/apikey) から取得できます。

## スクリプト

| コマンド | 説明 |
|---|---|
| `npm run dev` | 開発サーバー起動（port 3000） |
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
