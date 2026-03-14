import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAgent, runAgent } from "../src/agent.js";
import type { Config } from "../src/config.js";

// adk-llm-bridge をモック
vi.mock("adk-llm-bridge", () => ({
  AIGateway: vi.fn(() => ({ mockLlm: true })),
}));

// @google/adk をモック
vi.mock("@google/adk", () => {
  const mockRunAsync = vi.fn();
  const mockGetOrCreateSession = vi.fn().mockResolvedValue({});
  return {
    LlmAgent: vi.fn().mockImplementation((config: Record<string, unknown>) => ({
      ...config,
      _isMockAgent: true,
    })),
    InMemoryRunner: vi.fn().mockImplementation(() => ({
      runAsync: mockRunAsync,
      sessionService: {
        getOrCreateSession: mockGetOrCreateSession,
      },
    })),
    InMemorySessionService: vi.fn(),
  };
});

const testConfig: Config = {
  slackBotToken: "xoxb-test",
  slackSigningSecret: "test-secret",
  ollamaBaseUrl: "http://localhost:11434/v1",
  ollamaModel: "gpt-oss",
  port: 3000,
};

describe("createAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("LlmAgent を正しい設定で作成する", async () => {
    const { LlmAgent } = await import("@google/adk");
    const { AIGateway } = await import("adk-llm-bridge");

    createAgent(testConfig);

    expect(AIGateway).toHaveBeenCalledWith("gpt-oss", {
      baseURL: "http://localhost:11434/v1",
      apiKey: "ollama",
    });
    expect(LlmAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "slack-assistant",
        instruction: expect.any(String),
      })
    );
  });

  it("runner と agent を返す", () => {
    const result = createAgent(testConfig);

    expect(result).toHaveProperty("agent");
    expect(result).toHaveProperty("runner");
  });
});

describe("runAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ユーザーメッセージを処理して応答テキストを返す", async () => {
    const { InMemoryRunner } = await import("@google/adk");
    const mockRunner = new (InMemoryRunner as unknown as new () => {
      runAsync: ReturnType<typeof vi.fn>;
      sessionService: { getOrCreateSession: ReturnType<typeof vi.fn> };
    })();

    async function* mockEvents() {
      yield { author: "slack-assistant", content: { parts: [{ text: "こんにちは！" }] } };
    }
    mockRunner.runAsync.mockReturnValue(mockEvents());

    const response = await runAgent(mockRunner as never, "テストメッセージ", "user-123", "session-abc");

    expect(response).toBe("こんにちは！");
    expect(mockRunner.sessionService.getOrCreateSession).toHaveBeenCalledWith({
      appName: "vercel-chat-adk",
      userId: "user-123",
      sessionId: "session-abc",
    });
    expect(mockRunner.runAsync).toHaveBeenCalledWith({
      userId: "user-123",
      sessionId: "session-abc",
      newMessage: {
        role: "user",
        parts: [{ text: "テストメッセージ" }],
      },
    });
  });

  it("エージェントから応答がない場合、デフォルトメッセージを返す", async () => {
    const { InMemoryRunner } = await import("@google/adk");
    const mockRunner = new (InMemoryRunner as unknown as new () => {
      runAsync: ReturnType<typeof vi.fn>;
      sessionService: { getOrCreateSession: ReturnType<typeof vi.fn> };
    })();

    async function* mockEvents() {
      yield { author: "other-agent", content: { parts: [{ text: "ignored" }] } };
    }
    mockRunner.runAsync.mockReturnValue(mockEvents());

    const response = await runAgent(mockRunner as never, "テスト", "user-123", "session-abc");

    expect(response).toBe("応答を生成できませんでした。");
  });
});
