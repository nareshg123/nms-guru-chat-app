import React, { useState } from "react";
import ChatSidebar from "@/components/ChatSidebar";
import ChatMessages from "@/components/ChatMessages";
import ChatInput from "@/components/ChatInput";
import WelcomeScreen from "@/components/WelcomeScreen";
import SettingsModal from "@/components/SettingsModal";
import { ChatProvider, useChat } from "@/contexts/ChatContext";

const ChatPageInner = () => {
  const { activeChat } = useChat();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const hasMessages = activeChat && activeChat.messages.length > 0;

  return (
    <div className="flex h-screen w-full bg-background">
      <ChatSidebar onOpenSettings={() => setSettingsOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0 gemini-chat-bg">
        {hasMessages ? <ChatMessages /> : <WelcomeScreen />}
        <ChatInput />
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};

const ChatPage = () => (
  <ChatProvider>
    <ChatPageInner />
  </ChatProvider>
);

export default ChatPage;
