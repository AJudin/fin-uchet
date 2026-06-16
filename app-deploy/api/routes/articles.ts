import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { articles } from "@db/schema";
import { eq } from "drizzle-orm";

export const articlesRouter = createRouter({
  list: authedQuery.query(async () => {
    const db = getDb();
    return db.query.articles.findMany({
      orderBy: (articles, { asc }) => [asc(articles.name)],
    });
  }),

  byType: authedQuery
    .input(z.object({ type: z.enum(["dds", "accrual", "obligation"]) }))
    .query(async ({ input }) => {
      const db = getDb();
      return db.query.articles.findMany({
        where: eq(articles.type, input.type),
        orderBy: (articles, { asc }) => [asc(articles.name)],
      });
    }),

  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(100),
        category: z.enum(["income", "expense"]),
        type: z.enum(["dds", "accrual", "obligation"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(articles).values(input).returning();
      return result[0];
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        category: z.enum(["income", "expense"]).optional(),
        type: z.enum(["dds", "accrual", "obligation"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const result = await db
        .update(articles)
        .set(data)
        .where(eq(articles.id, id))
        .returning();
      return result[0];
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(articles).where(eq(articles.id, input.id));
      return { success: true };
    }),
});
