import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("必須環境変数が設定されている場合、設定を返す", () => {
    process.env.SLACK_BOT_TOKEN = "xoxb-test-token";
    process.env.SLACK_SIGNING_SECRET = "test-secret";

    const config = loadConfig();

    expect(config.slackBotToken).toBe("xoxb-test-token");
    expect(config.slackSigningSecret).toBe("test-secret");
  });

  it("SLACK_BOT_TOKEN が未設定の場合、エラーをスローする", () => {
    process.env.SLACK_SIGNING_SECRET = "test-secret";
    delete process.env.SLACK_BOT_TOKEN;

    expect(() => loadConfig()).toThrow("SLACK_BOT_TOKEN");
  });

  it("SLACK_SIGNING_SECRET が未設定の場合、エラーをスローする", () => {
    process.env.SLACK_BOT_TOKEN = "xoxb-test-token";
    delete process.env.SLACK_SIGNING_SECRET;

    expect(() => loadConfig()).toThrow("SLACK_SIGNING_SECRET");
  });

  it("デフォルト値が適用される", () => {
    process.env.SLACK_BOT_TOKEN = "xoxb-test-token";
    process.env.SLACK_SIGNING_SECRET = "test-secret";

    const config = loadConfig();

    expect(config.ollamaBaseUrl).toBe("http://localhost:11434/v1");
    expect(config.ollamaModel).toBe("gpt-oss");
    expect(config.port).toBe(3000);
  });

  it("環境変数でデフォルト値を上書きできる", () => {
    process.env.SLACK_BOT_TOKEN = "xoxb-test-token";
    process.env.SLACK_SIGNING_SECRET = "test-secret";
    process.env.OLLAMA_BASE_URL = "http://custom:8080/v1";
    process.env.OLLAMA_MODEL = "custom-model";
    process.env.PORT = "8080";

    const config = loadConfig();

    expect(config.ollamaBaseUrl).toBe("http://custom:8080/v1");
    expect(config.ollamaModel).toBe("custom-model");
    expect(config.port).toBe(8080);
  });

  it("PORT が数値でない場合、エラーをスローする", () => {
    process.env.SLACK_BOT_TOKEN = "xoxb-test-token";
    process.env.SLACK_SIGNING_SECRET = "test-secret";
    process.env.PORT = "not-a-number";

    expect(() => loadConfig()).toThrow("Invalid PORT");
  });

  it("PORT が範囲外の場合、エラーをスローする", () => {
    process.env.SLACK_BOT_TOKEN = "xoxb-test-token";
    process.env.SLACK_SIGNING_SECRET = "test-secret";
    process.env.PORT = "99999";

    expect(() => loadConfig()).toThrow("Invalid PORT");
  });
});
