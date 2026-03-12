import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Chat {
  id: string;
  participant1Id: string;
  participant1Name: string;
  participant1Avatar: string | null;
  participant1Type: string;
  participant2Id: string;
  participant2Name: string;
  participant2Avatar: string | null;
  participant2Type: string;
  lastMessage: string;
  lastMessageTime: string;
  timeAgo: string;
  createdAt: string;
}

interface ChatsResponse {
  chats: Chat[];
  total: number;
  page: number;
  totalPages: number;
}

export default function ChatsPage() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, error } = useQuery<ChatsResponse>({
    queryKey: ["/api/admin/chats", page, limit],
    queryFn: () =>
      apiRequest<ChatsResponse>(`/api/admin/chats?page=${page}&limit=${limit}`),
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getTypeBadgeVariant = (type: string) => {
    return type === "teacher" ? "default" : "secondary";
  };

  const getTypeLabel = (type: string) => {
    return type === "teacher" ? "教師" : "生徒";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="チャット一覧"
        description="生徒と教師のチャットを確認できます"
      />

      {isLoading && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">チャットの読み込みに失敗しました</p>
        </Card>
      )}

      {data && data.chats.length === 0 && (
        <Card className="p-8 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">チャットがありません</p>
        </Card>
      )}

      {data && data.chats.length > 0 && (
        <div className="space-y-4">
          {data.chats.map((chat) => (
            <Card
              key={chat.id}
              className="p-4 hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => setLocation(`/chats/${chat.id}`)}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* Participant 1 */}
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={chat.participant1Avatar || undefined} />
                      <AvatarFallback>
                        {getInitials(chat.participant1Name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {chat.participant1Name}
                        </p>
                        <Badge variant={getTypeBadgeVariant(chat.participant1Type)} className="text-xs">
                          {getTypeLabel(chat.participant1Type)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />

                  {/* Participant 2 */}
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={chat.participant2Avatar || undefined} />
                      <AvatarFallback>
                        {getInitials(chat.participant2Name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {chat.participant2Name}
                        </p>
                        <Badge variant={getTypeBadgeVariant(chat.participant2Type)} className="text-xs">
                          {getTypeLabel(chat.participant2Type)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 text-right">
                  <div className="text-xs text-muted-foreground mb-1">
                    {chat.timeAgo}
                  </div>
                  <div className="text-sm text-muted-foreground truncate max-w-64">
                    {chat.lastMessage || "メッセージなし"}
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                前へ
              </Button>
              <div className="flex items-center gap-2 px-4">
                <span className="text-sm text-muted-foreground">
                  {page} / {data.totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page === data.totalPages}
              >
                次へ
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
