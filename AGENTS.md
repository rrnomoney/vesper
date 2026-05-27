# Vesper Agent Context

## Project Structure

```text
.
|-- Vesper-backend/          Spring Boot backend API
|   |-- src/main/java/       controllers, services, mappers, security, config
|   |-- src/main/resources/  application.yml and db/schema.sql
|   `-- uploads/            local uploaded images, ignored by git
|-- Vesper-frontend/         Expo / React Native app
|   |-- app/                 Expo Router screens
|   |-- components/          shared UI and map components
|   |-- lib/                 API clients and data adapters
|   |-- stores/              Zustand stores
|   `-- data/                local fallback/demo data
|-- .env.example             example environment variables only
|-- README.md
|-- README_DEV.md
`-- PROJECT_STATE.md
```

## Tech Stack

Backend:
- Java 17
- Spring Boot
- Spring Security with JWT
- MyBatis-Plus
- MySQL
- Springdoc / Swagger UI
- Local static upload directory for review images

Frontend:
- Expo SDK 54
- React Native 0.81
- React 19
- Expo Router
- React Navigation
- NativeWind
- Zustand
- AsyncStorage
- react-native-maps
- expo-location
- expo-image-picker

## Code Modification Rules

- Do not start frontend, backend, Expo, or any dev server unless the user explicitly asks.
- Do not commit or push unless the user explicitly asks.
- Do not add unrelated features or refactors while fixing a scoped task.
- Prefer existing project patterns for controllers, services, mappers, DTOs, VOs, stores, and API clients.
- Keep backend responses wrapped in the existing `Result<T>` style.
- Preserve existing auth, favorites, visited, reviews, review image upload, map, and POI import behavior unless the task is specifically about changing them.
- Use MyBatis-Plus style already present in the backend.
- Use the existing frontend API client and Zustand store patterns.
- Avoid `undefined.map` and `undefined.length`; normalize list responses with array guards.
- Use absolute paths or existing config placeholders for local upload paths; do not depend on fragile working-directory assumptions.

## Secrets And Local Files

- Never write real secrets into the repository.
- Never commit real MySQL passwords, JWT secrets, AMap keys, tokens, or session data.
- Use environment placeholders such as:
  - `MYSQL_PASSWORD`
  - `JWT_SECRET`
  - `AMAP_API_KEY`
- Do not modify or commit `application-local.yml`.
- Do not commit `.env` or `.env.local`.
- Do not commit uploaded image files.
- `application-local.yml`, `.env`, `.env.*`, and `uploads/` must stay ignored by git.

## Database Migration Rule

1. Whenever backend entity / VO / mapper / schema changes add new database fields or tables, Codex must check whether the local MySQL schema is already migrated.
2. If `schema.sql` is changed, do not assume the existing local database has been updated automatically.
3. Before running or testing backend features that depend on new columns/tables, Codex must:
   - read `application.yml` / `application-local.yml` to confirm the active database
   - inspect the target table schema
   - compare it with `schema.sql` / entity fields
   - if columns/tables are missing, ask for permission or provide `ALTER TABLE` SQL
4. For local development only, if the user explicitly approves, Codex may execute safe `ALTER TABLE` migration SQL.
5. Never modify `application-local.yml` or expose real database password.
6. Never drop tables or delete data unless the user explicitly asks.
7. After migration, verify with `DESCRIBE table_name`.
8. Include migration status in `READY FOR REVIEW` output.

Migration note, 2026-05-27:

The local MySQL `bars` table was migrated with:

- `phone`
- `business_hours`
- `formatted_address`
- `poi_type`
- `website`
- `amap_photo_urls`

## Validation After Changes

After code changes, run:

```bash
cd Vesper-backend
mvn -DskipTests package
```

```bash
cd Vesper-frontend
npx tsc --noEmit
```

```bash
git diff --check
git status
```

For documentation-only changes, at minimum run:

```bash
git diff --check
git status
```

## Git Expectations

- Check `git status` before starting work.
- Work on the branch requested by the user.
- If the working tree is dirty with unrelated user changes, do not revert them.
- If a merge or rebase has conflicts, stop and report unless the user asked you to resolve them.
- Do not push to `main` unless the user explicitly asks.
