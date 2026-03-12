import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Edit, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { Faq, FaqCategory } from "@shared/schema";

export default function ContentFaqsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("faqs");
  
  // Category Dialog State
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FaqCategory | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    sortOrder: 0,
    isActive: true,
  });

  // FAQ Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [deletingFaqId, setDeletingFaqId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "すべて",
    sortOrder: 0,
    isActive: true,
  });

  // Category deletion state
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);

  // Fetch FAQ Categories
  const { data: faqCategories = [], isLoading: categoriesLoading } = useQuery<FaqCategory[]>({
    queryKey: ["/api/admin/faq-categories"],
    queryFn: async () => {
      const response = await fetch("/api/admin/faq-categories", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      return result.data;
    },
  });

  // Fetch FAQs
  const { data: faqs = [], isLoading } = useQuery<Faq[]>({
    queryKey: ["/api/admin/faqs"],
    queryFn: async () => {
      const response = await fetch("/api/admin/faqs", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      return result.data;
    },
  });

  // Category Mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (data: typeof categoryFormData) => {
      return apiRequest("/api/admin/faq-categories", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faq-categories"] });
      toast({ title: "カテゴリーを作成しました" });
      resetCategoryForm();
      setIsCategoryDialogOpen(false);
    },
    onError: () => {
      toast({ title: "カテゴリーの作成に失敗しました", variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof categoryFormData> }) => {
      return apiRequest(`/api/admin/faq-categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faq-categories"] });
      toast({ title: "カテゴリーを更新しました" });
      resetCategoryForm();
      setIsCategoryDialogOpen(false);
    },
    onError: () => {
      toast({ title: "カテゴリーの更新に失敗しました", variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/faq-categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faq-categories"] });
      toast({ title: "カテゴリーを削除しました" });
    },
    onError: () => {
      toast({ title: "カテゴリーの削除に失敗しました", variant: "destructive" });
    },
  });

  // FAQ Mutations
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("/api/admin/faqs", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
      toast({ title: "FAQを作成しました" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "FAQの作成に失敗しました", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return apiRequest(`/api/admin/faqs/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
      toast({ title: "FAQを更新しました" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "FAQの更新に失敗しました", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/faqs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faqs"] });
      toast({ title: "FAQを削除しました" });
    },
    onError: () => {
      toast({ title: "FAQの削除に失敗しました", variant: "destructive" });
    },
  });

  // Category handlers
  const resetCategoryForm = () => {
    setCategoryFormData({
      name: "",
      sortOrder: 0,
      isActive: true,
    });
    setEditingCategory(null);
  };

  const openCreateCategoryDialog = () => {
    resetCategoryForm();
    setIsCategoryDialogOpen(true);
  };

  const openEditCategoryDialog = (category: FaqCategory) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    });
    setIsCategoryDialogOpen(true);
  };

  const handleCategorySubmit = () => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryFormData });
    } else {
      createCategoryMutation.mutate(categoryFormData);
    }
  };

  const openDeleteCategoryDialog = (id: string) => {
    setDeletingCategoryId(id);
    setDeleteCategoryDialogOpen(true);
  };

  const handleDeleteCategoryConfirm = () => {
    if (deletingCategoryId) {
      deleteCategoryMutation.mutate(deletingCategoryId);
      setDeleteCategoryDialogOpen(false);
      setDeletingCategoryId(null);
    }
  };

  // FAQ handlers
  const resetForm = () => {
    const defaultCategory = faqCategories.length > 0 
      ? faqCategories[0].name 
      : "すべて";
    setFormData({
      question: "",
      answer: "",
      category: defaultCategory,
      sortOrder: 0,
      isActive: true,
    });
    setEditingFaq(null);
  };

  const openEditDialog = (faq: Faq) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      sortOrder: faq.sortOrder,
      isActive: faq.isActive,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingFaq) {
      updateMutation.mutate({ id: editingFaq.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openDeleteDialog = (id: string) => {
    setDeletingFaqId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingFaqId) {
      deleteMutation.mutate(deletingFaqId);
      setDeleteDialogOpen(false);
      setDeletingFaqId(null);
    }
  };

  const moveFaq = async (faq: Faq, direction: "up" | "down") => {
    const currentIndex = faqs.findIndex((f) => f.id === faq.id);
    if (currentIndex === -1) return;

    if (direction === "up" && currentIndex > 0) {
      const prevFaq = faqs[currentIndex - 1];
      await updateMutation.mutateAsync({
        id: faq.id,
        data: { sortOrder: prevFaq.sortOrder },
      });
      await updateMutation.mutateAsync({
        id: prevFaq.id,
        data: { sortOrder: faq.sortOrder },
      });
    } else if (direction === "down" && currentIndex < faqs.length - 1) {
      const nextFaq = faqs[currentIndex + 1];
      await updateMutation.mutateAsync({
        id: faq.id,
        data: { sortOrder: nextFaq.sortOrder },
      });
      await updateMutation.mutateAsync({
        id: nextFaq.id,
        data: { sortOrder: faq.sortOrder },
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="よくある質問"
        description="よくある質問とカテゴリーを管理します"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="faqs">FAQ一覧</TabsTrigger>
          <TabsTrigger value="categories">カテゴリー管理</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>FAQカテゴリー</CardTitle>
              <Button onClick={openCreateCategoryDialog}>
                カテゴリー追加
              </Button>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : faqCategories.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  カテゴリーがまだ登録されていません
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>カテゴリー名</TableHead>
                      <TableHead className="w-24">表示順序</TableHead>
                      <TableHead className="w-24">状態</TableHead>
                      <TableHead className="w-32">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {faqCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          {category.name}
                        </TableCell>
                        <TableCell>{category.sortOrder}</TableCell>
                        <TableCell>
                          {category.isActive ? (
                            <span className="text-green-600">有効</span>
                          ) : (
                            <span className="text-gray-500">無効</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditCategoryDialog(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteCategoryDialog(category.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faqs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>FAQ一覧</CardTitle>
              <Button onClick={openCreateDialog}>
                FAQ追加
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : faqs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  FAQがまだ登録されていません
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">順序</TableHead>
                      <TableHead>質問</TableHead>
                      <TableHead className="w-32">カテゴリー</TableHead>
                      <TableHead className="w-24">状態</TableHead>
                      <TableHead className="w-32">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {faqs.map((faq, index) => (
                      <TableRow key={faq.id}>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => moveFaq(faq, "up")}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => moveFaq(faq, "down")}
                              disabled={index === faqs.length - 1}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {faq.question}
                        </TableCell>
                        <TableCell>{faq.category}</TableCell>
                        <TableCell>
                          {faq.isActive ? (
                            <span className="text-green-600">有効</span>
                          ) : (
                            <span className="text-gray-500">無効</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(faq)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(faq.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "カテゴリーを編集" : "新しいカテゴリーを追加"}
            </DialogTitle>
            <DialogDescription>
              FAQカテゴリーの情報を入力してください
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">カテゴリー名</Label>
              <Input
                id="categoryName"
                value={categoryFormData.name}
                onChange={(e) =>
                  setCategoryFormData({ ...categoryFormData, name: e.target.value })
                }
                placeholder="例: アカウント"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categorySortOrder">表示順序</Label>
              <Input
                id="categorySortOrder"
                type="number"
                value={categoryFormData.sortOrder}
                onChange={(e) =>
                  setCategoryFormData({ 
                    ...categoryFormData, 
                    sortOrder: parseInt(e.target.value) || 0 
                  })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="categoryIsActive"
                checked={categoryFormData.isActive}
                onCheckedChange={(checked) =>
                  setCategoryFormData({ ...categoryFormData, isActive: checked })
                }
              />
              <Label htmlFor="categoryIsActive">アクティブ</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleCategorySubmit}
              disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
            >
              {editingCategory ? "更新" : "作成"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FAQ Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFaq ? "FAQを編集" : "新しいFAQを追加"}
            </DialogTitle>
            <DialogDescription>
              よくある質問とその回答を入力してください
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">質問</Label>
              <Textarea
                id="question"
                value={formData.question}
                onChange={(e) =>
                  setFormData({ ...formData, question: e.target.value })
                }
                placeholder="例: アカウントの作成方法は？"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="answer">回答</Label>
              <Textarea
                id="answer"
                value={formData.answer}
                onChange={(e) =>
                  setFormData({ ...formData, answer: e.target.value })
                }
                placeholder="質問に対する詳細な回答を入力してください"
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">カテゴリー</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="カテゴリーを選択" />
                </SelectTrigger>
                <SelectContent>
                  {faqCategories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">表示順序</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) =>
                  setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
              <Label htmlFor="isActive">アクティブ</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingFaq ? "更新" : "作成"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete FAQ Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>FAQを削除</DialogTitle>
            <DialogDescription>
              本当にこのFAQを削除しますか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>カテゴリーを削除</DialogTitle>
            <DialogDescription>
              本当にこのカテゴリーを削除しますか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteCategoryDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCategoryConfirm}
              disabled={deleteCategoryMutation.isPending}
            >
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
