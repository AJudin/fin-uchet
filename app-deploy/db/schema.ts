import {
  sqliteTable,
  integer,
  text,
  real,
} from "drizzle-orm/sqlite-core";

// ============================================
// Users - пользователи системы
// ============================================
export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  login: text("login", { length: 50 }).notNull().unique(),
  passwordHash: text("password_hash", { length: 255 }).notNull(),
  role: text("role", { length: 20 }).notNull().$type<"operator" | "admin">(),
  name: text("name", { length: 100 }).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ============================================
// Projects - строительные проекты / объекты
// ============================================
export const projects = sqliteTable("projects", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name", { length: 100 }).notNull(),
  status: text("status", { length: 20 }).notNull().$type<"active" | "completed" | "paused">().default("active"),
  startDate: integer("start_date", { mode: "timestamp" }),
  endDate: integer("end_date", { mode: "timestamp" }),
  budget: real("budget"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ============================================
// Articles - статьи доходов и расходов
// ============================================
export const articles = sqliteTable("articles", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name", { length: 100 }).notNull(),
  category: text("category", { length: 20 }).notNull().$type<"income" | "expense">(),
  type: text("type", { length: 20 }).notNull().$type<"dds" | "accrual" | "obligation">(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ============================================
// Counterparties - контрагенты
// ============================================
export const counterparties = sqliteTable("counterparties", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name", { length: 100 }).notNull(),
  type: text("type", { length: 20 }).notNull().$type<"client" | "supplier" | "contractor" | "employee">(),
  inn: text("inn", { length: 12 }),
  contact: text("contact", { length: 255 }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ============================================
// Operations - единая таблица операций (ядро системы)
// ============================================
export const operations = sqliteTable("operations", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  week: integer("week", { mode: "number" }).notNull(),
  projectId: integer("project_id", { mode: "number" }).notNull().references(() => projects.id),
  type: text("type", { length: 20 }).notNull().$type<"dds" | "accrual" | "obligation">(),
  method: text("method", { length: 10 }).notNull().$type<"cash" | "accrual">(),
  status: text("status", { length: 10 }).notNull().$type<"plan" | "fact">(),
  counterpartyId: integer("counterparty_id", { mode: "number" }).references(() => counterparties.id),
  articleId: integer("article_id", { mode: "number" }).notNull().references(() => articles.id),
  planIncome: real("plan_income").default(0),
  planExpense: real("plan_expense").default(0),
  factIncome: real("fact_income").default(0),
  factExpense: real("fact_expense").default(0),
  projectStage: text("project_stage", { length: 100 }),
  comment: text("comment"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  createdBy: integer("created_by", { mode: "number" }).notNull().references(() => users.id),
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Counterparty = typeof counterparties.$inferSelect;
export type NewCounterparty = typeof counterparties.$inferInsert;
export type Operation = typeof operations.$inferSelect;
export type NewOperation = typeof operations.$inferInsert;
