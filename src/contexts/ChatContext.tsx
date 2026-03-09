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

interface ChatContextType {
  chats: Chat[];
  activeChat: Chat | null;
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  createNewChat: () => void;
  setActiveChat: (id: string) => void;
  addMessage: (msg: Omit<Message, "id" | "timestamp">) => void;
  deleteChat: (id: string) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
};

const MODELS = ["Gemini 2.0 Flash", "Gemini 2.0 Pro", "Gemini 1.5 Pro"];

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);

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

  const deleteChat = (id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (activeChatId === id) setActiveChatId(null);
  };

  return (
    <ChatContext.Provider
      value={{ chats, activeChat, selectedModel, setSelectedModel, createNewChat, setActiveChat, addMessage, deleteChat }}
    >
      {children}
    </ChatContext.Provider>
  );
};
