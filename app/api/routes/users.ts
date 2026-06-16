import { z } from "zod";
import { createRouter, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const usersRouter = createRouter({
  list: adminQuery.query(async () => {
    const db = getDb();
    return db.query.users.findMany({
      columns: { passwordHash: false },
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });
  }),

  create: adminQuery
    .input(
      z.object({
        login: z.string().min(1).max(50),
        password: z.string().min(4).max(50),
        name: z.string().min(1).max(100),
        role: z.enum(["operator", "admin"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const passwordHash = await bcrypt.hash(input.password, 10);
      const result = await db
        .insert(users)
        .values({
          login: input.login,
          passwordHash,
          name: input.name,
          role: input.role,
        })
        .returning();
      return result[0];
    }),

  update: adminQuery
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        role: z.enum(["operator", "admin"]).optional(),
        isActive: z.boolean().optional(),
        password: z.string().min(4).max(50).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.role !== undefined) updateData.role = data.role;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 10);

      const result = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();
      return result[0];
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(users).where(eq(users.id, input.id));
      return { success: true };
    }),
});
