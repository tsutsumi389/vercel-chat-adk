import "dotenv/config";
import { createServer } from "node:http";
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

const backgroundTasks: Promise<unknown>[] = [];

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

  if (url.pathname === "/webhooks/slack" && req.method === "POST") {
    const body = await new Promise<string>((resolve) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => resolve(data));
    });

    // Slack URL verification challenge を直接ハンドリング
    try {
      const parsed = JSON.parse(body);
      if (parsed.type === "url_verification") {
        console.log("Slack URL verification challenge received");
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ challenge: parsed.challenge }));
        return;
      }
    } catch {
      // JSON パース失敗は無視して通常の webhook 処理に進む
    }

    const webRequest = new Request(url.toString(), {
      method: "POST",
      headers: Object.fromEntries(
        Object.entries(req.headers)
          .filter((entry): entry is [string, string] => typeof entry[1] === "string")
      ),
      body,
    });

    const response = await chat.webhooks.slack(webRequest, {
      waitUntil: (p: Promise<unknown>) => { backgroundTasks.push(p); },
    });

    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    res.end(await response.text());
  } else {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
  }
});

server.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
  console.log(`Webhook URL: http://localhost:${config.port}/webhooks/slack`);
  console.log(`Ollama: ${config.ollamaBaseUrl} (model: ${config.ollamaModel})`);
});
