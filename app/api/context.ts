import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user: {
    id: number;
    login: string;
    role: "operator" | "admin";
    name: string;
  } | null;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const token = opts.req.headers.get("authorization")?.replace("Bearer ", "");
  let user = null;

  if (token) {
    try {
      // Simple token: user_id:timestamp format
      const [userIdStr] = token.split(":");
      const userId = parseInt(userIdStr, 10);
      if (!isNaN(userId)) {
        const db = getDb();
        const found = await db.query.users.findFirst({
          where: eq(users.id, userId),
        });
        if (found && found.isActive) {
          user = {
            id: found.id,
            login: found.login,
            role: found.role,
            name: found.name,
          };
        }
      }
    } catch {
      // Invalid token
    }
  }

  return { req: opts.req, resHeaders: opts.resHeaders, user };
}
