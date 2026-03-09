import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus, MessageSquare, Trash2, Settings, LogOut, ChevronLeft, ChevronRight,
  Sparkles, Menu, X
} from "lucide-react";

interface ChatSidebarProps {
  onOpenSettings: () => void;
}

const ChatSidebar = ({ onOpenSettings }: ChatSidebarProps) => {
  const { chats, activeChat, createNewChat, setActiveChat, deleteChat } = useChat();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg gemini-gradient-bg flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-display font-semibold text-foreground truncate">Guru</span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-3 mb-2">
        <button
          onClick={() => { createNewChat(); setMobileOpen(false); }}
          className={`flex items-center gap-2 w-full py-2.5 rounded-xl border border-border hover:bg-muted transition-colors ${collapsed ? "justify-center px-2" : "px-4"}`}
        >
          <Plus className="w-4 h-4 text-foreground shrink-0" />
          {!collapsed && <span className="text-sm font-medium text-foreground">New chat</span>}
        </button>
      </div>

      {/* Recent Chats */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2">
        {!collapsed && chats.length > 0 && (
          <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent</p>
        )}
        <div className="space-y-0.5">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => { setActiveChat(chat.id); setMobileOpen(false); }}
              className={`group flex items-center gap-2 w-full rounded-lg transition-colors ${
                collapsed ? "justify-center p-2" : "px-3 py-2"
              } ${
                activeChat?.id === chat.id
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="text-sm truncate flex-1 text-left">{chat.title}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-border p-3 space-y-1">
        <button
          onClick={onOpenSettings}
          className={`flex items-center gap-2 w-full rounded-lg hover:bg-muted transition-colors text-foreground ${collapsed ? "justify-center p-2" : "px-3 py-2"}`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-sm">Settings</span>}
        </button>
        <button
          onClick={logout}
          className={`flex items-center gap-2 w-full rounded-lg hover:bg-muted transition-colors text-foreground ${collapsed ? "justify-center p-2" : "px-3 py-2"}`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-sm">Log out</span>}
        </button>
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-7 h-7 rounded-full gemini-gradient-bg flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
              {user.name[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="md:hidden fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="md:hidden fixed left-0 top-0 bottom-0 w-[280px] gemini-sidebar-bg border-r border-border z-50"
          >
            {sidebarContent}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.div
        animate={{ width: collapsed ? 68 : 280 }}
        transition={{ duration: 0.2 }}
        className="hidden md:flex flex-col gemini-sidebar-bg border-r border-border shrink-0"
      >
        {sidebarContent}
      </motion.div>
    </>
  );
};

export default ChatSidebar;
