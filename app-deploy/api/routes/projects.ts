import { z } from "zod";
import { createRouter, authedQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { projects } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const projectsRouter = createRouter({
  list: authedQuery.query(async () => {
    const db = getDb();
    return db.query.projects.findMany({
      orderBy: desc(projects.createdAt),
    });
  }),

  active: authedQuery.query(async () => {
    const db = getDb();
    return db.query.projects.findMany({
      where: eq(projects.status, "active"),
      orderBy: desc(projects.createdAt),
    });
  }),

  create: authedQuery
    .input(
      z.object({
        name: z.string().min(1).max(100),
        status: z.enum(["active", "completed", "paused"]).default("active"),
        startDate: z.date().optional().nullable(),
        endDate: z.date().optional().nullable(),
        budget: z.number().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const result = await db
        .insert(projects)
        .values({
          name: input.name,
          status: input.status,
          startDate: input.startDate,
          endDate: input.endDate,
          budget: input.budget,
        })
        .returning();
      return result[0];
    }),

  update: authedQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        status: z.enum(["active", "completed", "paused"]).optional(),
        startDate: z.date().optional().nullable(),
        endDate: z.date().optional().nullable(),
        budget: z.number().optional().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const result = await db
        .update(projects)
        .set(data)
        .where(eq(projects.id, id))
        .returning();
      return result[0];
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(projects).where(eq(projects.id, input.id));
      return { success: true };
    }),
});
