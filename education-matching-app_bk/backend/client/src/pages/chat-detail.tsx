import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  senderId: string;
  senderType: string;
  text: string;
  createdAt: string;
  time: string;
  isRead: boolean;
  isImage: boolean;
  imageUrl: string | null;
}

interface Participant {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface ChatInfo {
  id: string;
  participant1: Participant | null;
  participant2: Participant | null;
}

interface MessagesResponse {
  messages: Message[];
  hasMore: boolean;
  chat: ChatInfo | null;
}

export default function ChatDetailPage() {
  const [match, params] = useRoute("/chats/:chatId");
  const [, setLocation] = useLocation();
  const chatId = params?.chatId;

  const { data, isLoading, error } = useQuery<MessagesResponse>({
    queryKey: ["/api/admin/chats", chatId, "messages"],
    queryFn: () =>
      apiRequest<MessagesResponse>(`/api/admin/chats/${chatId}/messages`),
    enabled: !!chatId,
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getSenderInfo = (message: Message) => {
    if (!data?.chat) return null;
    
    const isParticipant1 = message.senderId === data.chat.participant1?.id;
    return isParticipant1 ? data.chat.participant1 : data.chat.participant2;
  };

  if (!match) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/chats")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {data?.chat && (
          <PageHeader
            title={`${data.chat.participant1?.name || "不明"} と ${data.chat.participant2?.name || "不明"} のチャット`}
            description="メッセージ履歴"
          />
        )}
        {!data?.chat && (
          <PageHeader
            title="チャット詳細"
            description="メッセージ履歴"
          />
        )}
      </div>

      {isLoading && (
        <Card className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {error && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">メッセージの読み込みに失敗しました</p>
        </Card>
      )}

      {data && data.messages.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">メッセージがありません</p>
        </Card>
      )}

      {data && data.messages.length > 0 && (
        <Card className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="p-6 space-y-4">
              {data.messages.map((message) => {
                const sender = getSenderInfo(message);
                return (
                  <div key={message.id} className="flex gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={sender?.avatarUrl || undefined} />
                      <AvatarFallback>
                        {sender ? getInitials(sender.name) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {sender?.name || "不明なユーザー"}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {message.senderType === "teacher" ? "教師" : "生徒"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {message.time}
                        </span>
                      </div>
                      {message.isImage && message.imageUrl ? (
                        <img
                          src={message.imageUrl}
                          alt="メッセージ画像"
                          className="max-w-md rounded-lg border"
                        />
                      ) : (
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.text}
                          </p>
                        </div>
                      )}
                      {!message.isRead && (
                        <span className="text-xs text-muted-foreground mt-1 inline-block">
                          未読
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}
