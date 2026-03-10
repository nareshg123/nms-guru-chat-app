import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useChat, MODELS } from "@/contexts/ChatContext";
import { sendChatMessage } from "@/lib/api";
import { Send, ImagePlus, Paperclip, ChevronDown, X, Mic } from "lucide-react";
import { toast } from "sonner";

const ChatInput = () => {
  const {
    addMessage, activeChat, createNewChat, selectedModel,
    setSelectedModel, isLoading, setIsLoading, updateLastAssistantMessage,
  } = useChat();
  const [input, setInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  const handleSend = async () => {
    if ((!input.trim() && images.length === 0) || isLoading) return;
    if (!activeChat) createNewChat();

    const userContent = input.trim();
    setInput("");
    setImages([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // Wait for chat creation
    await new Promise((r) => setTimeout(r, 50));

    addMessage({ role: "user", content: userContent, images });
    addMessage({ role: "assistant", content: "" });
    setIsLoading(true);

    let accumulated = "";
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const history = activeChat?.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })) || [];

      await sendChatMessage(
        [...history, { role: "user" as const, content: userContent }],
        selectedModel,
        (delta) => {
          accumulated += delta;
          updateLastAssistantMessage(accumulated);
        },
        () => setIsLoading(false),
        controller.signal
      );
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast.error(err.message || "Failed to get response");
        updateLastAssistantMessage("Sorry, something went wrong. Please try again.");
      }
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setImages((prev) => [...prev, ev.target!.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      {/* Model Selector */}
      <div className="flex justify-center mb-3">
        <div className="relative">
          <button
            onClick={() => setShowModelPicker(!showModelPicker)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-secondary text-sm text-foreground transition-colors"
          >
            <span className="font-medium">{currentModel.label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          {showModelPicker && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-[220px] z-10"
            >
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setSelectedModel(m.id); setShowModelPicker(false); }}
                  className={`flex items-center justify-between w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors ${
                    m.id === selectedModel ? "text-primary font-medium bg-accent" : "text-foreground"
                  }`}
                >
                  <span>{m.label}</span>
                  <span className="text-xs text-muted-foreground capitalize">{m.provider}</span>
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="gemini-input-bg rounded-2xl border border-border shadow-sm">
        {images.length > 0 && (
          <div className="flex gap-2 p-3 pb-0 flex-wrap">
            {images.map((img, idx) => (
              <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-foreground/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-primary-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 p-3">
          <div className="flex items-center gap-1 pb-0.5">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Upload image"
            >
              <ImagePlus className="w-5 h-5" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask Guru..."
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground text-sm leading-relaxed max-h-[200px]"
          />

          <div className="flex items-center gap-1 pb-0.5">
            <button className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Mic className="w-5 h-5" />
            </button>
            <button
              onClick={handleSend}
              disabled={(!input.trim() && images.length === 0) || isLoading}
              className="w-9 h-9 rounded-lg flex items-center justify-center gemini-gradient-bg text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleImageUpload} />
      </div>

      <p className="text-center text-xs text-muted-foreground mt-2">
        Guru may display inaccurate info, so double-check its responses.
      </p>
    </div>
  );
};

export default ChatInput;
