// Reports page - no useState needed
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Download } from "lucide-react";
import { format } from "date-fns";

export default function Reports() {
  const { data: ddsData } = trpc.operations.ddsByWeeks.useQuery({ weeks: 12 });
  const { data: pnlData } = trpc.operations.pnlByProjects.useQuery();
  const { data: calendarData } = trpc.operations.paymentCalendar.useQuery({ days: 90 });

  const formatMoney = (n: number) => n.toLocaleString("ru-RU") + " ₽";

  const exportCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const exportDDS = () => {
    if (!ddsData) return;
    exportCSV(
      "dds_report.csv",
      ["Неделя", "Год", "Приход", "Расход", "Баланс", "Накопительный"],
      ddsData.map((d) => [d.week, d.year, d.income, d.expense, d.balance, d.cumulative])
    );
  };

  const exportPnL = () => {
    if (!pnlData) return;
    exportCSV(
      "pnl_report.csv",
      ["Проект", "Доход", "Расход", "Прибыль", "Маржа %"],
      pnlData.map((d) => [d.projectName, d.income, d.expense, d.profit, d.margin.toFixed(1)])
    );
  };

  const exportCalendar = () => {
    if (!calendarData) return;
    exportCSV(
      "payment_calendar.csv",
      ["Дата", "Контрагент", "Статья", "Сумма", "Статус"],
      calendarData.map((d) => [
        d.date ? format(new Date(d.date), "dd.MM.yyyy") : "",
        d.counterparty?.name || "",
        d.article?.name || "",
        d.planExpense || 0,
        d.status === "plan" ? "Запланировано" : "Выполнено",
      ])
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Отчёты</h2>

      <Tabs defaultValue="dds" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="dds">ДДС по неделям</TabsTrigger>
          <TabsTrigger value="pnl">P&L по проектам</TabsTrigger>
          <TabsTrigger value="calendar">Платёжный календарь</TabsTrigger>
        </TabsList>

        {/* === DDS Report === */}
        <TabsContent value="dds" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={exportDDS}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">ДДС по неделям (12 недель)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ddsData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value: number) => formatMoney(value)} />
                    <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} name="Приход" />
                    <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Расход" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Неделя</TableHead>
                      <TableHead className="text-right">Приход</TableHead>
                      <TableHead className="text-right">Расход</TableHead>
                      <TableHead className="text-right">Баланс</TableHead>
                      <TableHead className="text-right">Накопительный</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ddsData?.map((row) => (
                      <TableRow key={`${row.year}-${row.week}`}>
                        <TableCell className="font-medium">{row.year}-W{row.week}</TableCell>
                        <TableCell className="text-right text-green-600">{formatMoney(row.income)}</TableCell>
                        <TableCell className="text-right text-red-600">{formatMoney(row.expense)}</TableCell>
                        <TableCell className={`text-right font-medium ${row.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatMoney(row.balance)}
                        </TableCell>
                        <TableCell className={`text-right font-bold ${row.cumulative >= 0 ? "text-green-700" : "text-red-700"}`}>
                          {formatMoney(row.cumulative)}
                        </TableCell>
                        <TableCell>
                          {row.cumulative < 0 && (
                            <Badge variant="destructive" className="text-xs">Разрыв</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === P&L Report === */}
        <TabsContent value="pnl" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={exportPnL}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">P&L по проектам</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Проект</TableHead>
                        <TableHead className="text-right">Доход</TableHead>
                        <TableHead className="text-right">Расход</TableHead>
                        <TableHead className="text-right">Прибыль</TableHead>
                        <TableHead className="text-right">Маржа</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pnlData?.map((row) => (
                        <TableRow key={row.projectId}>
                          <TableCell className="font-medium">{row.projectName}</TableCell>
                          <TableCell className="text-right">{formatMoney(row.income)}</TableCell>
                          <TableCell className="text-right">{formatMoney(row.expense)}</TableCell>
                          <TableCell className={`text-right font-bold ${row.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatMoney(row.profit)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={`${row.margin >= 15 ? "text-green-600" : row.margin >= 0 ? "text-amber-600" : "text-red-600"}`}>
                              {row.margin.toFixed(1)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Визуализация</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pnlData || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                      <YAxis dataKey="projectName" type="category" width={100} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: number) => formatMoney(value)} />
                      <Bar dataKey="income" fill="#22c55e" name="Доход" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="expense" fill="#ef4444" name="Расход" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* === Payment Calendar === */}
        <TabsContent value="calendar" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={exportCalendar}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Платёжный календарь (90 дней)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>Проект</TableHead>
                      <TableHead>Контрагент</TableHead>
                      <TableHead>Статья</TableHead>
                      <TableHead className="text-right">Сумма</TableHead>
                      <TableHead>Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calendarData?.map((item) => {
                      const isOverdue = item.date && new Date(item.date) < new Date();
                      return (
                        <TableRow key={item.id} className={isOverdue ? "bg-red-50" : ""}>
                          <TableCell>
                            {item.date ? format(new Date(item.date), "dd.MM.yyyy") : "—"}
                          </TableCell>
                          <TableCell>{item.project?.name}</TableCell>
                          <TableCell>{item.counterparty?.name || "—"}</TableCell>
                          <TableCell>{item.article?.name}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatMoney(item.planExpense || 0)}
                          </TableCell>
                          <TableCell>
                            {isOverdue ? (
                              <Badge variant="destructive">Просрочено</Badge>
                            ) : (
                              <Badge variant="outline">Запланировано</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
