import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Edit, Trash2, Check, BookOpen, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import type { Plan } from "@shared/schema";

interface PlansResponse {
  plans: Plan[];
  total: number;
  page: number;
  totalPages: number;
}

export default function PlansPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const limit = 10; // Items per page
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    description: "",
    price: "0",
    totalLessons: 0,
    durationDays: 30,
    features: "",
    isActive: true,
    isRecommended: false,
    isAdditionalOption: false,
    sortOrder: 0,
  });

  const { data, isLoading } = useQuery<PlansResponse>({
    queryKey: ["/api/admin/plans", { page, limit }],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        price: data.price,
        features: data.features.split("\n").filter((f) => f.trim()),
      };
      return apiRequest("/api/admin/plans", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      toast({ title: "プランを作成しました" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "プランの作成に失敗しました", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const payload = {
        ...data,
        price: data.price,
        features: data.features.split("\n").filter((f) => f.trim()),
      };
      return apiRequest(`/api/admin/plans/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      toast({ title: "プランを更新しました" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "プランの更新に失敗しました", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/plans/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      toast({ title: "プランを削除しました" });
    },
    onError: () => {
      toast({ title: "プランの削除に失敗しました", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      nameEn: "",
      description: "",
      price: "0",
      totalLessons: 0,
      durationDays: 30,
      features: "",
      isActive: true,
      isRecommended: false,
      isAdditionalOption: false,
      sortOrder: 0,
    });
    setEditingPlan(null);
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      nameEn: plan.nameEn || "",
      description: plan.description || "",
      price: plan.price,
      totalLessons: plan.totalLessons,
      durationDays: plan.durationDays,
      features: (plan.features || []).join("\n"),
      isActive: plan.isActive ?? true,
      isRecommended: plan.isRecommended ?? false,
      isAdditionalOption: plan.isAdditionalOption ?? false,
      sortOrder: plan.sortOrder ?? 0,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const formatCurrency = (value: string | number | null | undefined) => {
    const num = parseFloat(String(value || 0));
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(num);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="プラン"
        description="プランと料金を管理"
        action={{
          label: "プランを追加",
          onClick: () => {
            resetForm();
            setIsDialogOpen(true);
          },
          testId: "button-add-plan",
        }}
      />

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-24 mb-4" />
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data?.plans?.map((plan) => (
              <Card
                key={plan.id}
                className={!plan.isActive ? "opacity-60" : ""}
                data-testid={`card-plan-${plan.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {plan.name}
                        {plan.isRecommended && (
                          <Badge variant="default" className="text-xs">
                            おすすめ
                          </Badge>
                        )}
                        {!plan.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            無効
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{plan.nameEn}</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(plan)}
                        data-testid={`button-edit-${plan.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(plan.id)}
                        data-testid={`button-delete-${plan.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold">{formatCurrency(plan.price)}</p>
                    <p className="text-sm text-muted-foreground">{plan.durationDays}日間</p>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span>{plan.totalLessons}レッスン</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{plan.durationDays}日間</span>
                    </div>
                  </div>

                  {plan.description && (
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  )}

                  {plan.features && plan.features.length > 0 && (
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1}-
                {Math.min(page * limit, data.total)} of {data.total} plans
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  data-testid="plans-prev-page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= data.totalPages}
                  data-testid="plans-next-page"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "プランを編集" : "新規プラン作成"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">名前（日本語）</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                    data-testid="input-plan-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameEn">名前（英語）</Label>
                  <Input
                    id="nameEn"
                    value={formData.nameEn}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, nameEn: e.target.value }))
                    }
                    data-testid="input-plan-name-en"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={2}
                  data-testid="input-plan-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">価格（円）</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, price: e.target.value }))
                    }
                    required
                    data-testid="input-plan-price"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalLessons">レッスン数合計</Label>
                  <Input
                    id="totalLessons"
                    type="number"
                    value={formData.totalLessons}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        totalLessons: parseInt(e.target.value) || 0,
                      }))
                    }
                    required
                    data-testid="input-plan-lessons"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="durationDays">期間（日数）</Label>
                  <Input
                    id="durationDays"
                    type="number"
                    value={formData.durationDays}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        durationDays: parseInt(e.target.value) || 30,
                      }))
                    }
                    required
                    data-testid="input-plan-duration"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">表示順</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sortOrder: parseInt(e.target.value) || 0,
                      }))
                    }
                    data-testid="input-plan-sort"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="features">機能（1行につき1つ）</Label>
                <Textarea
                  id="features"
                  value={formData.features}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, features: e.target.value }))
                  }
                  rows={4}
                  placeholder="各機能を1行ずつ入力してください"
                  data-testid="input-plan-features"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isActive: checked }))
                  }
                  data-testid="switch-plan-active"
                />
                <Label htmlFor="isActive">有効</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isRecommended"
                  checked={formData.isRecommended}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isRecommended: checked }))
                  }
                  data-testid="switch-plan-recommended"
                />
                <Label htmlFor="isRecommended">おすすめ</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isAdditionalOption"
                  checked={formData.isAdditionalOption}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isAdditionalOption: checked }))
                  }
                  data-testid="switch-plan-additional-option"
                />
                <Label htmlFor="isAdditionalOption">追加オプション</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-plan"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "保存中..."
                  : "保存"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
