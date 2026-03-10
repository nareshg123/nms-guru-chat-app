import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const WelcomeScreen = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
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
    </div>
  );
};

export default WelcomeScreen;
