import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { SearchFilter } from "@/components/search-filter";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Eye, CheckCircle } from "lucide-react";
import type { Inquiry } from "@shared/schema";

interface InquiriesResponse {
  inquiries: Inquiry[];
  total: number;
  page: number;
  totalPages: number;
}

export default function InquiriesPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  const { data, isLoading } = useQuery<InquiriesResponse>({
    queryKey: ["/api/admin/inquiries", { search, ...filterValues, page }],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inquiries"] });
      toast({ title: "ステータスを更新しました" });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "ステータスの更新に失敗しました", variant: "destructive" });
    },
  });

  const handleView = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setIsDialogOpen(true);
  };

  const handleMarkResolved = (inquiry: Inquiry) => {
    updateStatusMutation.mutate({ id: inquiry.id, status: "resolved" });
  };

  const columns = [
    {
      key: "createdAt",
      header: "日時",
      render: (inquiry: Inquiry) => inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleString("ja-JP") : "-",
    },
    { 
      key: "name", 
      header: "名前" 
    },
    { 
      key: "email", 
      header: "メールアドレス" 
    },
    {
      key: "message",
      header: "メッセージ",
      render: (inquiry: Inquiry) => {
        const message = inquiry.message || "";
        return message.length > 50 ? `${message.substring(0, 50)}...` : message;
      },
    },
    {
      key: "status",
      header: "ステータス",
      render: (inquiry: Inquiry) => (
        <StatusBadge
          status={inquiry.status || "pending"}
        />
      ),
    },
    {
      key: "actions",
      header: "操作",
      render: (inquiry: Inquiry) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleView(inquiry)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {inquiry.status === "pending" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMarkResolved(inquiry)}
            >
              <CheckCircle className="h-4 w-4" />
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
        { value: "pending", label: "未対応" },
        { value: "resolved", label: "対応済み" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="お問い合わせ一覧"
        description="ユーザーからのお問い合わせを管理します"
      />

      <SearchFilter
        searchPlaceholder="お問い合わせを検索..."
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
      />

      <DataTable
        columns={columns}
        data={data?.inquiries ?? []}
        isLoading={isLoading}
        currentPage={page}
        totalPages={data?.totalPages ?? 1}
        totalItems={data?.total ?? 0}
        pageSize={10}
        onPageChange={setPage}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>お問い合わせ詳細</DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">日時</div>
                <div className="mt-1">
                  {selectedInquiry.createdAt ? new Date(selectedInquiry.createdAt).toLocaleString("ja-JP") : "-"}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">名前</div>
                <div className="mt-1">{selectedInquiry.name}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  メールアドレス
                </div>
                <div className="mt-1">{selectedInquiry.email}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  メッセージ
                </div>
                <div className="mt-1 whitespace-pre-wrap bg-muted p-3 rounded-md">
                  {selectedInquiry.message}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  ステータス
                </div>
                <div className="mt-1">
                  <StatusBadge
                    status={selectedInquiry.status || "pending"}
                  />
                </div>
              </div>
              {selectedInquiry.status === "pending" && (
                <div className="flex justify-end">
                  <Button
                    onClick={() => handleMarkResolved(selectedInquiry)}
                    disabled={updateStatusMutation.isPending}
                  >
                    対応済みにする
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
