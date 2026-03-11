"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { ConversationOut, MessageOut } from "@/lib/types";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { MessageInput } from "@/components/MessageInput";
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger, } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Menu, Loader2, PanelRightOpen, LogOut } from "lucide-react";
import { toast } from "sonner";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export default function ChatPage() {
  const {
    user,
    loading: authLoading,
    backendUnavailable,
    backendMessage,
    retryBackendConnection,
    signOut,
  } = useAuth();

  const [conversations, setConversations] = useState<ConversationOut[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageOut[]>([]);

  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isRetryingBackend, setIsRetryingBackend] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  // const handleSendMessage = async (content: string) => {
  //   if (!content.trim()) return;

  //   let targetConvId = activeId;

  //   if (!targetConvId) {
  //     try {
  //       const title =
  //         content.substring(0, 30) + (content.length > 30 ? "..." : "");
  //       const newConv = await api.createConversation({ title });
  //       setConversations((prev) => [newConv, ...prev]);
  //       targetConvId = newConv.id;
  //       setActiveId(newConv.id);
  //     } catch (error) {
  //       console.error("Failed to create auto-conversation:", error);
  //       return;
  //     }
  //   }

  //   if (!targetConvId) return;

  //   const tempId = `temp-${Date.now()}`;
  //   const userMsg: MessageOut = {
  //     id: tempId,
  //     conversation_id: targetConvId,
  //     role: "user",
  //     content,
  //     metadata: {},
  //     created_at: new Date().toISOString(),
  //   };

  //   setMessages((prev) => [...prev, userMsg]);
  //   setIsAiTyping(true);

  //   try {
  //     const response = await api.sendMessage(targetConvId, { content });

  //     setMessages((prev) => [
  //       ...prev.filter((m) => m.id !== tempId),
  //       response.user_message,
  //       response.assistant_message,
  //     ]);

  //     const currentConv = conversations.find((c) => c.id === targetConvId);
  //     if (
  //       currentConv &&
  //       currentConv.title === "محادثة جديدة" &&
  //       messages.length === 0
  //     ) {
  //       const title =
  //         content.substring(0, 30) + (content.length > 30 ? "..." : "");

  //       api.updateConversation(targetConvId, { title }).then((updated) => {
  //         setConversations((prev) =>
  //           prev.map((c) => (c.id === targetConvId ? updated : c))
  //         );
  //       });
  //     }
  //   } catch (error: unknown) {
  //     console.error("Failed to send message:", error);
  //     setMessages((prev) => prev.filter((m) => m.id !== tempId));

  //     let message = "حدث خطأ غير متوقع";

  //     if (error instanceof DOMException && error.name === "AbortError") {
  //       message = "استغرقت الاستجابة وقتاً أطول من المتوقع. يرجى إعادة المحاولة بعد قليل.";
  //     } else if (error instanceof Error) {
  //       message = error.message;
  //     }

  //     toast.error(`عذراً، ${message}`);
  //   } finally {
  //     setIsAiTyping(false);
  //   }
  // };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    let targetConvId = activeId;
    const wasNewConversation = !targetConvId;
    const shouldRenameAfterFirstMessage =
      !!targetConvId &&
      conversations.find((c) => c.id === targetConvId)?.title === "محادثة جديدة" &&
      messages.length === 0;

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

    const now = Date.now();

    const userTempId = `temp-user-${now}`;
    const assistantTempId = `temp-assistant-${now}`;

    const userMsg: MessageOut = {
      id: userTempId,
      conversation_id: targetConvId,
      role: "user",
      content,
      metadata: {},
      created_at: new Date().toISOString(),
    };

    const assistantMsg: MessageOut = {
      id: assistantTempId,
      conversation_id: targetConvId,
      role: "assistant",
      content: "",
      metadata: {
        is_streaming: true,
        streaming_status: "جاري إرسال الطلب...",
        citations: [],
        used_sources: [],
        confidence_score: 0,
        tier_breakdown: {},
      },
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsAiTyping(true);

    try {
      await api.streamMessage(targetConvId, { content }, {
        onEvent: (event) => {
          if (event.type === "user_message") {
            setMessages((prev) =>
              prev.map((m) => (m.id === userTempId ? event.message : m))
            );
            return;
          }

          if (event.type === "status") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantTempId
                  ? {
                      ...m,
                      metadata: {
                        ...m.metadata,
                        is_streaming: true,
                        streaming_status: event.message || "جاري المعالجة...",
                      },
                    }
                  : m
              )
            );
            return;
          }

          if (event.type === "chunk") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantTempId
                  ? {
                      ...m,
                      content: `${m.content}${event.delta}`,
                      metadata: {
                        ...m.metadata,
                        is_streaming: true,
                        streaming_status: "",
                      },
                    }
                  : m
              )
            );
            return;
          }

          if (event.type === "final") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantTempId
                  ? {
                      ...m,
                      content: event.answer ?? m.content,
                      metadata: {
                        citations: Array.isArray(event.citations) ? event.citations : [],
                        used_sources: Array.isArray(event.used_sources) ? event.used_sources : [],
                        confidence_score:
                          typeof event.confidence_score === "number"
                            ? event.confidence_score
                            : 0,
                        tier_breakdown:
                          event.tier_breakdown &&
                          typeof event.tier_breakdown === "object"
                            ? event.tier_breakdown
                            : {},
                        query_type: event.query_type ?? "",
                        query_type_confidence:
                          typeof event.query_type_confidence === "number"
                            ? event.query_type_confidence
                            : 0,
                        is_streaming: false,
                        streaming_status: "",
                      },
                    }
                  : m
              )
            );
            return;
          }

          if (event.type === "assistant_message") {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantTempId ? event.message : m))
            );
            return;
          }

          if (event.type === "error") {
            if (event.assistant_message) {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantTempId ? event.assistant_message! : m))
              );
            } else {
              setMessages((prev) => prev.filter((m) => m.id !== assistantTempId));
            }

            toast.error(`عذراً، ${event.detail}`);
            return;
          }
        },
      });

      if (wasNewConversation || shouldRenameAfterFirstMessage) {
        const title =
          content.substring(0, 30) + (content.length > 30 ? "..." : "");

        api.updateConversation(targetConvId, { title }).then((updated) => {
          setConversations((prev) =>
            prev.map((c) => (c.id === targetConvId ? updated : c))
          );
        });
      }
    } catch (error: unknown) {
      console.error("Failed to stream message:", error);
      setMessages((prev) => prev.filter((m) => m.id !== userTempId && m.id !== assistantTempId));

      let message = "حدث خطأ غير متوقع";

      if (error instanceof DOMException && error.name === "AbortError") {
        message = "استغرقت الاستجابة وقتاً أطول من المتوقع. يرجى إعادة المحاولة بعد قليل.";
      } else if (error instanceof Error) {
        message = error.message;
      }

      toast.error(`عذراً، ${message}`);
    } finally {
      setIsAiTyping(false);
    }
  };

  if (backendUnavailable && !user?.id) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-destructive/10 p-3 text-destructive">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold font-kufi text-foreground">
              يتعذر الوصول إلى الخادم حالياً
            </h1>
            <p className="text-sm text-muted-foreground leading-7 font-naskh">
              {backendMessage ??
                "نعتذر عن الإزعاج. الخادم غير متاح حالياً. يرجى إعادة المحاولة بعد قليل، وإذا استمرت المشكلة نأمل العودة لاحقاً."}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              className="min-w-35 cursor-pointer text-sm h-10 font-kufi disabled:cursor-not-allowed disabled:opacity-70"
              onClick={async () => {
                try {
                  setIsRetryingBackend(true);
                  await retryBackendConnection();
                } finally {
                  setIsRetryingBackend(false);
                }
              }}
              disabled={isRetryingBackend || isSigningOut}
            >
              {isRetryingBackend ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جارٍ إعادة المحاولة...
                </>
              ) : (
                "إعادة المحاولة"
              )}
            </Button>

            <Button
              variant="outline"
              className="min-w-35 cursor-pointer text-destructive border-destructive/30 hover:bg-red-500! hover:text-white! font-kufi text-sm h-10 disabled:cursor-not-allowed disabled:opacity-70"
              onClick={async () => {
                try {
                  setIsSigningOut(true);
                  await signOut();
                } catch (error) {
                  console.error("Failed to sign out from backend unavailable screen:", error);
                  setIsSigningOut(false);
                }
              }}
              disabled={isRetryingBackend || isSigningOut}
            >
              <LogOut className="h-4 w-4 rtl-flip" />
              {isSigningOut ? "جارٍ تسجيل الخروج..." : "تسجيل الخروج"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
                <VisuallyHidden asChild>
                  <SheetTitle>القائمة الجانبية</SheetTitle>
                </VisuallyHidden>
                <VisuallyHidden asChild>
                  <SheetDescription>
                    قائمة المحادثات السابقة وخيارات الحساب
                  </SheetDescription>
                </VisuallyHidden>
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
            disabled={isAiTyping || isLoadingMessages || backendUnavailable || !user?.id}
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
