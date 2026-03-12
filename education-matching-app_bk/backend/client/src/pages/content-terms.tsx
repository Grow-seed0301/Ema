import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Save } from "lucide-react";
import type { TermsOfService } from "@shared/schema";

export default function ContentTermsPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  // Fetch terms of service
  const { data: termsData, isLoading } = useQuery<TermsOfService>({
    queryKey: ["/api/admin/terms-of-service"],
    queryFn: async () => {
      const response = await fetch("/api/admin/terms-of-service", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      return result.data;
    },
    onSuccess: (data) => {
      if (data) {
        setFormData({
          title: data.title,
          content: data.content,
        });
      }
    },
  });

  // Update terms of service
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("/api/admin/terms-of-service", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/terms-of-service"] });
      toast({ title: "利用規約を更新しました" });
    },
    onError: () => {
      toast({ title: "利用規約の更新に失敗しました", variant: "destructive" });
    },
  });

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="利用規約"
        description="利用規約を編集します"
      />

      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>利用規約の編集</CardTitle>
            <CardDescription>
              最終更新: {formatDate(termsData?.updatedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="terms-title">タイトル</Label>
              <Input
                id="terms-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="利用規約"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="terms-content">内容 (HTML形式)</Label>
              <Textarea
                id="terms-content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="<h2>第1条（定義）</h2><p>本規約において...</p>"
                rows={20}
                className="font-mono text-sm"
              />
            </div>
            <div className="border rounded-lg p-4 bg-muted">
              <Label className="mb-2 block">プレビュー</Label>
              {/* Note: HTML content is from trusted admin sources only.
                  Preview is only visible to admins during editing. */}
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: formData.content }}
              />
            </div>
            <Button
              onClick={() => updateMutation.mutate(formData)}
              disabled={updateMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              保存
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
