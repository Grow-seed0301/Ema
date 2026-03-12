import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/stats-card";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, GraduationCap, Calendar, CreditCard, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface DashboardStats {
  totalUsers: number;
  totalTeachers: number;
  totalLessons: number;
  totalRevenue: number;
  userGrowth: number;
  teacherGrowth: number;
  lessonGrowth: number;
  revenueGrowth: number;
}

interface RevenueData {
  date: string;
  revenue: number;
}

interface LessonData {
  date: string;
  completed: number;
  cancelled: number;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery<RevenueData[]>({
    queryKey: ["/api/admin/revenue-chart"],
  });

  const { data: lessonData, isLoading: lessonLoading } = useQuery<LessonData[]>({
    queryKey: ["/api/admin/lesson-chart"],
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="ダッシュボード"
        description="教育プラットフォームの概要"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-16 mt-2" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatsCard
              title="総ユーザー数"
              value={stats?.totalUsers || 0}
              change={stats?.userGrowth}
              changeLabel="先月比"
              icon={Users}
              iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
              testId="stats-users"
            />
            <StatsCard
              title="アクティブ教師"
              value={stats?.totalTeachers || 0}
              change={stats?.teacherGrowth}
              changeLabel="先月比"
              icon={GraduationCap}
              iconColor="bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400"
              testId="stats-teachers"
            />
            <StatsCard
              title="今月のレッスン"
              value={stats?.totalLessons || 0}
              change={stats?.lessonGrowth}
              changeLabel="先月比"
              icon={Calendar}
              iconColor="bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400"
              testId="stats-lessons"
            />
            <StatsCard
              title="総売上"
              value={formatCurrency(stats?.totalRevenue || 0)}
              change={stats?.revenueGrowth}
              changeLabel="先月比"
              icon={CreditCard}
              iconColor="bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400"
              testId="stats-revenue"
            />
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              売上推移
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value: number) => [formatCurrency(value), "売上"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              レッスン概要
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lessonLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={lessonData || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar
                    dataKey="completed"
                    name="完了"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="cancelled"
                    name="キャンセル"
                    fill="hsl(var(--muted-foreground))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
