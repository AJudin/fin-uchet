import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";

const DB_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.resolve(DB_DIR, "finance.db");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");

const db = drizzle(sqlite, { schema });

async function seed() {
  console.log("Seeding database...");

  // Check if already seeded
  try {
    const existingUsers = sqlite.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
    if (existingUsers.count > 0) {
      console.log("Database already seeded, skipping.");
      sqlite.close();
      return;
    }
  } catch {
    // Tables don't exist yet, continue with seeding
  }

  // ===== Users =====
  const adminHash = await bcrypt.hash("admin", 10);
  const operatorHash = await bcrypt.hash("operator", 10);

  await db.insert(schema.users).values([
    { login: "admin", passwordHash: adminHash, name: "Администратор", role: "admin" },
    { login: "operator", passwordHash: operatorHash, name: "Оператор", role: "operator" },
  ]);
  console.log("Users seeded");

  // ===== Projects =====
  await db.insert(schema.projects).values([
    { name: "Монтаж А1", status: "active", startDate: new Date("2025-10-01"), budget: 2000000 },
    { name: "Электрика Б2", status: "active", startDate: new Date("2025-11-15"), budget: 1200000 },
    { name: "Отопление В3", status: "active", startDate: new Date("2025-12-01"), budget: 800000 },
    { name: "Вентиляция Г4", status: "active", startDate: new Date("2026-01-10"), budget: 1500000 },
    { name: "Фасад Д5", status: "completed", startDate: new Date("2025-06-01"), endDate: new Date("2025-12-15"), budget: 3000000 },
  ]);
  console.log("Projects seeded");

  // ===== Articles =====
  await db.insert(schema.articles).values([
    { name: "Материалы", category: "expense", type: "dds" },
    { name: "Зарплата", category: "expense", type: "dds" },
    { name: "Аренда", category: "expense", type: "dds" },
    { name: "Подрядные работы", category: "expense", type: "dds" },
    { name: "Работы заказчику", category: "income", type: "accrual" },
    { name: "Материалы (начисление)", category: "expense", type: "accrual" },
    { name: "Амортизация", category: "expense", type: "accrual" },
    { name: "Поставщики", category: "expense", type: "obligation" },
    { name: "Аренда (обязательство)", category: "expense", type: "obligation" },
    { name: "Налоги", category: "expense", type: "obligation" },
  ]);
  console.log("Articles seeded");

  // ===== Counterparties =====
  await db.insert(schema.counterparties).values([
    { name: "ООО СтройМат", type: "supplier", inn: "7701234567" },
    { name: "ИП Иванов С.П.", type: "contractor", inn: "501234567890" },
    { name: "ООО ЭлектроСнаб", type: "supplier", inn: "7707654321" },
    { name: "ЗАО ТеплоСистемы", type: "supplier", inn: "7809876543" },
    { name: "ООО ГлавСтрой", type: "client", inn: "7701112223" },
    { name: "ООО Рентал", type: "supplier", inn: "7704445556" },
  ]);
  console.log("Counterparties seeded");

  // ===== Operations - DDS (Cash Flow) =====
  const now = new Date();
  const ops = [];

  // Generate DDS operations for last 3 months
  for (let i = 0; i < 90; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const week = getWeekNumber(date);

    // Every 3-4 days: material expense
    if (i % 3 === 0) {
      ops.push({
        date, week, projectId: [1, 2, 3, 4][i % 4],
        type: "dds" as const, method: "cash" as const, status: "fact" as const,
        counterpartyId: 1, articleId: 1,
        factIncome: 0, factExpense: [80000, 120000, 50000, 150000][i % 4],
        planIncome: 0, planExpense: 0,
        comment: `Закупка материалов`, createdBy: 1,
      });
    }

    // Every 7 days: salary
    if (i % 7 === 0 && i > 0) {
      ops.push({
        date, week, projectId: 1,
        type: "dds" as const, method: "cash" as const, status: "fact" as const,
        counterpartyId: 2, articleId: 2,
        factIncome: 0, factExpense: 350000,
        planIncome: 0, planExpense: 0,
        comment: `Зарплата`, createdBy: 1,
      });
    }

    // Every 15 days: client payment
    if (i % 15 === 0) {
      ops.push({
        date, week, projectId: [1, 2, 5][i % 3],
        type: "dds" as const, method: "cash" as const, status: "fact" as const,
        counterpartyId: 5, articleId: 1,
        factIncome: [500000, 350000, 800000][i % 3], factExpense: 0,
        planIncome: 0, planExpense: 0,
        comment: `Оплата от заказчика`, createdBy: 1,
      });
    }
  }

  // ===== Operations - Accrual (P&L) =====
  for (let i = 0; i < 60; i += 5) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const week = getWeekNumber(date);

    // Income accrual
    ops.push({
      date, week, projectId: [1, 2, 5][i % 3],
      type: "accrual" as const, method: "accrual" as const, status: "fact" as const,
      counterpartyId: 5, articleId: 5,
      factIncome: [600000, 400000, 900000][i % 3], factExpense: 0,
      planIncome: 0, planExpense: 0,
      comment: `Подписан акт`, createdBy: 1,
    });

    // Expense accrual
    ops.push({
      date, week, projectId: [1, 2, 3][i % 3],
      type: "accrual" as const, method: "accrual" as const, status: "fact" as const,
      counterpartyId: [1, 2, 3][i % 3], articleId: 6,
      factIncome: 0, factExpense: [300000, 200000, 150000][i % 3],
      planIncome: 0, planExpense: 0,
      comment: `Списание материалов`, createdBy: 1,
    });
  }

  // ===== Operations - Obligations =====
  for (let i = 1; i <= 30; i += 3) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    const week = getWeekNumber(date);

    ops.push({
      date, week, projectId: [1, 2, 3, 4][i % 4],
      type: "obligation" as const, method: "cash" as const, status: "plan" as const,
      counterpartyId: [1, 3, 4, 6][i % 4], articleId: [8, 8, 8, 9][i % 4],
      factIncome: 0, factExpense: 0,
      planIncome: 0, planExpense: [100000, 150000, 80000, 450000][i % 4],
      comment: `Плановый платёж`, createdBy: 1,
    });
  }

  // Insert all operations
  for (const op of ops) {
    await db.insert(schema.operations).values(op);
  }
  console.log(`Operations seeded: ${ops.length} records`);

  console.log("Seed complete!");
  sqlite.close();
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((+d - +yearStart) / 86400000) + 1) / 7);
}

seed().catch(console.error);
