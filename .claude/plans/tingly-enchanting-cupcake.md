# Slackスレッド会話履歴の保持

## Context

現在、ボットは各メッセージを独立して処理しており(`runner.runEphemeral()`)、スレッド内の会話コンテキストを保持していない。ユーザーがスレッド内で連続した質問をしても、ボットは過去のやり取りを覚えていないため、自然な対話ができない。

## アプローチ: ADKセッション活用

`runner.runEphemeral()` → `runner.runAsync()` に切り替え、Slackスレッド ID をADKセッション ID にマッピングする。ADKの`InMemorySessionService`が会話履歴を自動管理する。

**選定理由:**
- ADKが履歴管理を内包しているため、手動でのメッセージ取得・変換が不要
- 将来`DatabaseSessionService`に差し替えれば再起動耐性も得られる
- コード変更が最小限（3ファイル）

**制約:**
- `InMemorySessionService`はプロセス再起動で履歴消失（MVP段階では許容）
- 長大なスレッドではメモリ増加の可能性あり

## 実装手順

### Step 1: `src/agent.ts` — `runAsync`への切り替え

- `runAgent`に`sessionId`パラメータを追加
- `runner.sessionService.getOrCreateSession()`でセッションを確保
- `runner.runEphemeral()` → `runner.runAsync({userId, sessionId, newMessage})`

```typescript
export async function runAgent(
  runner: InstanceType<typeof InMemoryRunner>,
  message: string,
  userId: string,
  sessionId: string,
): Promise<string> {
  const appName = "vercel-chat-adk";

  await runner.sessionService.getOrCreateSession({
    appName,
    userId,
    sessionId,
  });

  const events = runner.runAsync({
    userId,
    sessionId,
    newMessage: { role: "user", parts: [{ text: message }] },
  });

  // ... イベント消費ループは変更なし
}
```

### Step 2: `src/handler.ts` — スレッドIDの引き渡し

- `RunAgentFn`の型に`sessionId`を追加
- `thread.id`をセッションIDとして渡す（`slack:C0123:1234567890.123`形式で一意）

```typescript
type RunAgentFn = (message: string, userId: string, sessionId: string) => Promise<string>;

// handler内:
const response = await runAgentFn(message.text, message.author.userId, thread.id);
```

### Step 3: `src/index.ts` — バインディング更新

```typescript
const boundRunAgent = (message: string, userId: string, sessionId: string) =>
  runAgent(runner, message, userId, sessionId);
```

### Step 4: テスト更新

- `tests/agent.test.ts`: `runAsync`のモック、`sessionService.getOrCreateSession`のモック、`sessionId`引数の追加
- `tests/handler.test.ts`: `mockThread`に`id`プロパティ追加、`runAgentFn`が3引数で呼ばれることを検証

## 対象ファイル

- `src/agent.ts` — コア変更
- `src/handler.ts` — sessionId引き渡し
- `src/index.ts` — バインディング
- `tests/agent.test.ts` — テスト更新
- `tests/handler.test.ts` — テスト更新

## 検証方法

1. `npm test` で全テスト通過を確認
2. ボットを起動し、Slackスレッド内で複数回メッセージを送信
3. ボットが前のメッセージの内容を踏まえた応答をするか確認
4. 新規スレッドでは過去のスレッドの履歴が混ざらないことを確認
