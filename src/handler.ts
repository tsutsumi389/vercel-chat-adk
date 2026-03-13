import type { Thread as ChatThread, Message as ChatMessage } from "chat";

type RunAgentFn = (message: string, userId: string) => Promise<string>;

export function createMentionHandler(runAgentFn: RunAgentFn) {
  return async (thread: ChatThread, message: ChatMessage<unknown>): Promise<void> => {
    if (!message.text?.trim()) {
      return;
    }

    await thread.startTyping();

    try {
      const response = await runAgentFn(message.text, message.author.userId);
      await thread.post(response);
    } catch {
      await thread.post("エラーが発生しました。しばらくしてからもう一度お試しください。");
    }
  };
}
