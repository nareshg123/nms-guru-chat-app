import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Moon, Sun, Globe, Shield, Trash2, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const SettingsModal = ({ open, onClose }: SettingsModalProps) => {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = React.useState(
    document.documentElement.classList.contains("dark")
  );

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setDarkMode(!darkMode);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[500px] md:max-h-[80vh] bg-card rounded-2xl border border-border shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-display font-semibold text-foreground">Settings</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Profile */}
              {user && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted">
                  <div className="w-12 h-12 rounded-full gemini-gradient-bg flex items-center justify-center text-primary-foreground text-lg font-bold">
                    {user.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              )}

              {/* Theme */}
              <SettingsItem
                icon={darkMode ? Moon : Sun}
                label="Theme"
                description={darkMode ? "Dark mode" : "Light mode"}
                action={
                  <button
                    onClick={toggleDark}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      darkMode ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-card absolute top-0.5 transition-transform ${
                        darkMode ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                }
              />

              {/* Language */}
              <SettingsItem
                icon={Globe}
                label="Language"
                description="English"
                action={<ChevronRight className="w-5 h-5 text-muted-foreground" />}
              />

              {/* Privacy */}
              <SettingsItem
                icon={Shield}
                label="Privacy & Safety"
                description="Manage your data"
                action={<ChevronRight className="w-5 h-5 text-muted-foreground" />}
              />

              {/* Delete Data */}
              <SettingsItem
                icon={Trash2}
                label="Delete all chats"
                description="This cannot be undone"
                action={
                  <button className="px-3 py-1.5 rounded-lg text-sm text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors">
                    Delete
                  </button>
                }
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const SettingsItem = ({
  icon: Icon,
  label,
  description,
  action,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  action: React.ReactNode;
}) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    {action}
  </div>
);

export default SettingsModal;
