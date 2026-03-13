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

const MAX_BODY = 256 * 1024;

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

  if (url.pathname === "/webhooks/slack" && req.method === "POST") {
    const body = await new Promise<string>((resolve, reject) => {
      let data = "";
      req.on("data", (chunk) => {
        data += chunk;
        if (data.length > MAX_BODY) {
          req.destroy();
          reject(new Error("Payload too large"));
        }
      });
      req.on("end", () => resolve(data));
    }).catch(() => {
      res.writeHead(413);
      res.end("Payload too large");
      return null;
    });

    if (body === null) return;

    let parsed: Record<string, unknown> | undefined;
    try {
      parsed = JSON.parse(body);
    } catch {
      // JSON パース失敗は adapter に任せる
    }

    if (parsed?.type === "url_verification") {
      console.log("[webhook] URL verification challenge received");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ challenge: parsed.challenge }));
      return;
    }

    console.log("[webhook] Received event:", parsed?.type ?? "unknown");

    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === "string") headers[key] = value;
    }

    const webRequest = new Request(url.toString(), {
      method: "POST",
      headers,
      body,
    });

    const response = await chat.webhooks.slack(webRequest, {
      waitUntil: (p: Promise<unknown>) => {
        p.catch((err) => console.error("[bg] Task failed:", err));
      },
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
