import { useState, useRef, useEffect } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [content]);

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setContent("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative flex items-end w-full max-w-4xl mx-auto bg-background border border-border rounded-2xl p-2 shadow-sm focus-within:ring-1 focus-within:ring-primary/50 transition-all">
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="اسأل عن قصص الأنبياء..."
        disabled={disabled}
        className="min-h-[44px] max-h-[200px] border-0 focus-visible:ring-0 resize-none font-naskh text-base py-3 px-4 shadow-none bg-transparent"
        dir="rtl"
        rows={1}
      />
      <div className="absolute left-2 bottom-2 md:left-3 md:bottom-3 shrink-0 rtl:left-2 rtl:right-auto ltr:right-2 ltr:left-auto">
        <Button
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          size="icon"
          className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm rtl-flip"
        >
          <SendHorizontal className="h-5 w-5 md:h-6 md:w-6" />
        </Button>
      </div>
    </div>
  );
}
