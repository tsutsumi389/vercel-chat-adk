type RunAgentFn = (message: string, userId: string) => Promise<string>;

interface Thread {
  post(message: string): Promise<unknown>;
  startTyping(status?: string): Promise<void>;
}

interface Message {
  text: string;
  author: { id: string };
}

export function createMentionHandler(runAgentFn: RunAgentFn) {
  return async (thread: Thread, message: Message): Promise<void> => {
    if (!message.text?.trim()) {
      return;
    }

    await thread.startTyping();

    try {
      const response = await runAgentFn(message.text, message.author.id);
      await thread.post(response);
    } catch {
      await thread.post("エラーが発生しました。しばらくしてからもう一度お試しください。");
    }
  };
}
