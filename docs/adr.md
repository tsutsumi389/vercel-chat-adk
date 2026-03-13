# Architecture Decision Records

## ADR-001: チャットフレームワークに vercel/chat を採用

- **日時**: 2026-03-13
- **ステータス**: 採用

### 決定
Slack ボット構築のフレームワークとして `chat` (vercel/chat) を採用する。

### 理由
- Slack, Teams, Discord 等マルチプラットフォーム対応の統一的な抽象化レイヤーを提供
- TypeScript ネイティブで型安全
- `onNewMention`, `onSubscribedMessage` 等の直感的なイベントハンドラ API
- Slack の3秒タイムアウト制約を内部的にハンドリング
- 将来的に他のプラットフォームへの展開が容易

### 代替案
- **@slack/bolt**: Slack 専用で実績があるが、マルチプラットフォーム対応が不要でも抽象化レイヤーが薄い
- **自前実装**: Slack Web API を直接使用。ボイラープレートが多くなる

---

## ADR-002: AI エージェントフレームワークに google/adk-js を採用

- **日時**: 2026-03-13
- **ステータス**: 採用

### 決定
AI エージェントの構築に `@google/adk` (google/adk-js) を採用する。

### 理由
- Google が公式に提供するエージェント開発キット
- コードファーストで柔軟なエージェント定義が可能
- ツール統合 (カスタム関数、MCP、OpenAPI) が充実
- 階層的なマルチエージェント構成が可能
- 将来的にエージェントの高度化（ツール追加、サブエージェント構成）が容易

### 代替案
- **LangChain.js**: 成熟したエコシステムだが、抽象化が重い
- **Vercel AI SDK**: ストリーミングに強いが、エージェント機能が adk ほど充実していない
- **自前実装**: Ollama API を直接呼び出し。シンプルだがツール統合やマルチエージェント対応が困難

---

## ADR-003: LLM ブリッジに adk-llm-bridge を採用

- **日時**: 2026-03-13
- **ステータス**: 採用

### 決定
adk-js と Ollama を接続するために `adk-llm-bridge` パッケージを採用する。

### 理由
- adk-js は現時点で Gemini と Apigee のみネイティブサポート (OpenAI互換APIは未対応)
- adk-llm-bridge が `BaseLlm` を拡張し、OpenAI互換APIへのブリッジを提供
- `Custom()` ファクトリで Ollama の `http://localhost:11434/v1` エンドポイントを簡単に指定可能
- adk-js の公式マルチモデルサポート (issue #23) が実装されるまでの実用的な解決策

### 代替案
- **自前 BaseLlm 実装**: @google/genai 型と OpenAI 型の変換を自前で実装。工数が大きい
- **litellm プロキシ**: 別プロセスでプロキシを立てる。インフラが増える

---

## ADR-004: LLM にローカル Ollama (gpt-oss) を採用

- **日時**: 2026-03-13
- **ステータス**: 採用

### 決定
LLM バックエンドとしてローカルの Ollama (gpt-oss モデル) を使用する。

### 理由
- ローカル実行でデータがクラウドに送信されない（プライバシー）
- API コスト不要
- gpt-oss モデルはセットアップ済み
- OpenAI 互換 API (`/v1/chat/completions`) を提供

### 代替案
- **Gemini API**: adk-js のデフォルトだが、API キーが必要でクラウド依存
- **OpenAI API**: 高性能だが有料

---

## ADR-005: トンネリングに cloudflared を採用

- **日時**: 2026-03-13
- **ステータス**: 採用

### 決定
ローカルサーバーの公開に cloudflared (Cloudflare Tunnel) を使用する。

### 理由
- ポートフォワーディングやファイアウォール設定が不要
- `cloudflared tunnel --url http://localhost:3000` でクイックトンネル利用可能
- Cloudflare アカウント不要（開発用クイックトンネル）
- Slack Event Subscriptions の Request URL として使用可能

### 代替案
- **ngrok**: 類似ツールだが、無料枠に制限がある
- **localtunnel**: シンプルだが安定性に欠ける
