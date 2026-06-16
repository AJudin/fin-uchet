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
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function References() {
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState("projects");
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [projectForm, setProjectForm] = useState({ name: "", status: "active" as string, budget: "" });
  const [articleForm, setArticleForm] = useState({ name: "", category: "expense" as string, type: "dds" as string });
  const [counterpartyForm, setCounterpartyForm] = useState({ name: "", type: "supplier" as string, inn: "" });
  const [userForm, setUserForm] = useState({ login: "", password: "", name: "", role: "operator" as string });

  // Queries
  const { data: projects } = trpc.projects.list.useQuery();
  const { data: articles } = trpc.articles.list.useQuery();
  const { data: counterparties } = trpc.counterparties.list.useQuery();
  const { data: usersList } = trpc.users.list.useQuery();

  // Mutations
  const createProject = trpc.projects.create.useMutation({ onSuccess: () => { utils.projects.list.invalidate(); closeDialog(); } });
  const updateProject = trpc.projects.update.useMutation({ onSuccess: () => { utils.projects.list.invalidate(); closeDialog(); } });
  const deleteProject = trpc.projects.delete.useMutation({ onSuccess: () => utils.projects.list.invalidate() });

  const createArticle = trpc.articles.create.useMutation({ onSuccess: () => { utils.articles.list.invalidate(); closeDialog(); } });
  const updateArticle = trpc.articles.update.useMutation({ onSuccess: () => { utils.articles.list.invalidate(); closeDialog(); } });
  const deleteArticle = trpc.articles.delete.useMutation({ onSuccess: () => utils.articles.list.invalidate() });

  const createCounterparty = trpc.counterparties.create.useMutation({ onSuccess: () => { utils.counterparties.list.invalidate(); closeDialog(); } });
  const updateCounterparty = trpc.counterparties.update.useMutation({ onSuccess: () => { utils.counterparties.list.invalidate(); closeDialog(); } });
  const deleteCounterparty = trpc.counterparties.delete.useMutation({ onSuccess: () => utils.counterparties.list.invalidate() });

  const createUser = trpc.users.create.useMutation({ onSuccess: () => { utils.users.list.invalidate(); closeDialog(); } });
  const updateUser = trpc.users.update.useMutation({ onSuccess: () => { utils.users.list.invalidate(); closeDialog(); } });
  const deleteUser = trpc.users.delete.useMutation({ onSuccess: () => utils.users.list.invalidate() });

  const closeDialog = () => { setShowDialog(false); setEditingId(null); resetForms(); };

  const resetForms = () => {
    setProjectForm({ name: "", status: "active", budget: "" });
    setArticleForm({ name: "", category: "expense", type: "dds" });
    setCounterpartyForm({ name: "", type: "supplier", inn: "" });
    setUserForm({ login: "", password: "", name: "", role: "operator" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "projects") {
      const data = { name: projectForm.name, status: projectForm.status as "active" | "completed" | "paused", budget: projectForm.budget ? parseFloat(projectForm.budget) : null };
      editingId ? updateProject.mutate({ id: editingId, ...data }) : createProject.mutate(data);
    } else if (activeTab === "articles") {
      const artData = { name: articleForm.name, category: articleForm.category as "income" | "expense", type: articleForm.type as "dds" | "accrual" | "obligation" };
      editingId ? updateArticle.mutate({ id: editingId, ...artData }) : createArticle.mutate(artData);
    } else if (activeTab === "counterparties") {
      const data = { name: counterpartyForm.name, type: counterpartyForm.type as "client" | "supplier" | "contractor" | "employee", inn: counterpartyForm.inn || null };
      editingId ? updateCounterparty.mutate({ id: editingId, ...data }) : createCounterparty.mutate(data);
    } else if (activeTab === "users") {
      const userData = { login: userForm.login, password: userForm.password, name: userForm.name, role: userForm.role as "operator" | "admin" };
      editingId ? updateUser.mutate({ id: editingId, name: userForm.name, role: userForm.role as "operator" | "admin" }) : createUser.mutate(userData);
    }
  };

  const statusLabels: Record<string, string> = { active: "Активен", completed: "Завершён", paused: "Приостановлен" };
  const typeLabels: Record<string, string> = { client: "Клиент", supplier: "Поставщик", contractor: "Подрядчик", employee: "Сотрудник" };
  const roleLabels: Record<string, string> = { admin: "Администратор", operator: "Оператор" };
  const articleTypeLabels: Record<string, string> = { dds: "ДДС", accrual: "Начисление", obligation: "Обязательство" };
  const categoryLabels: Record<string, string> = { income: "Доход", expense: "Расход" };

  const renderDialogContent = () => {
    if (activeTab === "projects") {
      return (
        <>
          <div className="space-y-2"><Label>Название *</Label><Input value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} required /></div>
          <div className="space-y-2"><Label>Статус</Label>
            <Select value={projectForm.status} onValueChange={(v) => setProjectForm({ ...projectForm, status: v as "active" | "completed" | "paused" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="active">Активен</SelectItem><SelectItem value="completed">Завершён</SelectItem><SelectItem value="paused">Приостановлен</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Бюджет</Label><Input type="number" value={projectForm.budget} onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })} /></div>
        </>
      );
    }
    if (activeTab === "articles") {
      return (
        <>
          <div className="space-y-2"><Label>Название *</Label><Input value={articleForm.name} onChange={(e) => setArticleForm({ ...articleForm, name: e.target.value })} required /></div>
          <div className="space-y-2"><Label>Категория</Label>
            <Select value={articleForm.category} onValueChange={(v) => setArticleForm({ ...articleForm, category: v as "income" | "expense" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="income">Доход</SelectItem><SelectItem value="expense">Расход</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Тип</Label>
            <Select value={articleForm.type} onValueChange={(v) => setArticleForm({ ...articleForm, type: v as "dds" | "accrual" | "obligation" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="dds">ДДС</SelectItem><SelectItem value="accrual">Начисление</SelectItem><SelectItem value="obligation">Обязательство</SelectItem></SelectContent>
            </Select>
          </div>
        </>
      );
    }
    if (activeTab === "counterparties") {
      return (
        <>
          <div className="space-y-2"><Label>Название *</Label><Input value={counterpartyForm.name} onChange={(e) => setCounterpartyForm({ ...counterpartyForm, name: e.target.value })} required /></div>
          <div className="space-y-2"><Label>Тип</Label>
            <Select value={counterpartyForm.type} onValueChange={(v) => setCounterpartyForm({ ...counterpartyForm, type: v as "client" | "supplier" | "contractor" | "employee" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="client">Клиент</SelectItem><SelectItem value="supplier">Поставщик</SelectItem><SelectItem value="contractor">Подрядчик</SelectItem><SelectItem value="employee">Сотрудник</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>ИНН</Label><Input value={counterpartyForm.inn} onChange={(e) => setCounterpartyForm({ ...counterpartyForm, inn: e.target.value })} /></div>
        </>
      );
    }
    if (activeTab === "users") {
      return (
        <>
          {!editingId && <div className="space-y-2"><Label>Логин *</Label><Input value={userForm.login} onChange={(e) => setUserForm({ ...userForm, login: e.target.value })} required /></div>}
          <div className="space-y-2"><Label>Имя *</Label><Input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} required /></div>
          {!editingId && <div className="space-y-2"><Label>Пароль *</Label><Input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required /></div>}
          <div className="space-y-2"><Label>Роль</Label>
            <Select value={userForm.role} onValueChange={(v) => setUserForm({ ...userForm, role: v as "operator" | "admin" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="operator">Оператор</SelectItem><SelectItem value="admin">Администратор</SelectItem></SelectContent>
            </Select>
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Справочники</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="projects">Проекты</TabsTrigger>
          <TabsTrigger value="articles">Статьи</TabsTrigger>
          <TabsTrigger value="counterparties">Контрагенты</TabsTrigger>
          <TabsTrigger value="users">Пользователи</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <div className="flex justify-end"><Button onClick={() => { setEditingId(null); resetForms(); setShowDialog(true); }}><Plus className="h-4 w-4 mr-1" /> Добавить</Button></div>
          <Card><CardContent className="p-0">
            <Table><TableHeader><TableRow><TableHead>Название</TableHead><TableHead>Статус</TableHead><TableHead className="text-right">Бюджет</TableHead><TableHead className="w-24"></TableHead></TableRow></TableHeader>
            <TableBody>{projects?.map((p) => (<TableRow key={p.id}><TableCell className="font-medium">{p.name}</TableCell><TableCell><Badge variant={p.status === "active" ? "default" : "secondary"}>{statusLabels[p.status]}</Badge></TableCell><TableCell className="text-right">{p.budget ? p.budget.toLocaleString("ru-RU") + " ₽" : "—"}</TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingId(p.id); setProjectForm({ name: p.name, status: p.status as string, budget: p.budget ? String(p.budget) : "" }); setShowDialog(true); }}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => confirm("Удалить проект?") && deleteProject.mutate({ id: p.id })}><Trash2 className="h-3.5 w-3.5" /></Button></div></TableCell></TableRow>))}</TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="articles" className="space-y-4">
          <div className="flex justify-end"><Button onClick={() => { setEditingId(null); resetForms(); setShowDialog(true); }}><Plus className="h-4 w-4 mr-1" /> Добавить</Button></div>
          <Card><CardContent className="p-0">
            <Table><TableHeader><TableRow><TableHead>Название</TableHead><TableHead>Категория</TableHead><TableHead>Тип</TableHead><TableHead className="w-24"></TableHead></TableRow></TableHeader>
            <TableBody>{articles?.map((a) => (<TableRow key={a.id}><TableCell className="font-medium">{a.name}</TableCell><TableCell><Badge variant={a.category === "income" ? "default" : "secondary"}>{categoryLabels[a.category]}</Badge></TableCell><TableCell>{articleTypeLabels[a.type]}</TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingId(a.id); setArticleForm({ name: a.name, category: a.category as string, type: a.type as string }); setShowDialog(true); }}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => confirm("Удалить статью?") && deleteArticle.mutate({ id: a.id })}><Trash2 className="h-3.5 w-3.5" /></Button></div></TableCell></TableRow>))}</TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="counterparties" className="space-y-4">
          <div className="flex justify-end"><Button onClick={() => { setEditingId(null); resetForms(); setShowDialog(true); }}><Plus className="h-4 w-4 mr-1" /> Добавить</Button></div>
          <Card><CardContent className="p-0">
            <Table><TableHeader><TableRow><TableHead>Название</TableHead><TableHead>Тип</TableHead><TableHead>ИНН</TableHead><TableHead className="w-24"></TableHead></TableRow></TableHeader>
            <TableBody>{counterparties?.map((c) => (<TableRow key={c.id}><TableCell className="font-medium">{c.name}</TableCell><TableCell>{typeLabels[c.type]}</TableCell><TableCell>{c.inn || "—"}</TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingId(c.id); setCounterpartyForm({ name: c.name, type: c.type as string, inn: c.inn || "" }); setShowDialog(true); }}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => confirm("Удалить контрагента?") && deleteCounterparty.mutate({ id: c.id })}><Trash2 className="h-3.5 w-3.5" /></Button></div></TableCell></TableRow>))}</TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-end"><Button onClick={() => { setEditingId(null); resetForms(); setShowDialog(true); }}><Plus className="h-4 w-4 mr-1" /> Добавить</Button></div>
          <Card><CardContent className="p-0">
            <Table><TableHeader><TableRow><TableHead>Логин</TableHead><TableHead>Имя</TableHead><TableHead>Роль</TableHead><TableHead>Статус</TableHead><TableHead className="w-24"></TableHead></TableRow></TableHeader>
            <TableBody>{usersList?.map((u) => (<TableRow key={u.id}><TableCell className="font-medium">{u.login}</TableCell><TableCell>{u.name}</TableCell><TableCell><Badge variant={u.role === "admin" ? "default" : "secondary"}>{roleLabels[u.role]}</Badge></TableCell><TableCell><Badge variant={u.isActive ? "outline" : "destructive"}>{u.isActive ? "Активен" : "Отключён"}</Badge></TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingId(u.id); setUserForm({ login: u.login, password: "", name: u.name, role: u.role as string }); setShowDialog(true); }}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => confirm("Удалить пользователя?") && deleteUser.mutate({ id: u.id })}><Trash2 className="h-3.5 w-3.5" /></Button></div></TableCell></TableRow>))}</TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Редактировать" : "Добавить"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {renderDialogContent()}
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Отмена</Button>
              <Button type="submit">{editingId ? "Сохранить" : "Создать"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
