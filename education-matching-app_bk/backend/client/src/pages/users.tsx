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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Edit, Trash2 } from "lucide-react";
import type { User } from "@shared/schema";

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

export default function UsersPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    isActive: true,
  });

  const { data, isLoading } = useQuery<UsersResponse>({
    queryKey: ["/api/admin/users", { search, ...filterValues, page }],
  });



  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      return apiRequest(`/api/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "ユーザーを更新しました" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "ユーザーの更新に失敗しました", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/admin/users/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "ユーザーを削除しました" });
    },
    onError: () => {
      toast({ title: "ユーザーの削除に失敗しました", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", email: "", isActive: true });
    setEditingUser(null);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email || "",
      isActive: user.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) {
      return;
    }
    updateMutation.mutate({ id: editingUser.id, data: formData });
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
      key: "user",
      header: "ユーザー",
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatarUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium" data-testid={`text-user-name-${user.id}`}>
              {user.name}
            </p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "rank",
      header: "ランク",
      render: (user: User) => (
        <StatusBadge
          status={user.rankLevel || "bronze"}
          testId={`badge-rank-${user.id}`}
        />
      ),
    },
    {
      key: "status",
      header: "ステータス",
      render: (user: User) => (
        <StatusBadge
          status={user.isActive ? "active" : "inactive"}
          testId={`badge-status-${user.id}`}
        />
      ),
    },
    {
      key: "actions",
      header: "操作",
      className: "text-right",
      render: (user: User) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(user)}
            data-testid={`button-edit-${user.id}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteMutation.mutate(user.id)}
            data-testid={`button-delete-${user.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const filters = [
    {
      key: "status",
      label: "ステータス",
      options: [
        { value: "active", label: "アクティブ" },
        { value: "inactive", label: "非アクティブ" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="ユーザー"
        description="プラットフォーム上の全ユーザーを管理"
      />

      <SearchFilter
        searchPlaceholder="ユーザーを検索..."
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
        testIdPrefix="users"
      />

      <DataTable
        columns={columns}
        data={data?.users || []}
        isLoading={isLoading}
        emptyMessage="ユーザーが見つかりません"
        currentPage={page}
        totalPages={data?.totalPages || 1}
        totalItems={data?.total || 0}
        pageSize={10}
        onPageChange={setPage}
        testIdPrefix="users"
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ユーザーを編集</DialogTitle>
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
                  data-testid="input-user-name"
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
                  data-testid="input-user-email"
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
                data-testid="button-save-user"
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
