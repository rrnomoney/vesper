# Vesper Development Guide

This guide is for local development. It intentionally uses environment variable names and placeholders only. Do not write real passwords, JWT secrets, or AMap keys into tracked files.

## Prerequisites

- Java 17
- Maven
- Node.js and npm
- MySQL
- Expo CLI through `npx expo`

## Database

Create a local MySQL database named `vesper`.

Apply the schema from:

```text
Vesper-backend/src/main/resources/db/schema.sql
```

The backend expects MySQL connection settings through environment variables or an ignored local config file.

## Local Configuration

Use the `local` Spring profile for local development:

```bash
SPRING_PROFILES_ACTIVE=local
```

Recommended local-only variables:

```bash
MYSQL_URL=jdbc:mysql://localhost:3306/vesper?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true
MYSQL_USERNAME=root
MYSQL_PASSWORD=<your-local-mysql-password>
JWT_SECRET=<your-long-random-local-secret>
JWT_EXPIRATION=86400000
AMAP_API_KEY=<your-amap-web-service-key>
```

Do not commit these values. Put them in your shell environment, an ignored `.env`, or ignored `Vesper-backend/src/main/resources/application-local.yml`.

## Backend Start

From the backend directory:

```bash
cd Vesper-backend
mvn spring-boot:run
```

The API uses:

```text
http://localhost:8080/api
```

Uploaded review images are served from:

```text
http://localhost:8080/uploads/<filename>
```

## Frontend Start

From the frontend directory:

```bash
cd Vesper-frontend
npm install
npx expo start
```

Useful Expo commands:

```bash
npm run ios
npm run android
npm run web
```

The mobile app uses the existing frontend API client configuration. When testing on a physical phone, make sure the backend base URL points to a host the phone can reach, such as the computer's LAN IP.

## Validation Commands

Backend:

```bash
cd Vesper-backend
mvn -DskipTests package
```

Frontend:

```bash
cd Vesper-frontend
npx tsc --noEmit
```

Git whitespace/status:

```bash
git diff --check
git status
```

## Common Issues

### Port 8080 Is Already In Use

Stop the process using port 8080, or set a local-only `SERVER_PORT` value. Do not commit local port changes.

### `MYSQL_PASSWORD` Is Empty

Set `MYSQL_PASSWORD` in your environment or ignored local config. The tracked `application.yml` must not contain a real password.

### `JWT_SECRET` Is Empty

Set `JWT_SECRET` to a long random local value before using authenticated APIs. Do not commit it.

### `AMAP_API_KEY` Is Empty

AMap nearby POI search needs `AMAP_API_KEY`. The tracked config uses the placeholder `${AMAP_API_KEY:}` only.

### Uploaded Images Return 404

Check that files exist under:

```text
Vesper-backend/uploads
```

Then confirm Spring static resource mapping serves:

```text
/uploads/**
```

The expected browser URL is:

```text
http://localhost:8080/uploads/<filename>
```

If the backend is accessed from a phone, replace `localhost` with the computer's LAN IP.

### Expo Cache Looks Stale

Restart Expo with a cleared cache:

```bash
npx expo start -c
```

AsyncStorage persists login state across Expo restarts. Seeing the previous user logged in after scanning again can be normal.

## Files That Must Stay Local

- `Vesper-backend/src/main/resources/application-local.yml`
- `.env`
- `.env.local`
- `.env.*`
- `Vesper-backend/uploads/`
