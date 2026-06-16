import { relations } from "drizzle-orm";
import { users, projects, articles, counterparties, operations } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  operations: many(operations),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  operations: many(operations),
}));

export const articlesRelations = relations(articles, ({ many }) => ({
  operations: many(operations),
}));

export const counterpartiesRelations = relations(counterparties, ({ many }) => ({
  operations: many(operations),
}));

export const operationsRelations = relations(operations, ({ one }) => ({
  project: one(projects, {
    fields: [operations.projectId],
    references: [projects.id],
  }),
  article: one(articles, {
    fields: [operations.articleId],
    references: [articles.id],
  }),
  counterparty: one(counterparties, {
    fields: [operations.counterpartyId],
    references: [counterparties.id],
  }),
  creator: one(users, {
    fields: [operations.createdBy],
    references: [users.id],
  }),
}));
