import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const authRouter = createRouter({
  login: publicQuery
    .input(
      z.object({
        login: z.string().min(1),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const user = await db.query.users.findFirst({
        where: eq(users.login, input.login),
      });

      if (!user || !user.isActive) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Неверный логин или пароль",
        });
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Неверный логин или пароль",
        });
      }

      // Simple token: user_id:timestamp
      const token = `${user.id}:${Date.now()}`;

      return {
        token,
        user: {
          id: user.id,
          login: user.login,
          name: user.name,
          role: user.role,
        },
      };
    }),

  me: publicQuery.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    return ctx.user;
  }),
});
