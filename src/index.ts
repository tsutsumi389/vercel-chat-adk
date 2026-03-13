import "dotenv/config";
import { Chat } from "chat";
import { createSlackAdapter } from "@chat-adapter/slack";
import { createMemoryState } from "@chat-adapter/state-memory";
import { loadConfig } from "./config.js";
import { createAgent, runAgent } from "./agent.js";
import { createMentionHandler } from "./handler.js";

const config = loadConfig();
const { runner } = createAgent(config);

const slack = createSlackAdapter({
  botToken: config.slackBotToken,
  signingSecret: config.slackSigningSecret,
});

const chat = new Chat({
  userName: "adk-assistant",
  adapters: { slack },
  state: createMemoryState(),
});

const boundRunAgent = (message: string, userId: string) =>
  runAgent(runner, message, userId);

chat.onNewMention(createMentionHandler(boundRunAgent));
chat.onSubscribedMessage(createMentionHandler(boundRunAgent));
chat.onDirectMessage(createMentionHandler(boundRunAgent));

console.log(`Server starting on port ${config.port}...`);
console.log(`Ollama: ${config.ollamaBaseUrl} (model: ${config.ollamaModel})`);
