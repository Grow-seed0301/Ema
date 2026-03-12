import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Save, Mail } from "lucide-react";
import type { AdminSettings } from "@shared/schema";

export default function ContentAdminEmailPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    adminEmail: "",
    notifyOnNewInquiry: true,
  });

  // Fetch admin settings
  const { data: settingsData, isLoading } = useQuery<AdminSettings>({
    queryKey: ["/api/admin/admin-settings"],
    queryFn: async () => {
      const response = await fetch("/api/admin/admin-settings", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      return result.data;
    },
  });

  // Update form data when settings data changes
  useEffect(() => {
    if (settingsData) {
      setFormData({
        adminEmail: settingsData.adminEmail,
        notifyOnNewInquiry: settingsData.notifyOnNewInquiry,
      });
    }
  }, [settingsData]);

  // Update admin settings
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("/api/admin/admin-settings", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admin-settings"] });
      toast({ title: "管理者メール設定を更新しました" });
    },
    onError: () => {
      toast({ title: "管理者メール設定の更新に失敗しました", variant: "destructive" });
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
        title="管理者メール"
        description="お問い合わせ通知を受け取るメールアドレスを設定します"
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
            <CardTitle>管理者メール設定</CardTitle>
            <CardDescription>
              最終更新: {formatDate(settingsData?.updatedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="admin-email">管理者メールアドレス</Label>
              <div className="flex gap-2">
                <Mail className="h-5 w-5 text-muted-foreground mt-2" />
                <Input
                  id="admin-email"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, adminEmail: e.target.value })
                  }
                  placeholder="admin@example.com"
                  className="flex-1"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                新しいお問い合わせがあった際に通知を受け取るメールアドレス
              </p>
            </div>

            <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="notify-inquiry" className="text-base">
                  お問い合わせ通知
                </Label>
                <p className="text-sm text-muted-foreground">
                  新しいお問い合わせが届いた際にメールで通知を受け取る
                </p>
              </div>
              <Switch
                id="notify-inquiry"
                checked={formData.notifyOnNewInquiry}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, notifyOnNewInquiry: checked })
                }
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
