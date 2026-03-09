import { MessageOut } from "@/lib/types";
import { CitationCard } from "./CitationCard";
import { User, Sparkles } from "lucide-react";

interface MessageBubbleProps {
  message: MessageOut;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  const citations = Array.isArray(message.metadata.citations)
  ? (message.metadata.citations as Array<{
        uid?: string;
        display?: string;
        short?: string;
        url?: string | null;
        tier?: number;
        is_narrative?: boolean;
    }>)
  : [];

  const usedSources = Array.isArray(message.metadata.used_sources)
    ? message.metadata.used_sources.filter(
        (source): source is string => typeof source === "string"
      )
    : [];

  const confidenceScore =
    typeof message.metadata.confidence_score === "number"
      ? message.metadata.confidence_score
      : 0;

  const tierBreakdown =
    typeof message.metadata.tier_breakdown === "object" &&
    message.metadata.tier_breakdown !== null &&
    !Array.isArray(message.metadata.tier_breakdown)
      ? (message.metadata.tier_breakdown as Record<string, number>)
      : {};

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-6 animate-fade-in`}>
      <div
        className={`flex max-w-[85%] md:max-w-[75%] gap-4 ${isUser ? "flex-row-reverse" : "flex-row"
          }`}
      >
        {/* Avatar */}
        <div className="flex-0 mt-1">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-sm border border-primary/20">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary-foreground shadow-sm border border-secondary/30">
              <Sparkles className="w-4 h-4 text-secondary-foreground" />
            </div>
          )}
        </div>

        {/* Message Content */}
        <div
          className={`flex flex-col ${isUser ? "items-end" : "items-start"
            } space-y-2 max-w-full overflow-hidden`}
        >
          <div
            className={`px-5 py-3.5 rounded-2xl shadow-sm text-base leading-relaxed font-naskh ${isUser
              ? "bg-primary text-primary-foreground rounded-ss-sm shadow-md"
              : "bg-card border border-border text-card-foreground rounded-se-sm"
              }`}
          >
            <div className="whitespace-pre-wrap break-word">{message.content}</div>
          </div>

          {/* Assistant Metadata / Citations */}
          {!isUser && message.metadata && (
            <div className="w-full">
              <CitationCard
                citations={citations}
                usedSources={usedSources}
                confidenceScore={confidenceScore}
                tierBreakdown={tierBreakdown}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
