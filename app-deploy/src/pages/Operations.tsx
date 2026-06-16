import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const typeLabels: Record<string, string> = {
  dds: "ДДС",
  accrual: "Начисление",
  obligation: "Обязательство",
};

const typeColors: Record<string, string> = {
  dds: "bg-blue-100 text-blue-800",
  accrual: "bg-green-100 text-green-800",
  obligation: "bg-amber-100 text-amber-800",
};

const statusLabels: Record<string, string> = {
  plan: "План",
  fact: "Факт",
};

export default function Operations() {
  const utils = trpc.useUtils();

  // Filters
  const [filterType, setFilterType] = useState<string>("");
  const [filterProject, setFilterProject] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    projectId: "",
    type: "dds" as "dds" | "accrual" | "obligation",
    status: "fact" as "plan" | "fact",
    counterpartyId: "",
    articleId: "",
    planIncome: "",
    planExpense: "",
    factIncome: "",
    factExpense: "",
    projectStage: "",
    comment: "",
  });

  // Data queries
  const { data: operations, isLoading } = trpc.operations.list.useQuery({
    type: filterType && filterType !== "all" ? (filterType as "dds" | "accrual" | "obligation") : undefined,
    projectId: filterProject && filterProject !== "all" ? parseInt(filterProject) : undefined,
    status: filterStatus && filterStatus !== "all" ? (filterStatus as "plan" | "fact") : undefined,
  });

  const { data: projects } = trpc.projects.list.useQuery();
  const { data: articles } = trpc.articles.list.useQuery();
  const { data: counterparties } = trpc.counterparties.list.useQuery();

  // Filter articles by selected type
  const filteredArticles = articles?.filter(
    (a) => a.type === formData.type || (formData.type === "obligation" && a.type === "dds")
  );

  // Mutations
  const createOp = trpc.operations.create.useMutation({
    onSuccess: () => {
      utils.operations.list.invalidate();
      utils.operations.dashboardKpi.invalidate();
      utils.operations.alerts.invalidate();
      resetForm();
      setShowForm(false);
    },
  });

  const updateOp = trpc.operations.update.useMutation({
    onSuccess: () => {
      utils.operations.list.invalidate();
      utils.operations.dashboardKpi.invalidate();
      utils.operations.alerts.invalidate();
      resetForm();
      setEditingId(null);
    },
  });

  const deleteOp = trpc.operations.delete.useMutation({
    onSuccess: () => {
      utils.operations.list.invalidate();
      utils.operations.dashboardKpi.invalidate();
      utils.operations.alerts.invalidate();
    },
  });

  const resetForm = () => {
    setFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      projectId: "",
      type: "dds",
      status: "fact",
      counterpartyId: "none",
      articleId: "",
      planIncome: "",
      planExpense: "",
      factIncome: "",
      factExpense: "",
      projectStage: "",
      comment: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      date: new Date(formData.date),
      projectId: parseInt(formData.projectId),
      type: formData.type,
      status: formData.status,
      counterpartyId: formData.counterpartyId && formData.counterpartyId !== "none" ? parseInt(formData.counterpartyId) : null,
      articleId: parseInt(formData.articleId),
      planIncome: parseFloat(formData.planIncome || "0"),
      planExpense: parseFloat(formData.planExpense || "0"),
      factIncome: parseFloat(formData.factIncome || "0"),
      factExpense: parseFloat(formData.factExpense || "0"),
      projectStage: formData.projectStage || null,
      comment: formData.comment || null,
    };

    if (editingId) {
      updateOp.mutate({ id: editingId, ...data });
    } else {
      createOp.mutate(data);
    }
  };

  const handleEdit = (op: NonNullable<typeof operations>[number]) => {
    setEditingId(op.id);
    setFormData({
      date: op.date ? format(new Date(op.date), "yyyy-MM-dd") : "",
      projectId: String(op.projectId),
      type: op.type,
      status: op.status,
      counterpartyId: op.counterpartyId ? String(op.counterpartyId) : "none",
      articleId: String(op.articleId),
      planIncome: op.planIncome ? String(op.planIncome) : "",
      planExpense: op.planExpense ? String(op.planExpense) : "",
      factIncome: op.factIncome ? String(op.factIncome) : "",
      factExpense: op.factExpense ? String(op.factExpense) : "",
      projectStage: op.projectStage || "",
      comment: op.comment || "",
    });
    setShowForm(true);
  };

  const formatMoney = (amount: number | null) => {
    if (!amount || amount === 0) return "—";
    return amount.toLocaleString("ru-RU") + " ₽";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Операции</h2>
        <Button onClick={() => { resetForm(); setEditingId(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Добавить
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Тип операции" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="dds">ДДС</SelectItem>
                <SelectItem value="accrual">Начисление</SelectItem>
                <SelectItem value="obligation">Обязательство</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Проект" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все проекты</SelectItem>
                {projects?.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="plan">План</SelectItem>
                <SelectItem value="fact">Факт</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Проект</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Контрагент</TableHead>
                  <TableHead>Статья</TableHead>
                  <TableHead className="text-right">Приход</TableHead>
                  <TableHead className="text-right">Расход</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">Загрузка...</TableCell>
                  </TableRow>
                ) : operations?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Нет операций. Нажмите «Добавить» для создания первой записи.
                    </TableCell>
                  </TableRow>
                ) : (
                  operations?.map((op) => (
                    <TableRow key={op.id}>
                      <TableCell>
                        {op.date ? format(new Date(op.date), "dd.MM.yyyy", { locale: ru }) : "—"}
                      </TableCell>
                      <TableCell className="font-medium">{op.project?.name}</TableCell>
                      <TableCell>
                        <Badge className={typeColors[op.type]} variant="secondary">
                          {typeLabels[op.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>{op.counterparty?.name || "—"}</TableCell>
                      <TableCell>{op.article?.name}</TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatMoney(op.factIncome || op.planIncome)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatMoney(op.factExpense || op.planExpense)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={op.status === "fact" ? "default" : "outline"}>
                          {statusLabels[op.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(op)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500"
                            onClick={() => { if (confirm("Удалить операцию?")) deleteOp.mutate({ id: op.id }); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Редактировать операцию" : "Новая операция"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Дата *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Проект *</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(v) => setFormData({ ...formData, projectId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите проект" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Тип операции *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v as "dds" | "accrual" | "obligation", articleId: "" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dds">ДДС (денежный поток)</SelectItem>
                    <SelectItem value="accrual">Начисление (P&L)</SelectItem>
                    <SelectItem value="obligation">Обязательство (план)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Статус *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v as "plan" | "fact" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plan">План</SelectItem>
                    <SelectItem value="fact">Факт</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Контрагент</Label>
                <Select
                  value={formData.counterpartyId}
                  onValueChange={(v) => setFormData({ ...formData, counterpartyId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите контрагента" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {counterparties?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Статья *</Label>
                <Select
                  value={formData.articleId}
                  onValueChange={(v) => setFormData({ ...formData, articleId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статью" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredArticles?.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>План приход</Label>
                <Input
                  type="number"
                  value={formData.planIncome}
                  onChange={(e) => setFormData({ ...formData, planIncome: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>План расход</Label>
                <Input
                  type="number"
                  value={formData.planExpense}
                  onChange={(e) => setFormData({ ...formData, planExpense: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Факт приход</Label>
                <Input
                  type="number"
                  value={formData.factIncome}
                  onChange={(e) => setFormData({ ...formData, factIncome: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Факт расход</Label>
                <Input
                  type="number"
                  value={formData.factExpense}
                  onChange={(e) => setFormData({ ...formData, factExpense: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Этап проекта</Label>
                <Input
                  value={formData.projectStage}
                  onChange={(e) => setFormData({ ...formData, projectStage: e.target.value })}
                  placeholder="Напр: фундамент"
                />
              </div>
              <div className="space-y-2">
                <Label>Комментарий</Label>
                <Input
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={createOp.isPending || updateOp.isPending}>
                {editingId ? "Сохранить" : "Создать"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
