import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { counterparties } from "@db/schema";
import { eq } from "drizzle-orm";

export const counterpartiesRouter = createRouter({
  list: authedQuery.query(async () => {
    const db = getDb();
    return db.query.counterparties.findMany({
      orderBy: (counterparties, { asc }) => [asc(counterparties.name)],
    });
  }),

  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(100),
        type: z.enum(["client", "supplier", "contractor", "employee"]),
        inn: z.string().max(12).optional().nullable(),
        contact: z.string().max(255).optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db.insert(counterparties).values(input).returning();
      return result[0];
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        type: z.enum(["client", "supplier", "contractor", "employee"]).optional(),
        inn: z.string().max(12).optional().nullable(),
        contact: z.string().max(255).optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const result = await db
        .update(counterparties)
        .set(data)
        .where(eq(counterparties.id, id))
        .returning();
      return result[0];
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(counterparties).where(eq(counterparties.id, input.id));
      return { success: true };
    }),
});
