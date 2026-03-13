# vercel-chat-adk

Slack からローカルの AI エージェントに指示を出せるボット。

## 技術スタック

- [vercel/chat](https://github.com/vercel/chat) - Slack チャットフレームワーク
- [google/adk-js](https://github.com/google/adk-js) - AI エージェントフレームワーク
- [adk-llm-bridge](https://www.npmjs.com/package/adk-llm-bridge) - ADK と Ollama の接続ブリッジ
- [Ollama](https://ollama.com/) (gpt-oss) - ローカル LLM
- [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) - トンネリング

## 前提条件

- Node.js 18+
- Ollama がインストール・起動済み（gpt-oss モデル）
- cloudflared がインストール済み
- Slack App が作成済み

## Slack App の設定

1. [Slack API](https://api.slack.com/apps) で新しい App を作成
2. **OAuth & Permissions** で以下の Bot Token Scopes を追加:
   - `app_mentions:read`
   - `chat:write`
   - `im:history`
   - `im:read`
   - `im:write`
3. **Event Subscriptions** を有効化し、以下のイベントを購読:
   - `app_mention`
   - `message.im`
4. Bot Token (`xoxb-...`) と Signing Secret を控える

## セットアップ

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .env を編集して Slack の認証情報を設定
```

`.env` の設定項目:

```
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
OLLAMA_BASE_URL=http://localhost:11434/v1  # デフォルト
OLLAMA_MODEL=gpt-oss                       # デフォルト
PORT=3000                                   # デフォルト
```

## 起動方法

```bash
# 1. Ollama が起動していることを確認
ollama list

# 2. サーバーを起動
npm run dev

# 3. 別ターミナルで cloudflared トンネルを起動
npm run tunnel
# 表示される https://*.trycloudflare.com の URL を控える

# 4. Slack App の Event Subscriptions > Request URL に以下を設定:
#    https://<tunnel-url>/webhooks/slack
```

## 使い方

- チャンネルで `@ボット名 質問内容` とメンションすると応答
- ボットに DM を送ると応答
- スレッド内で会話を継続可能

## 開発

```bash
# テスト実行
npm test

# テスト (watch モード)
npm run test:watch
```

## ドキュメント

- [技術選定理由 (ADR)](docs/adr.md)