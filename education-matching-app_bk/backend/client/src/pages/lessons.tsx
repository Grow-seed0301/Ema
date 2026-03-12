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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Eye, X, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import type { Booking, User } from "@shared/schema";

interface BookingWithUsers extends Booking {
  student?: User;
  teacher?: User;
}

interface LessonsResponse {
  lessons: BookingWithUsers[];
  total: number;
  page: number;
  totalPages: number;
}

export default function LessonsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<BookingWithUsers | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const { data, isLoading } = useQuery<LessonsResponse>({
    queryKey: ["/api/admin/lessons", { search, ...filterValues, page }],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, cancelReason }: { id: string; status: string; cancelReason?: string }) => {
      return apiRequest(`/api/admin/lessons/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, cancelReason }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lessons"] });
      toast({ title: "レッスンを更新しました" });
      setIsDialogOpen(false);
      setSelectedLesson(null);
    },
    onError: () => {
      toast({ title: "レッスンの更新に失敗しました", variant: "destructive" });
    },
  });

  const handleView = (lesson: BookingWithUsers) => {
    setSelectedLesson(lesson);
    setNewStatus(lesson.status || "pending");
    setCancelReason(lesson.cancelReason || "");
    setIsDialogOpen(true);
  };

  const handleStatusUpdate = () => {
    if (selectedLesson) {
      updateMutation.mutate({
        id: selectedLesson.id,
        status: newStatus,
        cancelReason: newStatus === "cancelled" ? cancelReason : undefined,
      });
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

  const formatCurrency = (value: string | number | null | undefined) => {
    const num = parseFloat(String(value || 0));
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(num);
  };

  const columns = [
    {
      key: "id",
      header: "レッスン",
      render: (lesson: BookingWithUsers) => (
        <div className="space-y-1">
          <p className="font-medium" data-testid={`text-lesson-type-${lesson.id}`}>
            {lesson.lessonType}
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{format(new Date(lesson.date), "MMM d, yyyy")}</span>
            <Clock className="h-3 w-3 ml-2" />
            <span>
              {lesson.startTime} - {lesson.endTime}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "student",
      header: "生徒",
      render: (lesson: BookingWithUsers) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={lesson.student?.avatarUrl || undefined} />
            <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 text-xs">
              {getInitials(lesson.student?.name || "S")}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{lesson.student?.name || "不明"}</span>
        </div>
      ),
    },
    {
      key: "teacher",
      header: "教師",
      render: (lesson: BookingWithUsers) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={lesson.teacher?.avatarUrl || undefined} />
            <AvatarFallback className="bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400 text-xs">
              {getInitials(lesson.teacher?.name || "T")}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{lesson.teacher?.name || "不明"}</span>
        </div>
      ),
    },
    {
      key: "format",
      header: "形式",
      render: (lesson: BookingWithUsers) => (
        <StatusBadge
          status={lesson.format || "online"}
          testId={`badge-format-${lesson.id}`}
        />
      ),
    },
    {
      key: "price",
      header: "価格",
      render: (lesson: BookingWithUsers) => (
        <span>{formatCurrency(lesson.price)}</span>
      ),
    },
    {
      key: "status",
      header: "ステータス",
      render: (lesson: BookingWithUsers) => (
        <StatusBadge
          status={lesson.status || "pending"}
          testId={`badge-status-${lesson.id}`}
        />
      ),
    },
    {
      key: "actions",
      header: "操作",
      className: "text-right",
      render: (lesson: BookingWithUsers) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleView(lesson)}
            data-testid={`button-view-${lesson.id}`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {lesson.status === "pending" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedLesson(lesson);
                setNewStatus("cancelled");
                setCancelReason("");
                setIsDialogOpen(true);
              }}
              data-testid={`button-cancel-${lesson.id}`}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const filters = [
    {
      key: "status",
      label: "ステータス",
      options: [
        { value: "pending", label: "保留中" },
        { value: "confirmed", label: "確認済み" },
        { value: "completed", label: "完了" },
        { value: "cancelled", label: "キャンセル" },
      ],
    },
    {
      key: "format",
      label: "形式",
      options: [
        { value: "online", label: "オンライン" },
        { value: "offline", label: "オフライン" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="レッスン"
        description="レッスンの予約とスケジュールを管理"
      />

      <SearchFilter
        searchPlaceholder="レッスンを検索..."
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
        testIdPrefix="lessons"
      />

      <DataTable
        columns={columns}
        data={data?.lessons || []}
        isLoading={isLoading}
        emptyMessage="レッスンが見つかりません"
        currentPage={page}
        totalPages={data?.totalPages || 1}
        totalItems={data?.total || 0}
        pageSize={10}
        onPageChange={setPage}
        testIdPrefix="lessons"
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>レッスン詳細</DialogTitle>
          </DialogHeader>
          {selectedLesson && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">レッスンタイプ</p>
                  <p className="font-medium">{selectedLesson.lessonType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">形式</p>
                  <p className="font-medium capitalize">{selectedLesson.format}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">日付</p>
                  <p className="font-medium">
                    {format(new Date(selectedLesson.date), "MMMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">時間</p>
                  <p className="font-medium">
                    {selectedLesson.startTime} - {selectedLesson.endTime}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">生徒</p>
                  <p className="font-medium">{selectedLesson.student?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">教師</p>
                  <p className="font-medium">{selectedLesson.teacher?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">価格</p>
                  <p className="font-medium">{formatCurrency(selectedLesson.price)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>ステータス</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger data-testid="select-lesson-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">保留中</SelectItem>
                    <SelectItem value="confirmed">確認済み</SelectItem>
                    <SelectItem value="completed">完了</SelectItem>
                    <SelectItem value="cancelled">キャンセル</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newStatus === "cancelled" && (
                <div className="space-y-2">
                  <Label>キャンセル理由</Label>
                  <Textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="キャンセル理由を入力..."
                    rows={3}
                    data-testid="input-cancel-reason"
                  />
                </div>
              )}

              {selectedLesson.notes && (
                <div className="space-y-2">
                  <Label>メモ</Label>
                  <p className="text-sm text-muted-foreground">{selectedLesson.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              閉じる
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={updateMutation.isPending}
              data-testid="button-update-status"
            >
              {updateMutation.isPending ? "更新中..." : "ステータスを更新"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
