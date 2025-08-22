# Apply4Me — PostgreSQL Backend (Prisma + Express)
Matches your original frontend contract:
- `POST /api/submit` for form + resume upload
- `GET /api/health` for health checks

## Local (Windows 11)
1) PostgreSQL user `alunix`, DB `apply4me`, pass `bac20yeswecan`.
2) In this folder:
   ```bash
   npm i
   npx prisma generate
   npx prisma migrate dev --name init
   npm run dev
   ```
