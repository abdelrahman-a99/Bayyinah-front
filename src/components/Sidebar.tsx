import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ConversationOut } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import {
  MessageSquare,
  Plus,
  Trash2,
  LogOut,
  MoreVertical,
  Edit2,
  PanelRightClose,
  BookOpenText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarProps {
  conversations: ConversationOut[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onToggle?: () => void;
}

export function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  onToggle,
}: SidebarProps) {
  const { user, signOut } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // Handle clicking outside to cancel/save renaming
  useEffect(() => {
    if (!editingId) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (editInputRef.current && !editInputRef.current.contains(e.target as Node)) {
        if (editValue.trim() && editValue !== conversations.find(c => c.id === editingId)?.title) {
          onRename(editingId, editValue.trim());
        }
        setEditingId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingId, editValue, conversations, onRename]);

  return (
    <div
      className="flex flex-col h-full w-72 lg:w-80 shadow-sm relative"
      style={{ borderInlineStart: "1px solid var(--border)", backgroundColor: "var(--sidebar-bg)" }}
      dir="rtl"
    >
      {/* Header: Logo + Toggle */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
            <BookOpenText className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold font-kufi text-foreground">
            قصص الأنبياء
          </span>
        </div>
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground"
            onClick={onToggle}
            aria-label="إغلاق القائمة الجانبية"
          >
            <PanelRightClose className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* New Chat Button */}
      <div className="px-3 pb-3 shrink-0">
        <Button
          onClick={onNew}
          className="w-full h-11 cursor-pointer shadow-sm relative overflow-hidden group rounded-lg font-kufi text-sm"
        >
          <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Plus className="h-5 w-5" />
          محادثة جديدة
        </Button>
      </div>

      <Separator />

      {/* Conversations list */}
      <ScrollArea className="flex-1 min-h-0 px-3 py-3">
        <div className="space-y-1" dir="rtl">
          {conversations.length === 0 ? (
            <div className="text-center text-muted-foreground pt-8 pb-4 text-sm font-kufi">
              لا توجد محادثات سابقة
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all border ${activeId === conv.id
                  ? "bg-primary/15 border-primary/20 shadow-sm text-foreground"
                  : "bg-transparent border-transparent hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                  }`}
                onClick={() => {
                  if (editingId !== conv.id) {
                    onSelect(conv.id);
                  }
                }}
              >
                <MessageSquare
                  className={`h-4 w-4 shrink-0 ${activeId === conv.id ? "text-primary" : "opacity-60"
                    }`}
                />

                {editingId === conv.id ? (
                  <Input
                    ref={editInputRef}
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (editValue.trim() && editValue !== conv.title) {
                          onRename(conv.id, editValue.trim());
                        }
                        setEditingId(null);
                      } else if (e.key === "Escape") {
                        setEditingId(null);
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    className="h-7 p-1 text-sm font-medium font-kufi flex-1 min-w-0 bg-transparent! border-primary/30 focus-visible:ring-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="truncate text-sm font-medium font-kufi flex-1 min-w-0" dir="auto">
                    {conv.title}
                  </span>
                )}

                <DropdownMenu dir="rtl">
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-7 w-7 shrink-0 cursor-pointer text-muted-foreground hover:text-foreground hover:bg-transparent! focus:bg-transparent! data-[state=open]:bg-transparent! focus:ring-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-colors ${activeId === conv.id ? "opacity-100" : ""
                        }`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(conv.id);
                        setEditValue(conv.title);
                      }}
                      className="cursor-pointer font-kufi"
                    >
                      <Edit2 className="h-4 w-4 text-muted-foreground" />
                      إعادة تسمية
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(conv.id);
                      }}
                      className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive font-kufi"
                    >
                      <Trash2 className="h-4 w-4" />
                      حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <Separator />

      {/* User info + Logout */}
      <div className="p-3 bg-muted/20 shrink-0">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-base shrink-0">
            {user?.display_name?.charAt(0).toUpperCase() || "م"}
          </div>
          <div className="overflow-hidden flex-1 min-w-0">
            <p className="truncate text-sm font-medium font-kufi text-foreground" dir="auto">
              {user?.display_name || "مستخدم"}
            </p>
            <p className="truncate text-xs text-muted-foreground font-sans" dir="auto">
              {user?.email}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full cursor-pointer text-destructive border-destructive/30 hover:bg-red-500! hover:text-white! font-kufi text-sm h-9"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 rtl-flip" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  );
}
