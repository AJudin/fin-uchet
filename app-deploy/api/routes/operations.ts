import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { operations, projects, articles } from "@db/schema";
import { eq, and, gte, lte, desc, asc, sql } from "drizzle-orm";

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((+d - +yearStart) / 86400000) + 1) / 7);
}

export const operationsRouter = createRouter({
  list: authedQuery
    .input(z.object({ type: z.enum(["dds", "accrual", "obligation"]).optional(), projectId: z.number().optional(), status: z.enum(["plan", "fact"]).optional(), dateFrom: z.date().optional(), dateTo: z.date().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.type) conditions.push(eq(operations.type, input.type));
      if (input?.projectId) conditions.push(eq(operations.projectId, input.projectId));
      if (input?.status) conditions.push(eq(operations.status, input.status));
      if (input?.dateFrom) conditions.push(gte(operations.date, input.dateFrom));
      if (input?.dateTo) conditions.push(lte(operations.date, input.dateTo));
      return db.query.operations.findMany({ where: conditions.length > 0 ? and(...conditions) : undefined, with: { project: true, article: true, counterparty: true, creator: { columns: { passwordHash: false } } }, orderBy: desc(operations.date) });
    }),

  create: authedQuery
    .input(z.object({ date: z.date(), projectId: z.number(), type: z.enum(["dds", "accrual", "obligation"]), status: z.enum(["plan", "fact"]), counterpartyId: z.number().optional().nullable(), articleId: z.number(), planIncome: z.number().default(0), planExpense: z.number().default(0), factIncome: z.number().default(0), factExpense: z.number().default(0), projectStage: z.string().max(100).optional().nullable(), comment: z.string().optional().nullable() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const method = input.type === "dds" ? "cash" : "accrual";
      const week = getWeekNumber(input.date);
      const result = await db.insert(operations).values({ date: input.date, projectId: input.projectId, type: input.type, status: input.status, counterpartyId: input.counterpartyId, articleId: input.articleId, planIncome: input.planIncome, planExpense: input.planExpense, factIncome: input.factIncome, factExpense: input.factExpense, projectStage: input.projectStage, comment: input.comment, week, method, createdBy: ctx.user!.id } as any).returning();
      return result[0];
    }),

  update: authedQuery
    .input(z.object({ id: z.number(), date: z.date().optional(), projectId: z.number().optional(), type: z.enum(["dds", "accrual", "obligation"]).optional(), status: z.enum(["plan", "fact"]).optional(), counterpartyId: z.number().optional().nullable(), articleId: z.number().optional(), planIncome: z.number().optional(), planExpense: z.number().optional(), factIncome: z.number().optional(), factExpense: z.number().optional(), projectStage: z.string().max(100).optional().nullable(), comment: z.string().optional().nullable() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      if (data.date && data.type) { (data as any).week = getWeekNumber(data.date); (data as any).method = data.type === "dds" ? "cash" : "accrual"; }
      else if (data.date) { (data as any).week = getWeekNumber(data.date); }
      else if (data.type) { (data as any).method = data.type === "dds" ? "cash" : "accrual"; }
      const result = await db.update(operations).set(data as any).where(eq(operations.id, id)).returning();
      return result[0];
    }),

  delete: authedQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    const db = getDb();
    await db.delete(operations).where(eq(operations.id, input.id));
    return { success: true };
  }),

  ddsByWeeks: authedQuery.input(z.object({ weeks: z.number().default(12) }).optional()).query(async ({ input }) => {
    const db = getDb();
    const weeksCount = input?.weeks ?? 12;
    const now = new Date();
    const fromDate = new Date(now); fromDate.setDate(fromDate.getDate() - weeksCount * 7);
    const rows = await db.select({ week: operations.week, year: sql<number>`strftime('%Y', ${operations.date})`, income: sql<number>`COALESCE(SUM(${operations.factIncome}), 0)`, expense: sql<number>`COALESCE(SUM(${operations.factExpense}), 0)` }).from(operations).where(and(eq(operations.type, "dds"), eq(operations.status, "fact"), gte(operations.date, fromDate))).groupBy(sql`strftime('%Y', ${operations.date})`, operations.week).orderBy(sql`strftime('%Y', ${operations.date})`, operations.week);
    let cumulative = 0;
    return rows.map((row) => { const balance = row.income - row.expense; cumulative += balance; return { week: row.week, year: row.year, income: row.income, expense: row.expense, balance, cumulative }; });
  }),

  pnlByProjects: authedQuery.input(z.object({ dateFrom: z.date().optional(), dateTo: z.date().optional() }).optional()).query(async ({ input }) => {
    const db = getDb();
    const conditions = [eq(operations.type, "accrual")];
    if (input?.dateFrom) conditions.push(gte(operations.date, input.dateFrom));
    if (input?.dateTo) conditions.push(lte(operations.date, input.dateTo));
    const rows = await db.select({ projectId: operations.projectId, projectName: projects.name, income: sql<number>`COALESCE(SUM(CASE WHEN ${articles.category} = 'income' THEN ${operations.factIncome} ELSE 0 END), 0)`, expense: sql<number>`COALESCE(SUM(CASE WHEN ${articles.category} = 'expense' THEN ${operations.factExpense} ELSE 0 END), 0)` }).from(operations).innerJoin(projects, eq(operations.projectId, projects.id)).innerJoin(articles, eq(operations.articleId, articles.id)).where(and(...conditions)).groupBy(operations.projectId).orderBy(projects.name);
    return rows.map((row) => ({ ...row, profit: row.income - row.expense, margin: row.income > 0 ? ((row.income - row.expense) / row.income) * 100 : 0 }));
  }),

  paymentCalendar: authedQuery.input(z.object({ days: z.number().default(90) }).optional()).query(async ({ input }) => {
    const db = getDb();
    const daysCount = input?.days ?? 90;
    const toDate = new Date(); toDate.setDate(toDate.getDate() + daysCount);
    return db.query.operations.findMany({ where: and(eq(operations.type, "obligation"), eq(operations.status, "plan"), lte(operations.date, toDate)), with: { project: true, counterparty: true, article: true }, orderBy: asc(operations.date) });
  }),

  dashboardKpi: authedQuery.query(async () => {
    const db = getDb();
    const cashResult = await db.select({ total: sql<number>`COALESCE(SUM(${operations.factIncome} - ${operations.factExpense}), 0)` }).from(operations).where(and(eq(operations.type, "dds"), eq(operations.status, "fact")));
    const now = new Date(); const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const profitResult = await db.select({ income: sql<number>`COALESCE(SUM(CASE WHEN ${articles.category} = 'income' THEN ${operations.factIncome} ELSE 0 END), 0)`, expense: sql<number>`COALESCE(SUM(CASE WHEN ${articles.category} = 'expense' THEN ${operations.factExpense} ELSE 0 END), 0)` }).from(operations).innerJoin(articles, eq(operations.articleId, articles.id)).where(and(eq(operations.type, "accrual"), gte(operations.date, monthStart)));
    const forecastDate = new Date(now); forecastDate.setDate(forecastDate.getDate() + 30);
    const obligationsResult = await db.select({ total: sql<number>`COALESCE(SUM(${operations.planExpense} - ${operations.planIncome}), 0)` }).from(operations).where(and(eq(operations.type, "obligation"), eq(operations.status, "plan"), lte(operations.date, forecastDate)));
    const cashNow = cashResult[0]?.total ?? 0;
    const obligations = obligationsResult[0]?.total ?? 0;
    return { cashNow, monthlyIncome: profitResult[0]?.income ?? 0, monthlyExpense: profitResult[0]?.expense ?? 0, monthlyProfit: (profitResult[0]?.income ?? 0) - (profitResult[0]?.expense ?? 0), forecast: cashNow - obligations, obligations };
  }),

  balanceChart: authedQuery.input(z.object({ days: z.number().default(90) }).optional()).query(async ({ input }) => {
    const db = getDb();
    const daysCount = input?.days ?? 90;
    const fromDate = new Date(); fromDate.setDate(fromDate.getDate() - daysCount);
    const rows = await db.select({ date: operations.date, dailyBalance: sql<number>`COALESCE(SUM(${operations.factIncome} - ${operations.factExpense}), 0)` }).from(operations).where(and(eq(operations.type, "dds"), eq(operations.status, "fact"), gte(operations.date, fromDate))).groupBy(operations.date).orderBy(operations.date);
    let cumulative = 0;
    return rows.map((row) => { cumulative += row.dailyBalance; return { date: row.date, dailyBalance: row.dailyBalance, cumulativeBalance: cumulative }; });
  }),

  alerts: authedQuery.query(async () => {
    const db = getDb();
    const alerts: Array<{ type: string; message: string; severity: "warning" | "danger" }> = [];
    const now = new Date();
    const cashResult = await db.select({ total: sql<number>`COALESCE(SUM(${operations.factIncome} - ${operations.factExpense}), 0)` }).from(operations).where(and(eq(operations.type, "dds"), eq(operations.status, "fact")));
    const cashNow = cashResult[0]?.total ?? 0;
    const upcomingObligations = await db.select({ total: sql<number>`COALESCE(SUM(${operations.planExpense}), 0)` }).from(operations).where(and(eq(operations.type, "obligation"), eq(operations.status, "plan"), gte(operations.date, now), lte(operations.date, new Date(now.getTime() + 14 * 86400000))));
    const upcomingTotal = upcomingObligations[0]?.total ?? 0;
    if (cashNow < upcomingTotal) alerts.push({ type: "cash_gap", message: `Кассовый разрыв: обязательства на ${upcomingTotal.toLocaleString("ru-RU")} ₽ превышают кассу ${cashNow.toLocaleString("ru-RU")} ₽`, severity: "danger" });
    const overdue = await db.select({ count: sql<number>`COUNT(*)` }).from(operations).where(and(eq(operations.type, "obligation"), eq(operations.status, "plan"), lte(operations.date, now)));
    if (overdue[0].count > 0) alerts.push({ type: "overdue", message: `Просроченных обязательств: ${overdue[0].count}`, severity: "warning" });
    const projectPnL = await db.select({ projectId: operations.projectId, projectName: projects.name, income: sql<number>`COALESCE(SUM(CASE WHEN ${articles.category} = 'income' THEN ${operations.factIncome} ELSE 0 END), 0)`, expense: sql<number>`COALESCE(SUM(CASE WHEN ${articles.category} = 'expense' THEN ${operations.factExpense} ELSE 0 END), 0)` }).from(operations).innerJoin(projects, eq(operations.projectId, projects.id)).innerJoin(articles, eq(operations.articleId, articles.id)).where(eq(operations.type, "accrual")).groupBy(operations.projectId);
    for (const p of projectPnL) { if (p.income > 0 && p.expense > p.income) alerts.push({ type: "unprofitable_project", message: `Проект "${p.projectName}" убыточен: −${(p.expense - p.income).toLocaleString("ru-RU")} ₽`, severity: "warning" }); }
    return alerts;
  }),
});
