import { useLocation } from "wouter";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Shield, Mail, HelpCircle } from "lucide-react";

export default function ContentManagementPage() {
  const [, setLocation] = useLocation();

  const contentItems = [
    {
      title: "利用規約",
      description: "アプリケーションの利用規約を管理します",
      icon: FileText,
      path: "/content/terms",
    },
    {
      title: "プライバシーポリシー",
      description: "個人情報の取り扱いに関するポリシーを管理します",
      icon: Shield,
      path: "/content/privacy",
    },
    {
      title: "管理者メール",
      description: "お問い合わせ通知を受け取るメールアドレスを設定します",
      icon: Mail,
      path: "/content/admin-email",
    },
    {
      title: "よくある質問",
      description: "ユーザー向けのFAQを管理します",
      icon: HelpCircle,
      path: "/content/faqs",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="コンテンツ管理"
        description="アプリケーションのコンテンツを管理します"
      />

      <div className="grid gap-4 md:grid-cols-2">
        {contentItems.map((item) => (
          <Card key={item.path} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <item.icon className="h-5 w-5" />
                    {item.title}
                  </CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation(item.path)}
              >
                管理画面へ
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
