import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  CreditCard,
  Package,
  LogOut,
  MessageSquare,
  FileText,
  ChevronRight,
  Mail,
  HelpCircle,
  Shield,
  ScrollText,
  MessagesSquare,
  BookOpen,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";

const menuItems = [
  {
    title: "ダッシュボード",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "ユーザー",
    url: "/users",
    icon: Users,
  },
  {
    title: "教師",
    url: "/teachers",
    icon: GraduationCap,
  },
  {
    title: "レッスン",
    url: "/lessons",
    icon: Calendar,
  },
  {
    title: "支払い",
    url: "/payments",
    icon: CreditCard,
  },
  {
    title: "プラン",
    url: "/plans",
    icon: Package,
  },
  {
    title: "科目管理",
    url: "/subjects",
    icon: BookOpen,
  },
  {
    title: "お問い合わせ",
    url: "/inquiries",
    icon: MessageSquare,
  },
  {
    title: "チャット",
    url: "/chats",
    icon: MessagesSquare,
  },
];

const contentManagementItems = [
  {
    title: "利用規約",
    url: "/content/terms",
    icon: ScrollText,
  },
  {
    title: "プライバシーポリシー",
    url: "/content/privacy",
    icon: Shield,
  },
  {
    title: "管理者メール",
    url: "/content/admin-email",
    icon: Mail,
  },
  {
    title: "よくある質問",
    url: "/content/faqs",
    icon: HelpCircle,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">教育アプリ</span>
            <span className="text-xs text-muted-foreground">管理パネル</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>メニュー</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {/* Content Management Collapsible Menu */}
              <Collapsible defaultOpen={location.startsWith('/content')} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      data-testid="nav-content-management"
                      isActive={location.startsWith('/content')}
                    >
                      <FileText className="h-4 w-4" />
                      <span>コンテンツ管理</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {contentManagementItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={location === subItem.url}
                          >
                            <Link href={subItem.url}>
                              <subItem.icon className="h-4 w-4" />
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.avatarUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {user?.name ? getInitials(user.name) : "AD"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium">
              {user?.name || "管理者"}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {user?.email || "admin@example.com"}
            </span>
          </div>
          <button
            onClick={async () => {
              await apiRequest("/api/admin/logout", { method: "POST" });
              queryClient.invalidateQueries({ queryKey: ["/api/admin/user"] });
              window.location.href = "/";
            }}
            data-testid="button-logout"
            className="p-1"
          >
            <LogOut className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
