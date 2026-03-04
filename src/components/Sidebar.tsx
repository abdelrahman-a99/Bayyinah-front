import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ConversationOut } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import {
  MessageSquare,
  Plus,
  Trash2,
  LogOut,
  MoreVertical,
  Edit2
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
  onRename: (id: string) => void;
}

export function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
}: SidebarProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="flex flex-col h-full bg-background border-l border-border/50 rtl:border-l rtl:border-r-0 ltr:border-l-0 ltr:border-r w-72 lg:w-80 shadow-sm relative">
      <div className="p-4 bg-primary/5">
        <Button
          onClick={onNew}
          className="w-full justify-start text-base font-kufi h-12 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Plus className="ml-2 h-5 w-5" />
          محادثة جديدة
        </Button>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-2">
          {conversations.length === 0 ? (
            <div className="text-center text-muted-foreground pt-8 pb-4 text-sm font-kufi">
              لا توجد محادثات سابقة
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${activeId === conv.id
                  ? "bg-primary/20 border-primary/30 shadow-sm text-foreground"
                  : "bg-transparent border-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                onClick={() => onSelect(conv.id)}
              >
                <div className="flex items-center gap-3 overflow-hidden ml-2">
                  <MessageSquare className={`h-4 w-4 shrink-0 ${activeId === conv.id ? "text-primary" : "opacity-70"}`} />
                  <span className="truncate text-sm font-medium font-kufi">
                    {conv.title}
                  </span>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity ${activeId === conv.id ? "opacity-100" : ""
                        }`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); onRename(conv.id); }}
                      className="cursor-pointer font-kufi"
                    >
                      <Edit2 className="ml-2 h-4 w-4 text-muted-foreground" />
                      إعادة تسمية
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                      className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive font-kufi"
                    >
                      <Trash2 className="ml-2 h-4 w-4" />
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

      <div className="p-4 bg-muted/30">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
            {user?.display_name?.charAt(0).toUpperCase() || "م"}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="truncate text-sm font-medium font-kufi text-foreground">{user?.display_name || "مستخدم"}</p>
            <p className="truncate text-xs text-muted-foreground font-sans text-left" dir="ltr">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground font-kufi"
          onClick={signOut}
        >
          <LogOut className="ml-2 h-4 w-4 rtl-flip" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  );
}
