# Vesper Project State

This file records the current stable MVP state after merging the AMap POI work into `main`.

## Current Stable Branch

`main` is the stable MVP branch.

`main` includes:

```text
f0f00ed add review system
3143291 add review image upload
0c6e886 add amap nearby poi search
6eca862 merge review system into amap poi branch
```

## Completed MVP Features

- Auth:
  - register
  - login
  - me/current user
- Bars:
  - list
  - detail
- Favorites:
  - favorite bar
  - unfavorite bar
  - profile favorites
- Visited:
  - mark visited
  - profile visited list
- Reviews:
  - create review
  - detail review list
  - profile My Reviews
  - delete own review
  - rating validation
  - keyboard dismiss behavior in review modal
- Review image upload:
  - local image upload endpoint
  - review image URLs stored in `review_images`
  - review list displays images
  - profile reviews display images
  - uploaded files stored under `Vesper-backend/uploads`
- AMap POI:
  - nearby real bar POI search
  - category filtering for bar-like venues
  - map markers for real nearby POIs
  - POI preview card
- POI import:
  - AMap POI imports into local `bars`
  - import is idempotent through `bars.external_id`
  - imported bars can open real detail pages
  - imported bars support favorite, visited, review, and review image upload

## Key Backend APIs

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/bars`
- `GET /api/bars/{id}`
- `GET /api/favorites`
- `POST /api/favorites/{barId}`
- `GET /api/visited`
- `POST /api/visited/{barId}`
- `POST /api/reviews`
- `GET /api/bars/{barId}/reviews`
- `GET /api/users/me/reviews`
- `DELETE /api/reviews/{id}`
- `POST /api/upload/image`
- `GET /api/pois/nearby-bars?lat=xx&lng=xx`
- `POST /api/pois/import`

## Current Limitations

- AMap POI `coverImage` may be empty.
- Home images may show gray placeholders if external image links load slowly.
- UI polish is intentionally not complete.
- User-created bar submission is not implemented.
- Search and advanced filtering are not implemented.
- Social/chat features are still not backed by real backend APIs.
- Local image storage is MVP-only; cloud object storage is not integrated yet.

## Suggested Next Steps

1. UI polish.
2. User-created bar submission.
3. Search and filtering.
4. POI image and cover optimization.
5. Social features.

## Development Guardrails

- Do not start services unless explicitly requested.
- Do not commit or push unless explicitly requested.
- Do not commit real secrets.
- Keep `application-local.yml`, `.env`, `.env.local`, and uploaded files out of git.
- Run validation after code changes:

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
