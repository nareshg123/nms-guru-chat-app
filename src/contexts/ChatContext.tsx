import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  images?: string[];
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

export const MODELS = [
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", provider: "google" },
  { id: "gemini-2.0-pro", label: "Gemini 2.0 Pro", provider: "google" },
  { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", provider: "google" },
  { id: "nano-banana", label: "Nano Banana", provider: "google" },
  { id: "gpt-4o", label: "ChatGPT 4o", provider: "openai" },
  { id: "gpt-4o-mini", label: "ChatGPT 4o Mini", provider: "openai" },
  { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4", provider: "anthropic" },
  { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku", provider: "anthropic" },
];

interface ChatContextType {
  chats: Chat[];
  activeChat: Chat | null;
  selectedModel: string;
  isLoading: boolean;
  setSelectedModel: (m: string) => void;
  createNewChat: () => void;
  setActiveChat: (id: string) => void;
  addMessage: (msg: Omit<Message, "id" | "timestamp">) => void;
  updateLastAssistantMessage: (content: string) => void;
  deleteChat: (id: string) => void;
  setIsLoading: (v: boolean) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [isLoading, setIsLoading] = useState(false);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  const createNewChat = () => {
    const newChat: Chat = {
      id: crypto.randomUUID(),
      title: "New chat",
      messages: [],
      model: selectedModel,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  };

  const setActiveChat = (id: string) => setActiveChatId(id);

  const addMessage = (msg: Omit<Message, "id" | "timestamp">) => {
    const newMsg: Message = { ...msg, id: crypto.randomUUID(), timestamp: new Date() };
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== activeChatId) return c;
        const updated = { ...c, messages: [...c.messages, newMsg], updatedAt: new Date() };
        if (c.messages.length === 0 && msg.role === "user") {
          updated.title = msg.content.slice(0, 40) + (msg.content.length > 40 ? "..." : "");
        }
        return updated;
      })
    );
  };

  const updateLastAssistantMessage = (content: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== activeChatId) return c;
        const msgs = [...c.messages];
        const lastIdx = msgs.length - 1;
        if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
          msgs[lastIdx] = { ...msgs[lastIdx], content };
        }
        return { ...c, messages: msgs, updatedAt: new Date() };
      })
    );
  };

  const deleteChat = (id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (activeChatId === id) setActiveChatId(null);
  };

  return (
    <ChatContext.Provider
      value={{
        chats, activeChat, selectedModel, isLoading,
        setSelectedModel, createNewChat, setActiveChat,
        addMessage, updateLastAssistantMessage, deleteChat, setIsLoading,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
