import type { Thread as ChatThread, Message as ChatMessage } from "chat";

type RunAgentFn = (message: string, userId: string) => Promise<string>;

export function createMentionHandler(runAgentFn: RunAgentFn) {
  return async (thread: ChatThread, message: ChatMessage<unknown>): Promise<void> => {
    if (!message.text?.trim()) {
      return;
    }

    console.log(`[handler] Message from ${message.author.userId} (${message.text.length} chars)`);
    await thread.startTyping();

    try {
      const response = await runAgentFn(message.text, message.author.userId);
      console.log(`[handler] Response sent (${response.length} chars)`);
      await thread.post(response);
    } catch (err) {
      console.error("[handler] Error:", err instanceof Error ? err.message : err);
      await thread.post("エラーが発生しました。しばらくしてからもう一度お試しください。");
    }
  };
}
