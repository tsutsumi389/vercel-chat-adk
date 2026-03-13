# vercel-chat-adk
vercel-chat(`https://github.com/vercel/chat`)を使ってslackでローカルのAIエージェントに指示を出したい
LLMは、ローカルのOllama(gpt-oss)を使う。（セットアップ済み）
AIエージェントは、googleのADK(`https://github.com/google/adk-js`)を使ったエージェントにしたい。
トンネリングは、cloudflaredを使う

必ず作って欲しいドキュメント
docs/adr.md
  日時となぜその技術を採用したかを記載

実装はTDDで行って