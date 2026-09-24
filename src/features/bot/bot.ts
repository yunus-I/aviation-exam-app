import { createTelegramBot } from "@/features/bot/service";

let botInstance: ReturnType<typeof createTelegramBot> | null = null;

export async function getTelegramBot() {
  if (!botInstance) {
    botInstance = createTelegramBot();
  }

  return botInstance;
}
