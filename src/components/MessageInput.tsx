import { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";
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
    <div className="flex items-end w-full max-w-2xl mx-auto bg-muted/60 rounded-[1.75rem] p-2 focus-within:bg-muted/80 transition-colors">
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="اسأل عن قصص الأنبياء..."
        disabled={disabled}
        className="flex-1 min-h-12 max-h-50 border-0 focus-visible:ring-0 focus-visible:border-transparent resize-none font-naskh text-base py-3 px-4 shadow-none bg-transparent overflow-y-auto leading-relaxed"
        style={{ fieldSizing: "content" }}
        dir="rtl"
        rows={1}
      />
      <div className="shrink-0 ms-1 me-1 mb-1.5">
        <Button
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          size="icon"
          className="h-9 w-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm cursor-pointer flex items-center justify-center p-0"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
