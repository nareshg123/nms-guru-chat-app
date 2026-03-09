import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useChat } from "@/contexts/ChatContext";
import { Send, ImagePlus, Paperclip, ChevronDown, X, Mic } from "lucide-react";

const MODELS = ["Gemini 2.0 Flash", "Gemini 2.0 Pro", "Gemini 1.5 Pro"];

const ChatInput = () => {
  const { addMessage, activeChat, createNewChat, selectedModel, setSelectedModel } = useChat();
  const [input, setInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!input.trim() && images.length === 0) return;
    if (!activeChat) createNewChat();
    // Small delay to ensure chat is created
    setTimeout(() => {
      addMessage({ role: "user", content: input.trim(), images });
      // Simulate AI response
      setTimeout(() => {
        addMessage({
          role: "assistant",
          content: generateResponse(input.trim()),
        });
      }, 800 + Math.random() * 1200);
      setInput("");
      setImages([]);
    }, 50);
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

  // Auto-resize textarea
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
            <span className="font-medium">{selectedModel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          {showModelPicker && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-[200px] z-10"
            >
              {MODELS.map((m) => (
                <button
                  key={m}
                  onClick={() => { setSelectedModel(m); setShowModelPicker(false); }}
                  className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors ${
                    m === selectedModel ? "text-primary font-medium bg-accent" : "text-foreground"
                  }`}
                >
                  {m}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="gemini-input-bg rounded-2xl border border-border shadow-sm">
        {/* Image previews */}
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
          {/* Upload buttons */}
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

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask Gemini..."
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground text-sm leading-relaxed max-h-[200px]"
          />

          {/* Actions */}
          <div className="flex items-center gap-1 pb-0.5">
            <button className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Mic className="w-5 h-5" />
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() && images.length === 0}
              className="w-9 h-9 rounded-lg flex items-center justify-center gemini-gradient-bg text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageUpload}
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      <p className="text-center text-xs text-muted-foreground mt-2">
        Gemini may display inaccurate info, including about people, so double-check its responses.
      </p>
    </div>
  );
};

function generateResponse(input: string): string {
  const responses = [
    `That's an interesting question! Here's what I think about "${input.slice(0, 30)}...":\n\nBased on my analysis, there are several key points to consider. First, the context matters significantly. Second, there are multiple perspectives worth exploring.\n\nWould you like me to go deeper into any particular aspect?`,
    `Great question! Let me break this down for you:\n\n1. **Understanding the basics**: The core concept revolves around fundamental principles that have been well-established.\n\n2. **Practical applications**: There are numerous real-world applications that demonstrate this effectively.\n\n3. **Future implications**: Looking ahead, we can expect significant developments in this area.\n\nIs there anything specific you'd like to explore further?`,
    `I'd be happy to help with that! Here's a comprehensive overview:\n\n**Key Insights:**\n- The topic has evolved significantly over recent years\n- Multiple approaches exist, each with their own advantages\n- Best practices suggest a balanced methodology\n\n**Recommendations:**\nI'd suggest starting with the fundamentals and building from there. Would you like more specific guidance?`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

export default ChatInput;
