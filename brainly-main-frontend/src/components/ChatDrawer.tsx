import { useState, useRef, useEffect } from "react";
import { SparklesIcon } from "../icons/SparklesIcon";
import { CrossIcon } from "./CrossIcon";
import { YoutubeIcon } from "../icons/YoutubeIcon";
import { ArticleIcon } from "../icons/ArticleIcon";
import { useSendChatMessage, type ChatMessage, type ChatSource } from "../hooks/useContentQuery";

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

export function ChatDrawer({ open, onClose, initialPrompt }: ChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I am **NestAI**, your personal Second Brain assistant.\n\nAsk me anything about your saved bookmarks, videos, and articles — I'll synthesize answers with exact video moments and citations.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatMutation = useSendChatMessage();

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatMutation.isPending]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      if (initialPrompt) {
        setInput(initialPrompt);
      }
    }
  }, [open, initialPrompt]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || chatMutation.isPending) return;

    const userMessage: ChatMessage = {
      id: String(Date.now()),
      role: "user",
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");

    // Prepare conversational history
    const history = messages
      .filter(m => m.id !== "welcome")
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const data = await chatMutation.mutateAsync({
        message: textToSend,
        history
      });

      const assistantMessage: ChatMessage = {
        id: String(Date.now() + 1),
        role: "assistant",
        content: data.reply,
        sources: data.sources || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: String(Date.now() + 1),
        role: "assistant",
        content: "Sorry, I ran into an error generating an answer. Please check your connection or try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Chat cleared! What else would you like to explore in your Second Brain?",
        timestamp: new Date()
      }
    ]);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Slide-Over Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col border-l border-gray-200">
          
          {/* Header */}
          <div className="p-4 px-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 via-white to-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-200">
                <SparklesIcon className="size-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900">NestAI</h3>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Second Brain
                  </span>
                </div>
                <p className="text-xs text-gray-400">Synthesizing answers with timestamps</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                title="Clear conversation"
              >
                Clear
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                title="Close drawer (ESC)"
              >
                <CrossIcon />
              </button>
            </div>
          </div>

          {/* Conversation Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-gray-50/40">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                {/* Bubble */}
                <div
                  className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
                    msg.role === "user"
                      ? "bg-purple-600 text-white rounded-br-xs"
                      : "bg-white text-gray-800 border border-gray-100 rounded-bl-xs"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>

                {/* Sources & Video Moments (for Assistant replies) */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2.5 max-w-[90%] sm:max-w-[85%] w-full space-y-1.5">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider pl-1">
                      Cited Sources & Video Moments:
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {msg.sources.map((src: ChatSource) => (
                        <a
                          key={src.id}
                          href={src.jumpUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white border border-gray-100 hover:border-purple-200 hover:shadow-xs transition-all text-xs group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                              [{src.id}]
                            </span>
                            <span className="shrink-0 text-gray-400">
                              {src.type === "youtube" ? <YoutubeIcon /> : <ArticleIcon />}
                            </span>
                            <span className="font-medium text-gray-700 truncate group-hover:text-purple-700 transition-colors">
                              {src.title}
                            </span>
                          </div>

                          {src.timestamp ? (
                            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold text-[11px] group-hover:bg-purple-600 group-hover:text-white transition-colors">
                              <span>▶</span>
                              <span>{src.timestamp}</span>
                            </span>
                          ) : (
                            <span className="shrink-0 text-gray-400 text-[11px] group-hover:text-purple-600">
                              ↗ Open
                            </span>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing / Loading indicator */}
            {chatMutation.isPending && (
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs shrink-0 shadow-xs">
                  <SparklesIcon className="size-4" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-xs px-4 py-3 shadow-xs flex items-center gap-2 text-xs text-gray-500">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span>Searching Second Brain & synthesizing answer...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Starters (if only welcome message) */}
          {messages.length === 1 && (
            <div className="px-6 py-2 bg-gray-50/50 flex flex-wrap gap-1.5 border-t border-gray-100">
              <button
                onClick={() => handleSend("Which programming language should I choose for DSA?")}
                className="text-xs bg-white border border-gray-200 hover:border-purple-300 text-gray-600 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                💡 Which language for DSA?
              </button>
              <button
                onClick={() => handleSend("How many problems are solved in Striver playlist?")}
                className="text-xs bg-white border border-gray-200 hover:border-purple-300 text-gray-600 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                🔢 How many problems solved?
              </button>
              <button
                onClick={() => handleSend("Summarize the Dan Luu productivity article")}
                className="text-xs bg-white border border-gray-200 hover:border-purple-300 text-gray-600 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                📄 Dan Luu velocity vs productivity
              </button>
            </div>
          )}

          {/* Footer Input */}
          <div className="p-4 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-2 p-2 rounded-2xl border border-gray-200 focus-within:border-purple-600 focus-within:ring-2 focus-within:ring-purple-100 transition-all bg-white shadow-xs">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask NestAI about your bookmarks... (Enter to send)"
                className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none px-2 max-h-28"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || chatMutation.isPending}
                className="p-2 rounded-xl bg-purple-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors shadow-xs cursor-pointer shrink-0"
                title="Send message"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                  <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              Powered by Google Gemini RAG &bull; Press <kbd className="font-mono bg-gray-100 px-1 py-0.5 rounded">Enter</kbd> to send, <kbd className="font-mono bg-gray-100 px-1 py-0.5 rounded">Shift+Enter</kbd> for new line
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

