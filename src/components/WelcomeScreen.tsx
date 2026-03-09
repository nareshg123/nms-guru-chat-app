import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Code, Lightbulb, PenLine, GraduationCap } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";

const suggestions = [
  { icon: Code, label: "Help me write code", prompt: "Help me write a Python function to sort a list of objects by multiple properties" },
  { icon: Lightbulb, label: "Brainstorm ideas", prompt: "Brainstorm 10 creative startup ideas in the AI space" },
  { icon: PenLine, label: "Help me write", prompt: "Help me write a professional email to follow up after a job interview" },
  { icon: GraduationCap, label: "Learn something", prompt: "Explain quantum computing in simple terms with examples" },
];

const WelcomeScreen = () => {
  const { addMessage, activeChat, createNewChat } = useChat();

  const handleSuggestion = (prompt: string) => {
    if (!activeChat) createNewChat();
    setTimeout(() => {
      addMessage({ role: "user", content: prompt });
      setTimeout(() => {
        addMessage({
          role: "assistant",
          content: `I'd be happy to help with that! Let me work on this for you.\n\nHere's a comprehensive response to your request about "${prompt.slice(0, 40)}...":\n\n**Key Points:**\n- This is a great area to explore\n- There are multiple approaches we can take\n- I'll tailor my response to your specific needs\n\nWould you like me to elaborate on any particular aspect?`,
        });
      }, 1000);
    }, 50);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <motion.div
          initial={{ rotate: -10 }}
          animate={{ rotate: 0 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gemini-gradient-bg mb-4"
        >
          <Sparkles className="w-8 h-8 text-primary-foreground" />
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-display font-bold gemini-gradient-text mb-3">
          Hello there
        </h1>
        <p className="text-lg text-muted-foreground">
          How can I help you today?
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-3xl"
      >
        {suggestions.map((s, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            onClick={() => handleSuggestion(s.prompt)}
            className="flex flex-col items-start gap-3 p-4 rounded-xl bg-card border border-border hover:bg-muted transition-colors text-left group"
          >
            <s.icon className="w-5 h-5 text-primary" />
            <span className="text-sm text-foreground font-medium leading-tight">{s.label}</span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
