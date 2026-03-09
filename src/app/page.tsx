"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { ConversationOut, MessageOut } from "@/lib/types";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { MessageInput } from "@/components/MessageInput";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Menu, Loader2, PanelRightOpen } from "lucide-react";
import { toast } from "sonner";

export default function ChatPage() {
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

  // Load conversations when authenticated user changes
  useEffect(() => {
    if (!user?.id) {
      setConversations([]);
      setActiveId(null);
      setMessages([]);
      setIsLoadingConversations(false);
      return;
    }

    setIsLoadingConversations(true);
    api.getConversations()
      .then((data) => {
        setConversations(data);
        setActiveId((currentActiveId) => {
          if (currentActiveId && data.some((conversation) => conversation.id === currentActiveId)) {
            return currentActiveId;
          }
          return data.length > 0 ? data[0].id : null;
        });
      })
      .catch((error) => {
        console.error("Failed to load conversations:", error);
      })
      .finally(() => setIsLoadingConversations(false));
  }, [user?.id]);

  // Load messages when active conversation changes
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
      .catch((error) => {
        console.error("Failed to load messages:", error);
      })
      .finally(() => setIsLoadingMessages(false));
  }, [activeId]);

  const handleNewConversation = async () => {
    // If current chat is already empty, reuse it instead of creating another one
    if (activeId && messages.length === 0) {
      if (typeof window !== "undefined") {
        document.querySelector("textarea")?.focus();
      }
      setIsMobileSidebarOpen(false);
      return;
    }

    try {
      const newConv = await api.createConversation({ title: "محادثة جديدة" });
      setConversations((prev) => [newConv, ...prev]);
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
      setConversations((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (error) {
      console.error("Failed to rename conversation:", error);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await api.deleteConversation(id);

      setConversations((prev) => {
        const remaining = prev.filter((c) => c.id !== id);

        setActiveId((currentActiveId) => {
          if (currentActiveId === id) {
            return remaining.length > 0 ? remaining[0].id : null;
          }
          return currentActiveId;
        });

        return remaining;
      });
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    let targetConvId = activeId;

    if (!targetConvId) {
      try {
        const title =
          content.substring(0, 30) + (content.length > 30 ? "..." : "");
        const newConv = await api.createConversation({ title });
        setConversations((prev) => [newConv, ...prev]);
        targetConvId = newConv.id;
        setActiveId(newConv.id);
      } catch (error) {
        console.error("Failed to create auto-conversation:", error);
        return;
      }
    }

    if (!targetConvId) return;

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

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        response.user_message,
        response.assistant_message,
      ]);

      const currentConv = conversations.find((c) => c.id === targetConvId);
      if (
        currentConv &&
        currentConv.title === "محادثة جديدة" &&
        messages.length === 0
      ) {
        const title =
          content.substring(0, 30) + (content.length > 30 ? "..." : "");

        api.updateConversation(targetConvId, { title }).then((updated) => {
          setConversations((prev) =>
            prev.map((c) => (c.id === targetConvId ? updated : c))
          );
        });
      }
    } catch (error: unknown) {
      console.error("Failed to send message:", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));

      const message =
        error instanceof Error ? error.message : "حدث خطأ غير متوقع";
      toast.error(`عذراً، حدث خطأ: ${message}`);
    } finally {
      setIsAiTyping(false);
    }
  };

  if (authLoading || isLoadingConversations) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-kufi animate-pulse">
            جاري الاتصال بالخادم...
          </p>
        </div>
      </div>
    );
  }

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
      {/* Desktop Sidebar */}
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
        {/* Top Bar */}
        <div className="flex items-center gap-2 p-2 md:p-3 shrink-0 sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border/40 md:border-b-0">
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

          <div
            className={`font-kufi font-bold text-base text-primary truncate flex-1 text-center md:text-start ${
              isSidebarOpen ? "md:hidden" : ""
            }`}
          >
            قصص الأنبياء
          </div>

          <div className="w-9 md:hidden" />
        </div>

        {/* Messages Space */}
        <ChatArea
          messages={messages}
          isLoading={isAiTyping}
          isInitialLoading={isLoadingMessages}
        />

        {/* Input Area */}
        <div className="p-3 md:p-6 bg-linear-to-t from-background via-background to-transparent shrink-0">
          <MessageInput
            onSend={handleSendMessage}
            disabled={isAiTyping || isLoadingMessages}
          />
          <p className="text-center text-xs text-muted-foreground mt-3 font-naskh hidden md:block">
            يقدم الوكيل إجابات مستندة إلى القرآن الكريم والسنة النبوية بإذن الله
          </p>
        </div>
      </div>

      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <AlertDialogContent dir="rtl" className="font-naskh">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-kufi">
              حذف المحادثة
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه المحادثة بشكل دائم؟ لا يمكن التراجع عن هذا
              الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:justify-start">
            <AlertDialogAction
              className="bg-red-500! hover:bg-red-700! cursor-pointer"
              onClick={() => {
                if (deleteConfirmId) {
                  void handleDeleteConversation(deleteConfirmId);
                }
                setDeleteConfirmId(null);
              }}
            >
              حذف
            </AlertDialogAction>
            <AlertDialogCancel className="cursor-pointer border-border m-0">
              إلغاء
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
