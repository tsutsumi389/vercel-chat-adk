export interface Config {
  slackBotToken: string;
  slackSigningSecret: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  port: number;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parsePort(value: string | undefined): number {
  const port = parseInt(value ?? "3000", 10);
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }
  return port;
}

export function loadConfig(): Config {
  return {
    slackBotToken: requireEnv("SLACK_BOT_TOKEN"),
    slackSigningSecret: requireEnv("SLACK_SIGNING_SECRET"),
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
    ollamaModel: process.env.OLLAMA_MODEL ?? "gpt-oss",
    port: parsePort(process.env.PORT),
  };
}
