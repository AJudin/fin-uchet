# fin-uchet MVP

Система управленческого учёта для строительной компании.

## Стек

- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Hono + tRPC + Drizzle ORM
- **Database:** SQLite (better-sqlite3)
- **Runtime:** Node.js

## Структура

- `app/` — исходники проекта
- `app-deploy/` — готовая к деплою версия (собранный `dist/` и демо-БД)
- `DEPLOY.md` — инструкция по деплою на сервер
- `nginx-finance.conf` — пример конфигурации nginx
- `plan_finance_system.md` — техническое задание

## Локальный запуск

```bash
cd app-deploy
npm install
npm run build
PORT=3001 NODE_ENV=production node dist/boot.js
```

Приложение будет доступно по адресу `http://localhost:3001`.

Демо-данные:
- `admin` / `admin` — администратор
- `operator` / `operator` — оператор

## Деплой

См. [DEPLOY.md](./DEPLOY.md).
