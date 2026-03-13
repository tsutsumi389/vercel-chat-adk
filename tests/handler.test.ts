import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMentionHandler } from "../src/handler.js";

describe("createMentionHandler", () => {
  const mockRunAgent = vi.fn();
  const mockThread = {
    post: vi.fn().mockResolvedValue(undefined),
    startTyping: vi.fn().mockResolvedValue(undefined),
  };
  const mockMessage = {
    text: "こんにちは、ボットさん",
    author: { userId: "U123ABC" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("メッセージを受け取り、エージェントの応答を返す", async () => {
    mockRunAgent.mockResolvedValue("こんにちは！お手伝いします。");

    const handler = createMentionHandler(mockRunAgent);
    await handler(mockThread as never, mockMessage as never);

    expect(mockRunAgent).toHaveBeenCalledWith("こんにちは、ボットさん", "U123ABC");
    expect(mockThread.post).toHaveBeenCalledWith("こんにちは！お手伝いします。");
  });

  it("処理中にタイピングインジケータを表示する", async () => {
    mockRunAgent.mockResolvedValue("応答");

    const handler = createMentionHandler(mockRunAgent);
    await handler(mockThread as never, mockMessage as never);

    expect(mockThread.startTyping).toHaveBeenCalled();
  });

  it("エージェントがエラーを返した場合、エラーメッセージを返す", async () => {
    mockRunAgent.mockRejectedValue(new Error("LLM connection failed"));

    const handler = createMentionHandler(mockRunAgent);
    await handler(mockThread as never, mockMessage as never);

    expect(mockThread.post).toHaveBeenCalledWith(
      expect.stringContaining("エラーが発生しました")
    );
  });

  it("空メッセージの場合はスキップする", async () => {
    const emptyMessage = { text: "", author: { userId: "U123" } };

    const handler = createMentionHandler(mockRunAgent);
    await handler(mockThread as never, emptyMessage as never);

    expect(mockRunAgent).not.toHaveBeenCalled();
  });
});
