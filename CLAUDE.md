# CLAUDE.md

## プロジェクト概要

Slack からローカル Ollama (gpt-oss) で動作する AI エージェントに指示を出すボット。
vercel/chat + google/adk-js + adk-llm-bridge を使用。

## プロジェクト構造

```
src/
  index.ts     # エントリポイント: Chat初期化、ハンドラ登録
  config.ts    # 環境変数読み込み・バリデーション
  agent.ts     # ADK LlmAgent 定義、adk-llm-bridge 経由で Ollama 接続
  handler.ts   # Slack イベントハンドラ (メンション/DM/スレッド)
tests/
  config.test.ts
  agent.test.ts
  handler.test.ts
  integration/   # 統合テスト (Ollama 接続必要)
docs/
  adr.md         # 技術選定理由
```
