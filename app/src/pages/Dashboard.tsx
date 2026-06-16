import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, TrendingUp, Wallet, Calendar } from "lucide-react";
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
import { format } from "date-fns";

export default function Dashboard() {
  const { data: kpi, isLoading: kpiLoading } = trpc.operations.dashboardKpi.useQuery();
  const { data: chartData, isLoading: chartLoading } = trpc.operations.balanceChart.useQuery();
  const { data: alerts } = trpc.operations.alerts.useQuery();
  const { data: pnlData } = trpc.operations.pnlByProjects.useQuery();
  const { data: calendarData } = trpc.operations.paymentCalendar.useQuery({ days: 30 });

  const formatMoney = (n: number) => n.toLocaleString("ru-RU") + " ₽";

  const chartFormatted = chartData?.map((d) => ({
    date: d.date ? format(new Date(d.date), "dd.MM") : "",
    balance: d.cumulativeBalance,
    daily: d.dailyBalance,
  })) || [];

  const pnlFormatted = pnlData?.map((p) => ({
    name: p.projectName,
    profit: p.profit,
    income: p.income,
    expense: p.expense,
  })) || [];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Дашборд</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Касса сейчас</p>
                <p className="text-2xl font-bold">
                  {kpiLoading ? "..." : formatMoney(kpi?.cashNow || 0)}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Прогноз (30 дн)</p>
                <p className={`text-2xl font-bold ${(kpi?.forecast || 0) < 0 ? "text-red-600" : "text-green-600"}`}>
                  {kpiLoading ? "..." : formatMoney(kpi?.forecast || 0)}
                </p>
              </div>
              {(kpi?.forecast || 0) < 0 ? (
                <TrendingDown className="h-8 w-8 text-red-500" />
              ) : (
                <TrendingUp className="h-8 w-8 text-green-500" />
              )}
            </div>
            {(kpi?.forecast || 0) < 0 && (
              <Badge variant="destructive" className="mt-2">Кассовый разрыв</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Прибыль (мес)</p>
                <p className={`text-2xl font-bold ${(kpi?.monthlyProfit || 0) < 0 ? "text-red-600" : "text-green-600"}`}>
                  {kpiLoading ? "..." : formatMoney(kpi?.monthlyProfit || 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Обязательства</p>
                <p className="text-2xl font-bold text-amber-600">
                  {kpiLoading ? "..." : formatMoney(kpi?.obligations || 0)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg ${
                alert.severity === "danger"
                  ? "bg-red-50 border border-red-200 text-red-800"
                  : "bg-amber-50 border border-amber-200 text-amber-800"
              }`}
            >
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Balance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Динамика баланса (90 дней)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            {chartLoading ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">Загрузка...</div>
            ) : chartFormatted.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">Нет данных</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartFormatted}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatMoney(value), "Баланс"]}
                    labelStyle={{ fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                    fill="#dbeafe"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bottom row: P&L + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* P&L by Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Прибыль по проектам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              {pnlFormatted.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">Нет данных</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pnlFormatted} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip
                      formatter={(value: number) => [formatMoney(value)]}
                    />
                    <Bar dataKey="profit" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ближайшие платежи (30 дн)</CardTitle>
          </CardHeader>
          <CardContent>
            {calendarData && calendarData.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {calendarData.slice(0, 8).map((item) => {
                  const isOverdue = item.date && new Date(item.date) < new Date();
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-2 rounded text-sm ${
                        isOverdue ? "bg-red-50" : "bg-slate-50"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.counterparty?.name || item.article?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.date ? format(new Date(item.date), "dd.MM.yyyy") : ""}
                        </p>
                      </div>
                      <span className={`font-semibold shrink-0 ml-2 ${isOverdue ? "text-red-600" : ""}`}>
                        {formatMoney(item.planExpense || 0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                Нет запланированных платежей
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
