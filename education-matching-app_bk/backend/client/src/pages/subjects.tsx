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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Edit, Trash2, Plus, BookOpen, Star } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { SubjectCategory, Subject, SubjectGroup } from "@shared/schema";

export default function SubjectsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("categories");
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    type: "category" | "subject" | "group";
    id: string;
    name: string;
  } | null>(null);
  
  // Category Dialog State
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SubjectCategory | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    sortOrder: 0,
    isActive: true,
  });

  // Subject Dialog State
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectFormData, setSubjectFormData] = useState({
    categoryId: "",
    name: "",
    isPopular: false,
    targetElementary: false,
    targetJuniorHigh: false,
    targetHighSchool: false,
    targetUniversityAdult: false,
    sortOrder: 0,
    isActive: true,
  });

  // Subject Group Dialog State
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SubjectGroup | null>(null);
  const [groupFormData, setGroupFormData] = useState({
    subjectId: "",
    name: "",
    sortOrder: 0,
    isActive: true,
  });

  // Queries
  const { data: categories, isLoading: categoriesLoading } = useQuery<SubjectCategory[]>({
    queryKey: ["/api/admin/subject-categories"],
  });

  const { data: subjects, isLoading: subjectsLoading } = useQuery<Subject[]>({
    queryKey: ["/api/admin/subjects"],
  });

  const { data: groups, isLoading: groupsLoading } = useQuery<SubjectGroup[]>({
    queryKey: ["/api/admin/subject-groups"],
  });

  // Category Mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (data: typeof categoryFormData) => {
      return apiRequest("/api/admin/subject-categories", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subject-categories"] });
      toast({ title: "カテゴリーを作成しました" });
      setIsCategoryDialogOpen(false);
      resetCategoryForm();
    },
    onError: () => {
      toast({ title: "カテゴリーの作成に失敗しました", variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof categoryFormData }) => {
      return apiRequest(`/api/admin/subject-categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subject-categories"] });
      toast({ title: "カテゴリーを更新しました" });
      setIsCategoryDialogOpen(false);
      resetCategoryForm();
    },
    onError: () => {
      toast({ title: "カテゴリーの更新に失敗しました", variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/subject-categories/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subject-categories"] });
      toast({ title: "カテゴリーを削除しました" });
    },
    onError: () => {
      toast({ title: "カテゴリーの削除に失敗しました", variant: "destructive" });
    },
  });

  // Subject Mutations
  const createSubjectMutation = useMutation({
    mutationFn: async (data: typeof subjectFormData) => {
      return apiRequest("/api/admin/subjects", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subjects"] });
      toast({ title: "科目を作成しました" });
      setIsSubjectDialogOpen(false);
      resetSubjectForm();
    },
    onError: () => {
      toast({ title: "科目の作成に失敗しました", variant: "destructive" });
    },
  });

  const updateSubjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof subjectFormData }) => {
      return apiRequest(`/api/admin/subjects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subjects"] });
      toast({ title: "科目を更新しました" });
      setIsSubjectDialogOpen(false);
      resetSubjectForm();
    },
    onError: () => {
      toast({ title: "科目の更新に失敗しました", variant: "destructive" });
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/subjects/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subjects"] });
      toast({ title: "科目を削除しました" });
    },
    onError: () => {
      toast({ title: "科目の削除に失敗しました", variant: "destructive" });
    },
  });

  // Subject Group Mutations
  const createGroupMutation = useMutation({
    mutationFn: async (data: typeof groupFormData) => {
      return apiRequest("/api/admin/subject-groups", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subject-groups"] });
      toast({ title: "小グループを作成しました" });
      setIsGroupDialogOpen(false);
      resetGroupForm();
    },
    onError: () => {
      toast({ title: "小グループの作成に失敗しました", variant: "destructive" });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof groupFormData }) => {
      return apiRequest(`/api/admin/subject-groups/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subject-groups"] });
      toast({ title: "小グループを更新しました" });
      setIsGroupDialogOpen(false);
      resetGroupForm();
    },
    onError: () => {
      toast({ title: "小グループの更新に失敗しました", variant: "destructive" });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/subject-groups/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subject-groups"] });
      toast({ title: "小グループを削除しました" });
    },
    onError: () => {
      toast({ title: "小グループの削除に失敗しました", variant: "destructive" });
    },
  });

  // Form Handlers
  const resetCategoryForm = () => {
    setCategoryFormData({ name: "", sortOrder: 0, isActive: true });
    setEditingCategory(null);
  };

  const resetSubjectForm = () => {
    setSubjectFormData({
      categoryId: "",
      name: "",
      isPopular: false,
      targetElementary: false,
      targetJuniorHigh: false,
      targetHighSchool: false,
      targetUniversityAdult: false,
      sortOrder: 0,
      isActive: true,
    });
    setEditingSubject(null);
  };

  const resetGroupForm = () => {
    setGroupFormData({ subjectId: "", name: "", sortOrder: 0, isActive: true });
    setEditingGroup(null);
  };

  const handleEditCategory = (category: SubjectCategory) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      sortOrder: category.sortOrder || 0,
      isActive: category.isActive ?? true,
    });
    setIsCategoryDialogOpen(true);
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setSubjectFormData({
      categoryId: subject.categoryId,
      name: subject.name,
      isPopular: subject.isPopular ?? false,
      targetElementary: subject.targetElementary ?? false,
      targetJuniorHigh: subject.targetJuniorHigh ?? false,
      targetHighSchool: subject.targetHighSchool ?? false,
      targetUniversityAdult: subject.targetUniversityAdult ?? false,
      sortOrder: subject.sortOrder || 0,
      isActive: subject.isActive ?? true,
    });
    setIsSubjectDialogOpen(true);
  };

  const handleEditGroup = (group: SubjectGroup) => {
    setEditingGroup(group);
    setGroupFormData({
      subjectId: group.subjectId,
      name: group.name,
      sortOrder: group.sortOrder || 0,
      isActive: group.isActive ?? true,
    });
    setIsGroupDialogOpen(true);
  };

  const handleSubmitCategory = () => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryFormData });
    } else {
      createCategoryMutation.mutate(categoryFormData);
    }
  };

  const handleSubmitSubject = () => {
    if (editingSubject) {
      updateSubjectMutation.mutate({ id: editingSubject.id, data: subjectFormData });
    } else {
      createSubjectMutation.mutate(subjectFormData);
    }
  };

  const handleSubmitGroup = () => {
    if (editingGroup) {
      updateGroupMutation.mutate({ id: editingGroup.id, data: groupFormData });
    } else {
      createGroupMutation.mutate(groupFormData);
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories?.find(c => c.id === categoryId)?.name || "";
  };

  const getSubjectName = (subjectId: string) => {
    return subjects?.find(s => s.id === subjectId)?.name || "";
  };

  const handleDeleteClick = (type: "category" | "subject" | "group", id: string, name: string) => {
    setDeleteConfirm({ open: true, type, id, name });
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirm) return;
    
    switch (deleteConfirm.type) {
      case "category":
        deleteCategoryMutation.mutate(deleteConfirm.id);
        break;
      case "subject":
        deleteSubjectMutation.mutate(deleteConfirm.id);
        break;
      case "group":
        deleteGroupMutation.mutate(deleteConfirm.id);
        break;
    }
    
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="科目管理"
        description="科目のカテゴリー、科目、小グループを管理します"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="categories">カテゴリー</TabsTrigger>
          <TabsTrigger value="subjects">科目</TabsTrigger>
          <TabsTrigger value="groups">小グループ</TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">カテゴリー一覧</h2>
            <Button
              onClick={() => {
                resetCategoryForm();
                setIsCategoryDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              カテゴリー追加
            </Button>
          </div>

          {categoriesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <div className="grid gap-4">
              {categories?.map((category) => (
                <Card key={category.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <CardDescription>並び順: {category.sortOrder}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={category.isActive ? "default" : "secondary"}>
                        {category.isActive ? "有効" : "無効"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick("category", category.id, category.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">科目一覧</h2>
            <Button
              onClick={() => {
                resetSubjectForm();
                setIsSubjectDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              科目追加
            </Button>
          </div>

          {subjectsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <div className="grid gap-4">
              {subjects?.map((subject) => (
                <Card key={subject.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-lg">{subject.name}</CardTitle>
                            {subject.isPopular && (
                              <Badge variant="default" className="bg-yellow-500">
                                <Star className="h-3 w-3 mr-1" />
                                人気の科目
                              </Badge>
                            )}
                          </div>
                          <CardDescription>
                            カテゴリー: {getCategoryName(subject.categoryId)} | 並び順: {subject.sortOrder}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={subject.isActive ? "default" : "secondary"}>
                          {subject.isActive ? "有効" : "無効"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditSubject(subject)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick("subject", subject.id, subject.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {subject.targetElementary && <Badge variant="outline">小学生</Badge>}
                      {subject.targetJuniorHigh && <Badge variant="outline">中学生</Badge>}
                      {subject.targetHighSchool && <Badge variant="outline">高校生</Badge>}
                      {subject.targetUniversityAdult && <Badge variant="outline">大学生・社会人</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">小グループ一覧</h2>
            <Button
              onClick={() => {
                resetGroupForm();
                setIsGroupDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              小グループ追加
            </Button>
          </div>

          {groupsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <div className="grid gap-4">
              {groups?.map((group) => (
                <Card key={group.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <CardDescription>
                        科目: {getSubjectName(group.subjectId)} | 並び順: {group.sortOrder}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={group.isActive ? "default" : "secondary"}>
                        {group.isActive ? "有効" : "無効"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditGroup(group)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick("group", group.id, group.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "カテゴリー編集" : "カテゴリー追加"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">カテゴリー名</Label>
              <Input
                id="category-name"
                value={categoryFormData.name}
                onChange={(e) =>
                  setCategoryFormData({ ...categoryFormData, name: e.target.value })
                }
                placeholder="例: 理数系"
              />
            </div>
            <div>
              <Label htmlFor="category-sort">並び順</Label>
              <Input
                id="category-sort"
                type="number"
                value={categoryFormData.sortOrder}
                onChange={(e) =>
                  setCategoryFormData({ ...categoryFormData, sortOrder: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="category-active"
                checked={categoryFormData.isActive}
                onCheckedChange={(checked) =>
                  setCategoryFormData({ ...categoryFormData, isActive: checked })
                }
              />
              <Label htmlFor="category-active">有効</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCategoryDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button onClick={handleSubmitCategory}>
              {editingCategory ? "更新" : "作成"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subject Dialog */}
      <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? "科目編集" : "科目追加"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject-category">カテゴリー</Label>
              <Select
                value={subjectFormData.categoryId}
                onValueChange={(value) =>
                  setSubjectFormData({ ...subjectFormData, categoryId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="カテゴリーを選択" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subject-name">科目名</Label>
              <Input
                id="subject-name"
                value={subjectFormData.name}
                onChange={(e) =>
                  setSubjectFormData({ ...subjectFormData, name: e.target.value })
                }
                placeholder="例: 数学"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="subject-popular"
                checked={subjectFormData.isPopular}
                onCheckedChange={(checked) =>
                  setSubjectFormData({ ...subjectFormData, isPopular: checked })
                }
              />
              <Label htmlFor="subject-popular">人気の科目</Label>
            </div>
            <div className="space-y-2">
              <Label>対象レベル</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="target-elementary"
                    checked={subjectFormData.targetElementary}
                    onCheckedChange={(checked) =>
                      setSubjectFormData({ ...subjectFormData, targetElementary: checked })
                    }
                  />
                  <Label htmlFor="target-elementary">小学生</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="target-junior"
                    checked={subjectFormData.targetJuniorHigh}
                    onCheckedChange={(checked) =>
                      setSubjectFormData({ ...subjectFormData, targetJuniorHigh: checked })
                    }
                  />
                  <Label htmlFor="target-junior">中学生</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="target-high"
                    checked={subjectFormData.targetHighSchool}
                    onCheckedChange={(checked) =>
                      setSubjectFormData({ ...subjectFormData, targetHighSchool: checked })
                    }
                  />
                  <Label htmlFor="target-high">高校生</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="target-university"
                    checked={subjectFormData.targetUniversityAdult}
                    onCheckedChange={(checked) =>
                      setSubjectFormData({ ...subjectFormData, targetUniversityAdult: checked })
                    }
                  />
                  <Label htmlFor="target-university">大学生・社会人</Label>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="subject-sort">並び順</Label>
              <Input
                id="subject-sort"
                type="number"
                value={subjectFormData.sortOrder}
                onChange={(e) =>
                  setSubjectFormData({ ...subjectFormData, sortOrder: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="subject-active"
                checked={subjectFormData.isActive}
                onCheckedChange={(checked) =>
                  setSubjectFormData({ ...subjectFormData, isActive: checked })
                }
              />
              <Label htmlFor="subject-active">有効</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSubjectDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button onClick={handleSubmitSubject}>
              {editingSubject ? "更新" : "作成"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subject Group Dialog */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? "小グループ編集" : "小グループ追加"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="group-subject">科目</Label>
              <Select
                value={groupFormData.subjectId}
                onValueChange={(value) =>
                  setGroupFormData({ ...groupFormData, subjectId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="科目を選択" />
                </SelectTrigger>
                <SelectContent>
                  {subjects?.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({getCategoryName(subject.categoryId)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="group-name">小グループ名</Label>
              <Input
                id="group-name"
                value={groupFormData.name}
                onChange={(e) =>
                  setGroupFormData({ ...groupFormData, name: e.target.value })
                }
                placeholder="例: 初級"
              />
            </div>
            <div>
              <Label htmlFor="group-sort">並び順</Label>
              <Input
                id="group-sort"
                type="number"
                value={groupFormData.sortOrder}
                onChange={(e) =>
                  setGroupFormData({ ...groupFormData, sortOrder: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="group-active"
                checked={groupFormData.isActive}
                onCheckedChange={(checked) =>
                  setGroupFormData({ ...groupFormData, isActive: checked })
                }
              />
              <Label htmlFor="group-active">有効</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsGroupDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button onClick={handleSubmitGroup}>
              {editingGroup ? "更新" : "作成"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm?.open || false} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>削除の確認</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === "category" && "このカテゴリーを削除してもよろしいですか？関連する科目も削除されます。"}
              {deleteConfirm?.type === "subject" && "この科目を削除してもよろしいですか？関連する小グループも削除されます。"}
              {deleteConfirm?.type === "group" && "この小グループを削除してもよろしいですか？"}
              <br />
              <span className="font-semibold">{deleteConfirm?.name}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
