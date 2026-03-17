import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

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

export const ALL_MODELS = [
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", provider: "google" },
  { id: "gemini-2.0-pro", label: "Gemini 2.0 Pro", provider: "google" },
  { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", provider: "google" },
  { id: "nano-banana", label: "Nano Banana", provider: "google" },
  { id: "gpt-4o", label: "ChatGPT 4o", provider: "openai" },
  { id: "gpt-4o-mini", label: "ChatGPT 4o Mini", provider: "openai" },
  { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4", provider: "anthropic" },
  { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku", provider: "anthropic" },
];

export const GUEST_MODELS = [
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", provider: "google" },
];

const STORAGE_KEY = "guru_chats";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function loadChatsFromStorage(): Chat[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored).map((c: any) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      messages: c.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })),
    }));
  } catch {
    return [];
  }
}

function saveChatsToStorage(chats: Chat[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch {}
}

interface ChatContextType {
  chats: Chat[];
  activeChat: Chat | null;
  selectedModel: string;
  isLoading: boolean;
  availableModels: typeof ALL_MODELS;
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

// Sync chat to backend DB for logged-in users
async function syncChatToDb(chat: Chat, userEmail: string) {
  try {
    await fetch(`${API_BASE}/chats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat, userEmail }),
    });
  } catch {}
}

async function deleteChatFromDb(chatId: string, userEmail: string) {
  try {
    await fetch(`${API_BASE}/chats/${chatId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userEmail }),
    });
  } catch {}
}

async function loadChatsFromDb(userEmail: string): Promise<Chat[]> {
  try {
    const resp = await fetch(`${API_BASE}/chats?userEmail=${encodeURIComponent(userEmail)}`);
    if (!resp.ok) return [];
    const data = await resp.json();
    return data.map((c: any) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      messages: c.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })),
    }));
  } catch {
    return [];
  }
}

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>(loadChatsFromStorage);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(
    user ? ALL_MODELS[0].id : GUEST_MODELS[0].id
  );
  const [isLoading, setIsLoading] = useState(false);

  const availableModels = user ? ALL_MODELS : GUEST_MODELS;

  // Save to localStorage whenever chats change
  useEffect(() => {
    saveChatsToStorage(chats);
  }, [chats]);

  // Load from DB when user logs in, merge with localStorage
  useEffect(() => {
    if (user) {
      loadChatsFromDb(user.email).then((dbChats) => {
        if (dbChats.length > 0) {
          setChats((prev) => {
            const existingIds = new Set(prev.map((c) => c.id));
            const newChats = dbChats.filter((c) => !existingIds.has(c.id));
            const merged = [...prev, ...newChats].sort(
              (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
            return merged;
          });
        }
      });
    }
  }, [user]);

  // Reset model when auth state changes
  useEffect(() => {
    if (!user) {
      setSelectedModel(GUEST_MODELS[0].id);
    }
  }, [user]);

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
    setChats((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== activeChatId) return c;
        const u = { ...c, messages: [...c.messages, newMsg], updatedAt: new Date() };
        if (c.messages.length === 0 && msg.role === "user") {
          u.title = msg.content.slice(0, 40) + (msg.content.length > 40 ? "..." : "");
        }
        // Sync to DB for logged-in users
        if (user) syncChatToDb(u, user.email);
        return u;
      });
      return updated;
    });
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
        const updated = { ...c, messages: msgs, updatedAt: new Date() };
        // Sync final message to DB
        if (user && content.length > 0) syncChatToDb(updated, user.email);
        return updated;
      })
    );
  };

  const deleteChat = (id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (activeChatId === id) setActiveChatId(null);
    if (user) deleteChatFromDb(id, user.email);
  };

  return (
    <ChatContext.Provider
      value={{
        chats, activeChat, selectedModel, isLoading, availableModels,
        setSelectedModel, createNewChat, setActiveChat,
        addMessage, updateLastAssistantMessage, deleteChat, setIsLoading,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
