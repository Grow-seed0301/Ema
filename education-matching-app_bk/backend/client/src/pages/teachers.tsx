import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { SearchFilter } from "@/components/search-filter";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Edit, Trash2, Star, Users, BookOpen } from "lucide-react";
import type { Teacher } from "@shared/schema";

interface TeacherWithProfile extends Teacher {
  // All teacher fields are now directly on the Teacher type
}

interface TeachersResponse {
  teachers: TeacherWithProfile[];
  total: number;
  page: number;
  totalPages: number;
}

export default function TeachersPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherWithProfile | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    specialty: "",
    bio: "",
    isVerified: false,
  });

  const { data, isLoading } = useQuery<TeachersResponse>({
    queryKey: ["/api/admin/teachers", { search, ...filterValues, page }],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      return apiRequest(`/api/admin/teachers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teachers"] });
      toast({ title: "教師を更新しました" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "教師の更新に失敗しました", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/teachers/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teachers"] });
      toast({ title: "教師を削除しました" });
    },
    onError: () => {
      toast({ title: "教師の削除に失敗しました", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      specialty: "",
      bio: "",
      isVerified: false,
    });
    setEditingTeacher(null);
  };

  const handleEdit = (teacher: TeacherWithProfile) => {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email || "",
      specialty: teacher.specialty || "",
      bio: teacher.bio || "",
      isVerified: teacher.isVerified || false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeacher) {
      updateMutation.mutate({ id: editingTeacher.id, data: formData });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const columns = [
    {
      key: "teacher",
      header: "教師",
      render: (teacher: TeacherWithProfile) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={teacher.avatarUrl || undefined} />
            <AvatarFallback className="bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400 text-xs">
              {getInitials(teacher.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium" data-testid={`text-teacher-name-${teacher.id}`}>
              {teacher.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {teacher.specialty || "専門分野なし"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "rating",
      header: "評価",
      render: (teacher: TeacherWithProfile) => (
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          <span>{teacher.rating || "0.00"}</span>
          <span className="text-muted-foreground text-sm">
            ({teacher.reviewCount || 0})
          </span>
        </div>
      ),
    },
    {
      key: "stats",
      header: "生徒数 / レッスン数",
      render: (teacher: TeacherWithProfile) => (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{teacher.totalStudents || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span>{teacher.totalLessons || 0}</span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "ステータス",
      render: (teacher: TeacherWithProfile) => (
        <StatusBadge
          status={teacher.isVerified ? "active" : "pending"}
          testId={`badge-status-${teacher.id}`}
        />
      ),
    },
    {
      key: "actions",
      header: "操作",
      className: "text-right",
      render: (teacher: TeacherWithProfile) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(teacher)}
            data-testid={`button-edit-${teacher.id}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteMutation.mutate(teacher.id)}
            data-testid={`button-delete-${teacher.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const filters = [
    {
      key: "verified",
      label: "認証状態",
      options: [
        { value: "verified", label: "認証済み" },
        { value: "pending", label: "保留中" },
      ],
    },
    {
      key: "rating",
      label: "評価",
      options: [
        { value: "4+", label: "4つ星以上" },
        { value: "3+", label: "3つ星以上" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="教師"
        description="教師プロフィールと認証を管理"
      />

      <SearchFilter
        searchPlaceholder="教師を検索..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        filterValues={filterValues}
        onFilterChange={(key, value) =>
          setFilterValues((prev) => ({ ...prev, [key]: value }))
        }
        onReset={() => {
          setSearch("");
          setFilterValues({});
        }}
        testIdPrefix="teachers"
      />

      <DataTable
        columns={columns}
        data={data?.teachers || []}
        isLoading={isLoading}
        emptyMessage="教師が見つかりません"
        currentPage={page}
        totalPages={data?.totalPages || 1}
        totalItems={data?.total || 0}
        pageSize={10}
        onPageChange={setPage}
        testIdPrefix="teachers"
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>教師プロフィールを編集</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">名前</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  data-testid="input-teacher-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">メール</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                  data-testid="input-teacher-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialty">専門分野</Label>
                <Input
                  id="specialty"
                  value={formData.specialty}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, specialty: e.target.value }))
                  }
                  data-testid="input-teacher-specialty"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">自己紹介</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  rows={3}
                  data-testid="input-teacher-bio"
                />
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
                disabled={updateMutation.isPending}
                data-testid="button-save-teacher"
              >
                {updateMutation.isPending ? "保存中..." : "保存"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
