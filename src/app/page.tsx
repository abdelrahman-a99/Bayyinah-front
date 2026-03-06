"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { ConversationOut, MessageOut } from "@/lib/types";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { MessageInput } from "@/components/MessageInput";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Menu, Loader2, PanelRightOpen } from "lucide-react";
import { toast } from "sonner";

export default function ChatPage() {
  const router = useRouter();

  const { user, loading: authLoading } = useAuth();

  const [conversations, setConversations] = useState<ConversationOut[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageOut[]>([]);

  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
  if (!authLoading && !user) {
    router.push("/login");
  }
}, [authLoading, user, router]);

  // Load conversations on mount
  useEffect(() => {
    if (!user) {
      setIsLoadingConversations(false);
      setConversations([]);
      setActiveId(null);
      return;
    }

    console.log("ChatPage: Loading conversations for user", user.id);

    const controller = new AbortController();

    // Local safety: don't block the UI for more than 3s even if API is slow
    const localSafety = setTimeout(() => {
      setIsLoadingConversations(false);
    }, 3000);

    setIsLoadingConversations(true);

    api
      .getConversations()
      .then((data) => {
        if (controller.signal.aborted) return;
        console.log("ChatPage: Conversations loaded", data.length);
        setConversations(data);
        if (data.length > 0 && !activeId) {
          setActiveId(data[0].id);
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error("ChatPage: Failed to load conversations", err);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingConversations(false);
          clearTimeout(localSafety);
        }
      });

    return () => {
      controller.abort();
      clearTimeout(localSafety);
    };
  }, [user]); // exclude activeId to not loop

  // Load messages when activeId changes
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    api
      .getMessages(activeId)
      .then((data) => {
        setMessages(data);
      })
      .catch(console.error)
      .finally(() => setIsLoadingMessages(false));
  }, [activeId]);

  const handleNewConversation = async () => {
    // If the current active conversation has no messages, just use it instead of creating a new one
    if (activeId && messages.length === 0) {
      if (typeof window !== "undefined") {
        document.querySelector("textarea")?.focus();
      }
      setIsMobileSidebarOpen(false);
      return;
    }

    try {
      const newConv = await api.createConversation({ title: "محادثة جديدة" });
      setConversations([newConv, ...conversations]);
      setActiveId(newConv.id);
      setIsMobileSidebarOpen(false);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    if (!newTitle || !newTitle.trim()) return;

    try {
      const updated = await api.updateConversation(id, {
        title: newTitle.trim(),
      });
      setConversations(conversations.map((c) => (c.id === id ? updated : c)));
    } catch (error) {
      console.error("Failed to rename conversation:", error);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await api.deleteConversation(id);
      setConversations(conversations.filter((c) => c.id !== id));
      if (activeId === id) {
        const remaining = conversations.filter((c) => c.id !== id);
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
        const title =
          content.substring(0, 30) + (content.length > 30 ? "..." : "");
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

    setMessages((prev) => [...prev, userMsg]);
    setIsAiTyping(true);

    try {
      const response = await api.sendMessage(targetConvId, { content });
      // Replace temp with actual, and add AI response
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        response.user_message,
        response.assistant_message,
      ]);

      // Update conversation title if this is the first message and it was just "محادثة جديدة"
      const currentConv = conversations.find((c) => c.id === targetConvId);
      if (
        currentConv &&
        currentConv.title === "محادثة جديدة" &&
        messages.length === 0
      ) {
        const title =
          content.substring(0, 30) + (content.length > 30 ? "..." : "");
        api
          .updateConversation(targetConvId, { title })
          .then((updated) => {
            setConversations((prev) =>
              prev.map((c) => (c.id === targetConvId ? updated : c))
            );
          });
      }
    } catch (error: any) {
      console.error("Failed to send message:", error);
      // Remove the optimistic message on fail
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error(`عذراً، حدث خطأ: ${error.message}`);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Show a full-screen loader only if we have NO user and NO conversations cached
  if (
    authLoading ||
    (isLoadingConversations && conversations.length === 0)
  ) {
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
    onDelete: (id: string) => setDeleteConfirmId(id),
    onRename: handleRenameConversation,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar — collapsible */}
      <div
        className="hidden md:flex flex-col h-full shrink-0 sidebar-transition overflow-hidden"
        style={{ width: isSidebarOpen ? undefined : 0 }}
      >
        <div className="flex flex-col h-full w-72 lg:w-80">
          <Sidebar
            {...sidebarProps}
            onToggle={() => setIsSidebarOpen(false)}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 h-full min-w-0 relative">
        {/* Top bar: toggle button (desktop collapsed) + mobile header */}
        <div className="flex items-center gap-2 p-2 md:p-3 shrink-0 sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border/40 md:border-b-0">
          {/* Desktop: sidebar toggle (only visible when sidebar is closed) */}
          {!isSidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex h-9 w-9 cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="فتح القائمة الجانبية"
            >
              <PanelRightOpen className="h-5 w-5" />
            </Button>
          )}

          {/* Mobile: hamburger menu */}
          <div className="md:hidden">
            <Sheet
              open={isMobileSidebarOpen}
              onOpenChange={setIsMobileSidebarOpen}
            >
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-foreground h-9 w-9 cursor-pointer"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="p-0 w-80 border-s-0 flex flex-col h-full"
                dir="rtl"
                showCloseButton={false}
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>القائمة الجانبية</SheetTitle>
                  <SheetDescription>
                    قائمة المحادثات السابقة وخيارات الحساب
                  </SheetDescription>
                </SheetHeader>
                <Sidebar {...sidebarProps} />
              </SheetContent>
            </Sheet>
          </div>

          {/* Title — centered on mobile, hidden on desktop when sidebar is open */}
          <div
            className={`font-kufi font-bold text-base text-primary truncate flex-1 text-center md:text-start ${isSidebarOpen ? "md:hidden" : ""
              }`}
          >
            قصص الأنبياء
          </div>

          {/* Spacer for mobile centering */}
          <div className="w-9 md:hidden" />
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
            يقدم الوكيل إجابات مستندة إلى القرآن الكريم والسنة النبوية بإذن
            الله
          </p>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent dir="rtl" className="font-naskh">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-kufi">حذف المحادثة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه المحادثة بشكل دائم؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:justify-start">
            <AlertDialogAction
              className="bg-red-500! hover:bg-red-700! cursor-pointer"
              onClick={() => {
                if (deleteConfirmId) handleDeleteConversation(deleteConfirmId);
                setDeleteConfirmId(null);
              }}
            >
              حذف
            </AlertDialogAction>
            <AlertDialogCancel className="cursor-pointer border-border m-0">إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
