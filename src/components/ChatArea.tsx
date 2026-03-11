import { useEffect, useRef } from "react";
import { MessageOut } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";
import { BookOpenText } from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";

interface ChatAreaProps {
  messages: MessageOut[];
  isLoading: boolean;
  isInitialLoading?: boolean;
  onSuggestedQuestionClick?: (question: string) => void;
}

export function ChatArea({ messages, isLoading, isInitialLoading, onSuggestedQuestionClick }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  const hasStreamingAssistant = messages.some(
    (msg) =>
      msg.role === "assistant" &&
      ((typeof msg.metadata.is_streaming === "boolean" && msg.metadata.is_streaming) ||
        (typeof msg.metadata.streaming_status === "string" && !msg.content))
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (isInitialLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 shadow-sm">
          <BookOpenText className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold font-kufi text-foreground mb-3">مرحباً بك في بَيِّنَة</h2>
        <p className="text-muted-foreground text-lg font-naskh max-w-2xl leading-relaxed">
          يمكنك طرح أي سؤال ديني، وسأجيبك استناداً إلى القرآن الكريم والتفاسير والحديث الشريف والمصادر السردية الموثقة.
        </p>

        <div className="mt-8 flex flex-col md:flex-row flex-wrap justify-center gap-3 w-full max-w-2xl px-4">
          <button
            type="button"
            onClick={() => onSuggestedQuestionClick?.("ما هي معجزات النبي موسى عليه السلام؟")}
            className="px-5 py-3 rounded-full border border-border/50 text-center text-sm font-naskh text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-all duration-150 ease-out active:scale-[0.98] active:brightness-95 cursor-pointer shadow-sm"
          >
            ما هي معجزات النبي موسى عليه السلام؟
          </button>

          <button
            type="button"
            onClick={() => onSuggestedQuestionClick?.("حدثني عن قصة أصحاب الكهف والعبرة منها")}
            className="px-5 py-3 rounded-full border border-border/50 text-center text-sm font-naskh text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-all duration-150 ease-out active:scale-[0.98] active:brightness-95 cursor-pointer shadow-sm"
          >
            حدثني عن قصة أصحاب الكهف والعبرة منها
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 chat-scrollbar space-y-2">
      <div className="max-w-4xl mx-auto w-full">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && !hasStreamingAssistant && (
          <div className="flex w-full justify-start mb-6 animate-fade-in">
            <div className="flex gap-4 flex-row">
              <div className="flex-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary-foreground shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
