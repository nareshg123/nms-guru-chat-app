import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useChat, Message } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";

const ChatMessages = () => {
  const { activeChat } = useChat();
  const { user } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  if (!activeChat || activeChat.messages.length === 0) return null;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {activeChat.messages.map((msg, i) => (
          <MessageBubble key={msg.id} message={msg} userName={user?.name || "You"} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

const MessageBubble = ({ message, userName }: { message: Message; userName: string }) => {
  const isUser = message.role === "user";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    toast.success("Copied to clipboard");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? "justify-end" : ""}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full gemini-gradient-bg flex items-center justify-center shrink-0 mt-1">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
      )}

      <div className={`max-w-[85%] ${isUser ? "order-first" : ""}`}>
        {/* Images */}
        {message.images && message.images.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap justify-end">
            {message.images.map((img, i) => (
              <img key={i} src={img} alt="" className="max-w-[200px] rounded-xl" />
            ))}
          </div>
        )}

        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-gemini-user-bubble text-foreground ml-auto"
              : "bg-transparent text-foreground"
          }`}
        >
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content.split(/(\*\*.*?\*\*)/).map((part, i) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={i}>{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </div>
        </div>

        {/* Actions for AI messages */}
        {!isUser && (
          <div className="flex items-center gap-1 mt-1.5 ml-1">
            <button
              onClick={copyToClipboard}
              className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
            <button className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1 text-primary-foreground text-xs font-bold">
          {userName[0].toUpperCase()}
        </div>
      )}
    </motion.div>
  );
};

export default ChatMessages;
