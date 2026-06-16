# Деплой на сервер 5.44.40.160

## Что уже сделано
- Файлы проекта скопированы в `/opt/finance-app/`
- Осталось: установить зависимости, собрать, запустить, настроить nginx

## Если SSH не подключается (fail2ban)

Если вы не можете подключиться по SSH с текущего IP, fail2ban заблокировал его.
**Решение:** Подключитесь к серверу с другого IP (например, через VPN/мобильный интернет) и выполните:

```bash
# Разблокировать IP (замените YOUR_IP на ваш реальный IP)
fail2ban-client set sshd unbanip YOUR_IP

# Или отключить fail2ban временно
systemctl stop fail2ban
```

## Шаги деплоя (выполнить на сервере)

### 1. Подключиться к серверу
```bash
ssh root@5.44.40.160
# пароль: 69@i&qHJg0q9
```

### 2. Запустить деплой-скрипт
```bash
cd /opt/finance-app
chmod +x deploy.sh
./deploy.sh
```

Этот скрипт:
- Установит npm-зависимости
- Соберёт проект для production
- Создаст SQLite базу данных
- Заполнит демо-данными
- Запустит приложение через PM2 на порту **3001**

### 3. Настроить nginx

Создать конфиг для нового проекта:

```bash
cat > /etc/nginx/sites-available/finance << 'EOF'
server {
    listen 80;
    server_name 5.44.40.160;

    # Existing app (bany-app) on port 8080 — root path
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Finance app on port 3001 — under /finance path
    location /finance/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # tRPC API for finance app
    location /finance/api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Активировать конфиг
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/finance /etc/nginx/sites-enabled/

# Проверить и перезапустить nginx
nginx -t && systemctl restart nginx
```

### 4. Проверка

- Старый проект: `http://5.44.40.160/` — должен работать как раньше
- Новый проект: `http://5.44.40.160/finance` — система управленческого учёта

### 5. Демо-данные для входа

| Логин | Пароль | Роль |
|---|---|---|
| admin | admin | Администратор (видит всё) |
| operator | operator | Оператор (только ввод данных) |

## Управление процессами

```bash
# Статус приложений
pm2 status

# Логи finance app
pm2 logs finance-app

# Перезапуск
pm2 restart finance-app

# Остановка
pm2 stop finance-app
```

## Порты

| Приложение | Порт | Путь через nginx |
|---|---|---|
| bany-app (существующий) | 8080 | `/` |
| finance-app (новый) | 3001 | `/finance/` |

Оба приложения работают независимо через nginx reverse proxy.
