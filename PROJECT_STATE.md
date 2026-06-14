# Vesper Project State

This file records the current project state for the stable `main` branch.

## Current Stable Branch

`main` is the stable MVP branch.

Latest local `main` commit:

```text
f6c112d feat: polish bar detail UX and enrich AMap objective metadata
```

Recent context:

```text
f6c112d feat: polish bar detail UX and enrich AMap objective metadata
c84857b update project state
aab91fc polish bar detail experience
76fe493 add search filters and polish map filter ux
bce3921 add search filters and polish map filter ux
70a27fe polish home nearby and map experience
eecaaf5 polish bar display and map states
fda6212 polish profile content tabs
9a32294 document development workflow and project state
6eca862 merge review system into amap poi branch
0c6e886 add amap nearby poi search
3143291 add review image upload
```

## Current Architecture

Backend:

- Spring Boot API under `Vesper-backend`.
- Java 17, Spring Security JWT auth, MyBatis-Plus, MySQL.
- Spring Boot DevTools provides automatic restart for local Maven/IDE development and is disabled for packaged production runs.
- Controllers/services/mappers follow the existing `Result<T>` response style.
- Uploaded review images are stored locally under `Vesper-backend/uploads` and served via `/uploads/**`.
- AMap nearby POI integration is implemented through backend POI endpoints.

Frontend:

- Expo / React Native app under `Vesper-frontend`.
- Expo Router screen structure under `app/`.
- Shared UI and map components under `components/`.
- API adapters under `lib/`.
- Zustand stores under `stores/` for auth, favorites, visited, and reviews.
- Home and Map use a nearby cache layer for AMap/local bar data.
- Bar detail has productized hero, metadata, about, photos, reviews, review modal, favorite, visited, and place-map interactions.
- `app/place-map.tsx` is an independent route for a single bar map view; it does not use or alter the bottom Tab Map behavior.

## Completed MVP Features

- Auth:
  - register
  - login
  - me/current user
- Bars:
  - list
  - detail
  - product-polished detail UI
  - independent single-place map route from detail address
- Favorites:
  - favorite bar
  - unfavorite bar
  - profile favorites
  - saved state reflected in home/detail/map surfaces
- Visited:
  - mark visited
  - remove visited
  - profile visited list
  - visited state reflected in home/detail/map surfaces
- Reviews:
  - create review
  - detail review list
  - profile My Reviews
  - delete own review
  - rating validation
  - keyboard dismiss behavior in review modal
  - star-based rating display in home/detail/review cards
- Review image upload:
  - local image upload endpoint
  - review image URLs stored in `review_images`
  - detail review list displays uploaded images
  - detail hero can include review images in the carousel
  - detail photo gallery displays review images
  - profile reviews display images
  - uploaded files stored under `Vesper-backend/uploads`
- Home:
  - nearby bars from AMap/local cache
  - search
  - category filters
  - star rating polish
  - visited/saved visual states
- Map:
  - nearby bars map
  - search/filter sheet
  - marker preview card
  - saved/visited marker states
  - POI import to local bar before opening detail
  - bottom Tab Map remains a nearby discovery map only
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
- `DELETE /api/favorites/{barId}`
- `GET /api/visited`
- `POST /api/visited/{barId}`
- `DELETE /api/visited/{barId}`
- `POST /api/reviews`
- `GET /api/bars/{barId}/reviews`
- `GET /api/users/me/reviews`
- `DELETE /api/reviews/{id}`
- `POST /api/upload/image`
- `GET /api/pois/nearby-bars?lat=xx&lng=xx`
- `POST /api/pois/import`

## Current AMap Integration State

- Backend calls AMap Place Around API (`/v3/place/around`) through `AmapPoiServiceImpl`.
- `AMAP_API_KEY` is read from configuration/environment and must not be committed.
- Frontend calls backend `/pois/nearby-bars` through `lib/pois.ts`.
- Nearby results are cached in `lib/nearbyCache.ts`.
- Home and the Tab Map consume the nearby cache.
- AMap POIs use `amap:` IDs until imported.
- `POST /api/pois/import` creates or reuses a local bar by `external_id`.
- Imported local bars participate in favorites, visited, reviews, ratings, and review images.
- AMap POI detail/photos API is not integrated yet.

## Current Limitations

- AMap POI `coverImage` may be empty.
- AMap detail/photos are not fetched yet.
- Home/detail images may show placeholders if external image links load slowly or are unavailable.
- User-created bar submission is not implemented.
- Publish tab is still not wired to backend bar selection/review creation.
- Social/chat features are still not backed by real backend APIs.
- Local image storage is MVP-only; cloud object storage is not integrated yet.
- Single-place map is a frontend route focused on an existing local bar; it does not fetch richer POI metadata.
- `Vesper-frontend/components/VesperMap.native.tsx` may appear modified in Git with no content diff due to local line-ending/stat state.

## Next Roadmap

1. AMap POI detail/photos enrichment for imported or previewed places.
2. User-created bar submission flow.
3. Publish tab backend integration.
4. Cloud object storage for review images.
5. Richer bar metadata: phone, opening hours, price/person, tags, and description when backed by real data.
6. Social/chat backend integration.
7. Continued UI polish and visual QA across iOS/Android/Web.

## Development Guardrails

- Do not start services unless explicitly requested.
- Do not commit or push unless explicitly requested.
- Do not commit real secrets.
- Keep `application-local.yml`, `.env`, `.env.local`, and uploaded files out of git.
- Preserve existing auth, favorites, visited, reviews, review image upload, map, and POI import behavior unless the task explicitly changes them.
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

For documentation-only changes, at minimum run:

```bash
git diff --check
git status
```
