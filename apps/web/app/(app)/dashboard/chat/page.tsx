import type { Metadata } from "next";

import { ChatScreen } from "@/components/app/chat/chat-screen";

export const metadata: Metadata = { title: "Chat" };

export default function ChatPage() {
  return <ChatScreen />;
}
