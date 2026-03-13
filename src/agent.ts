import { LlmAgent, InMemoryRunner } from "@google/adk";
import { AIGateway } from "adk-llm-bridge";
import type { Config } from "./config.js";

const AGENT_NAME = "slack-assistant";

export function createAgent(config: Config) {
  const model = AIGateway(config.ollamaModel, {
    baseURL: config.ollamaBaseUrl,
    apiKey: "ollama",
  });

  const agent = new LlmAgent({
    name: AGENT_NAME,
    model,
    instruction:
      "あなたはSlackで動作するAIアシスタントです。ユーザーの質問に日本語で丁寧に回答してください。",
  });

  const runner = new InMemoryRunner({
    appName: "vercel-chat-adk",
    agent,
  });

  return { agent, runner };
}

export async function runAgent(
  runner: InstanceType<typeof InMemoryRunner>,
  message: string,
  userId: string
): Promise<string> {
  const events = runner.runEphemeral({
    userId,
    newMessage: {
      role: "user",
      parts: [{ text: message }],
    },
  });

  let lastResponse = "";

  for await (const event of events) {
    if (
      event.author === AGENT_NAME &&
      event.content?.parts
    ) {
      for (const part of event.content.parts) {
        if ("text" in part && part.text) {
          lastResponse = part.text;
        }
      }
    }
  }

  return lastResponse || "応答を生成できませんでした。";
}
