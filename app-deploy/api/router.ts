import { createRouter, publicQuery } from "./middleware";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { projectsRouter } from "./routes/projects";
import { articlesRouter } from "./routes/articles";
import { counterpartiesRouter } from "./routes/counterparties";
import { operationsRouter } from "./routes/operations";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  users: usersRouter,
  projects: projectsRouter,
  articles: articlesRouter,
  counterparties: counterpartiesRouter,
  operations: operationsRouter,
});

export type AppRouter = typeof appRouter;
