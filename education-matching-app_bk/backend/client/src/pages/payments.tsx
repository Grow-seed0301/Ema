import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Eye, CreditCard, Building2, Store } from "lucide-react";
import { format } from "date-fns";
import type { Payment, User, Plan } from "@shared/schema";

interface PaymentWithDetails extends Payment {
  user?: User;
  plan?: Plan;
}

interface PaymentsResponse {
  payments: PaymentWithDetails[];
  total: number;
  page: number;
  totalPages: number;
}

const paymentMethodIcons: Record<string, React.ReactNode> = {
  credit_card: <CreditCard className="h-4 w-4" />,
  bank_transfer: <Building2 className="h-4 w-4" />,
  convenience_store: <Store className="h-4 w-4" />,
};

const paymentMethodLabels: Record<string, string> = {
  credit_card: "クレジットカード",
  bank_transfer: "銀行振込",
  convenience_store: "コンビニ決済",
};

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithDetails | null>(null);

  const { data, isLoading } = useQuery<PaymentsResponse>({
    queryKey: ["/api/admin/payments", { search, ...filterValues, page }],
  });

  const handleView = (payment: PaymentWithDetails) => {
    setSelectedPayment(payment);
    setIsDialogOpen(true);
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
      header: "支払いID",
      render: (payment: PaymentWithDetails) => (
        <span
          className="font-mono text-sm"
          data-testid={`text-payment-id-${payment.id}`}
        >
          {payment.id.slice(0, 8)}...
        </span>
      ),
    },
    {
      key: "user",
      header: "ユーザー",
      render: (payment: PaymentWithDetails) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={payment.user?.avatarUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials(payment.user?.name || "U")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{payment.user?.name || "不明"}</p>
            <p className="text-xs text-muted-foreground">{payment.user?.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "description",
      header: "説明",
      render: (payment: PaymentWithDetails) => (
        <div>
          <p className="text-sm">
            {payment.description || payment.plan?.name || "支払い"}
          </p>
          {payment.plan && (
            <p className="text-xs text-muted-foreground">{payment.plan.nameEn}</p>
          )}
        </div>
      ),
    },
    {
      key: "method",
      header: "支払い方法",
      render: (payment: PaymentWithDetails) => (
        <div className="flex items-center gap-2">
          {paymentMethodIcons[payment.paymentMethod || "credit_card"]}
          <span className="text-sm">
            {paymentMethodLabels[payment.paymentMethod || "credit_card"]}
          </span>
        </div>
      ),
    },
    {
      key: "amount",
      header: "金額",
      render: (payment: PaymentWithDetails) => (
        <span className="font-medium">{formatCurrency(payment.amount)}</span>
      ),
    },
    {
      key: "date",
      header: "日付",
      render: (payment: PaymentWithDetails) => (
        <span className="text-sm text-muted-foreground">
          {payment.createdAt
            ? format(new Date(payment.createdAt), "MMM d, yyyy HH:mm")
            : "-"}
        </span>
      ),
    },
    {
      key: "status",
      header: "ステータス",
      render: (payment: PaymentWithDetails) => (
        <StatusBadge
          status={payment.status || "pending"}
          testId={`badge-status-${payment.id}`}
        />
      ),
    },
    {
      key: "actions",
      header: "操作",
      className: "text-right",
      render: (payment: PaymentWithDetails) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleView(payment)}
          data-testid={`button-view-${payment.id}`}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const filters = [
    {
      key: "status",
      label: "ステータス",
      options: [
        { value: "pending", label: "保留中" },
        { value: "completed", label: "完了" },
        { value: "failed", label: "失敗" },
        { value: "refunded", label: "返金済み" },
      ],
    },
    {
      key: "method",
      label: "支払い方法",
      options: [
        { value: "credit_card", label: "クレジットカード" },
        { value: "bank_transfer", label: "銀行振込" },
        { value: "convenience_store", label: "コンビニ決済" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="支払い"
        description="すべての支払い取引を表示・管理"
      />

      <SearchFilter
        searchPlaceholder="支払いを検索..."
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
        testIdPrefix="payments"
      />

      <DataTable
        columns={columns}
        data={data?.payments || []}
        isLoading={isLoading}
        emptyMessage="支払いが見つかりません"
        currentPage={page}
        totalPages={data?.totalPages || 1}
        totalItems={data?.total || 0}
        pageSize={10}
        onPageChange={setPage}
        testIdPrefix="payments"
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>支払い詳細</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">支払いID</p>
                  <p className="font-mono">{selectedPayment.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">ステータス</p>
                  <StatusBadge status={selectedPayment.status || "pending"} />
                </div>
                <div>
                  <p className="text-muted-foreground">ユーザー</p>
                  <p className="font-medium">{selectedPayment.user?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedPayment.user?.email}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">金額</p>
                  <p className="font-medium text-lg">
                    {formatCurrency(selectedPayment.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">支払い方法</p>
                  <div className="flex items-center gap-2">
                    {paymentMethodIcons[selectedPayment.paymentMethod || "credit_card"]}
                    <span>
                      {paymentMethodLabels[selectedPayment.paymentMethod || "credit_card"]}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">日付</p>
                  <p>
                    {selectedPayment.createdAt
                      ? format(new Date(selectedPayment.createdAt), "MMMM d, yyyy HH:mm")
                      : "-"}
                  </p>
                </div>
                {selectedPayment.plan && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">プラン</p>
                    <p className="font-medium">
                      {selectedPayment.plan.name} ({selectedPayment.plan.nameEn})
                    </p>
                  </div>
                )}
                {selectedPayment.description && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">説明</p>
                    <p>{selectedPayment.description}</p>
                  </div>
                )}
                {selectedPayment.stripePaymentId && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Stripe Payment ID</p>
                    <p className="font-mono text-xs">{selectedPayment.stripePaymentId}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
