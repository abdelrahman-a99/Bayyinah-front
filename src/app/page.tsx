"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { ConversationOut, MessageOut } from "@/lib/types";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { MessageInput } from "@/components/MessageInput";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Menu, Loader2 } from "lucide-react";

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();

  const [conversations, setConversations] = useState<ConversationOut[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageOut[]>([]);

  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    if (!user) {
      setIsLoadingConversations(false);
      return;
    }

    setIsLoadingConversations(true);
    api.getConversations()
      .then((data) => {
        setConversations(data);
        if (data.length > 0 && !activeId) {
          setActiveId(data[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingConversations(false));
  }, [user]); // exclude activeId to not loop

  // Load messages when activeId changes
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    api.getMessages(activeId)
      .then((data) => {
        setMessages(data);
      })
      .catch(console.error)
      .finally(() => setIsLoadingMessages(false));
  }, [activeId]);

  const handleNewConversation = async () => {
    try {
      const newConv = await api.createConversation({ title: "محادثة جديدة" });
      setConversations([newConv, ...conversations]);
      setActiveId(newConv.id);
      setIsMobileSidebarOpen(false);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const handleRenameConversation = async (id: string) => {
    const title = window.prompt("أدخل الاسم الجديد للمحادثة:");
    if (!title || !title.trim()) return;

    try {
      const updated = await api.updateConversation(id, { title: title.trim() });
      setConversations(conversations.map(c => c.id === id ? updated : c));
    } catch (error) {
      console.error("Failed to rename conversation:", error);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    const confirmed = window.confirm("هل أنت متأكد من حذف هذه المحادثة بشكل دائم؟");
    if (!confirmed) return;

    try {
      await api.deleteConversation(id);
      setConversations(conversations.filter(c => c.id !== id));
      if (activeId === id) {
        const remaining = conversations.filter(c => c.id !== id);
        setActiveId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    let targetConvId = activeId;

    // Create new conversation if none active
    if (!targetConvId) {
      try {
        // use the first words as title, up to 30 chars
        const title = content.substring(0, 30) + (content.length > 30 ? "..." : "");
        const newConv = await api.createConversation({ title });
        setConversations([newConv, ...conversations]);
        targetConvId = newConv.id;
        setActiveId(newConv.id);
      } catch (error) {
        console.error("Failed to create auto-conversation:", error);
        return;
      }
    }

    // Optimistically add user message
    const tempId = `temp-${Date.now()}`;
    const userMsg: MessageOut = {
      id: tempId,
      conversation_id: targetConvId,
      role: "user",
      content,
      metadata: {},
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsAiTyping(true);

    try {
      const response = await api.sendMessage(targetConvId, { content });
      // Replace temp with actual, and add AI response
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempId),
        response.user_message,
        response.assistant_message
      ]);

      // Update conversation title if this is the first message and it was just "محادثة جديدة"
      const currentConv = conversations.find(c => c.id === targetConvId);
      if (currentConv && currentConv.title === "محادثة جديدة" && messages.length === 0) {
        const title = content.substring(0, 30) + (content.length > 30 ? "..." : "");
        api.updateConversation(targetConvId, { title }).then(updated => {
          setConversations(prev => prev.map(c => c.id === targetConvId ? updated : c));
        });
      }
    } catch (error: any) {
      console.error("Failed to send message:", error);
      // Remove the optimistic message on fail
      setMessages(prev => prev.filter(m => m.id !== tempId));
      alert(`عذراً، حدث خطأ: ${error.message}`);
    } finally {
      setIsAiTyping(false);
    }
  };

  if (authLoading || isLoadingConversations) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Define sidebar props object for reuse
  const sidebarProps = {
    conversations,
    activeId,
    onSelect: (id: string) => {
      setActiveId(id);
      setIsMobileSidebarOpen(false);
    },
    onNew: handleNewConversation,
    onDelete: handleDeleteConversation,
    onRename: handleRenameConversation,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full z-10">
        <Sidebar {...sidebarProps} />
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 h-full min-w-0 relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-3 border-b border-border/40 bg-background/80 backdrop-blur z-20 sticky top-0">
          <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-foreground">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 w-80 border-r-0" dir="rtl">
              <VisuallyHidden>
                <SheetTitle>القائمة الجانبية</SheetTitle>
              </VisuallyHidden>
              <Sidebar {...sidebarProps} />
            </SheetContent>
          </Sheet>

          <div className="font-kufi font-bold text-lg text-primary truncate">قصص الأنبياء</div>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        {/* Messages Space */}
        <ChatArea
          messages={messages}
          isLoading={isAiTyping}
          isInitialLoading={isLoadingMessages}
        />

        {/* Input Area */}
        <div className="p-3 md:p-6 bg-gradient-to-t from-background via-background to-transparent shrink-0">
          <MessageInput
            onSend={handleSendMessage}
            disabled={isAiTyping || isLoadingMessages}
          />
          <p className="text-center text-xs text-muted-foreground mt-3 font-naskh hidden md:block">
            يقدم الوكيل إجابات مستندة إلى القرآن الكريم والسنة النبوية بإذن الله
          </p>
        </div>
      </div>
    </div>
  );
}
