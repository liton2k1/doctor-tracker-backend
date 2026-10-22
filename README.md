# Doctor Tracker — Backend API

## Description

Doctor Tracker is a secure administrative platform for managing doctors and their patients. This repository is the standalone REST API (Node.js, Express 5, TypeScript, MongoDB) behind it. It provides JWT-protected CRUD with server-side search, filtering and pagination, per-doctor patient management, and aggregated analytics (totals, patients per doctor, date-based trends and distributions) backed by index-optimized queries to feed a Next.js dashboard.

It is built on the standard `src/app/{modules,helpers,middlewares,config,interfaces,utils,routes}` boilerplate. Every feature is a module with `interface / model / validation / service / controller / route`.

## Setup Guide

Prerequisites: Node.js >= 18.18 and a MongoDB instance (local or Atlas).

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env        # then edit DB_URL and the JWT secrets

# 3. (Optional) demo data for the charts: 14 doctors + 160 patients (WIPES doctors & patients)
npm run seed:sample

# 4. Run
npm run dev                 # http://localhost:5000  (API under /api/v1)

# Production
npm run build && npm start
```

The admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD` is created automatically on first start.

| Variable                                   | Purpose                                       |
| ------------------------------------------ | --------------------------------------------- |
| `PORT`, `NODE_ENV`                         | server port / `development` or `production`   |
| `DB_URL`                                   | MongoDB connection string                     |
| `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRE`   | access token secret and lifetime (e.g. `30d`) |
| `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRE` | refresh token secret and lifetime             |
| `BCRYPT_SALT_ROUND`                        | bcrypt cost (10–12)                           |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`            | seeded admin credentials                      |
| `FRONTEND_URL`                             | allowed CORS origin (credentials enabled)     |

## System Architecture

```
src/
├── server.ts                  DB connect, admin seed, graceful shutdown
├── app.ts                     helmet, CORS, parsers, routes, notFound, error handler
├── seed.ts                    `npm run seed:sample` entry
└── app/
    ├── config/                envVars, multer
    ├── helpers/               AppError + error simplifiers (zod, cast, duplicate, validation)
    ├── interfaces/            shared types (error, query/meta), Express Request augmentation
    ├── middlewares/           checkAuth, validateRequest, validateQuery, globalErrorHandler, notFound
    ├── utils/                 catchAsync, sendResponse, jwt, cookies, pagination, query & zod helpers, seeds
    ├── routes/                module router registry (/user /auth /doctors /patients /dashboard)
    └── modules/
        ├── user/              register, update own profile
        ├── auth/              login, logout, me
        ├── doctor/            CRUD + filters + nested patient routes
        ├── patient/           list/edit/delete/reassign + filters
        └── dashboard/         overview, patients-per-doctor, timeline, distributions
```

Request flow: `route → checkAuth → validateRequest / validateQuery (Zod) → controller (catchAsync) → service → model → sendResponse`; every failure ends in `globalErrorHandler`.

Response envelope: `{ statusCode, success, message, meta?, data }`, where list endpoints return `meta: { page, limit, total, totalPage }`. Errors: `{ success: false, message, errorSources: [{ path, message }] }`.

## API Reference (`/api/v1`, all non-auth routes are `ADMIN` only)

| Method               | Endpoint                                          | Notes                                                                                                       |
| -------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| POST                 | `/user/register`                                  | public; creates a plain `USER`; optional profile image                                                      |
| PATCH                | `/user/me`                                        | any logged-in user: edit own name, phone, address and profile image (no password/role/email changes)        |
| POST                 | `/auth/login`                                     | rate-limited; sets httpOnly cookies and returns tokens                                                      |
| POST                 | `/auth/logout`                                    | clears cookies                                                                                              |
| GET                  | `/auth/me`                                        | current user (any role)                                                                                     |
| GET                  | `/doctors`                                        | `page, limit, search, specialization, hospital, from, to, sortBy(createdAt\|name\|patientCount), sortOrder` |
| POST                 | `/doctors`                                        | name, specialization, hospital, phone, email, optional profile image                                        |
| GET / PATCH / DELETE | `/doctors/:id`                                    | delete returns 409 while the doctor has patients                                                            |
| GET                  | `/doctors/meta/filters`                           | distinct specializations and hospitals                                                                      |
| GET                  | `/doctors/:id/patients`                           | patient filters (no `doctorId`)                                                                             |
| POST                 | `/doctors/:id/patients`                           | add a patient under the doctor (optional profile image)                                                     |
| DELETE               | `/doctors/:id/patients/:patientId`                | remove from the doctor's list                                                                               |
| GET                  | `/patients`                                       | `page, limit, search, condition, gender, doctorId, from, to, sortBy(createdAt\|name\|age), sortOrder`       |
| GET / PATCH / DELETE | `/patients/:id`                                   | PATCH accepts `doctorId` to reassign                                                                        |
| GET                  | `/patients/meta/filters`                          | distinct conditions                                                                                         |
| GET                  | `/dashboard/overview`                             | totals, average per doctor, last-30-day and today counts                                                    |
| GET                  | `/dashboard/patients-per-doctor?limit=`           | top doctors by patient load                                                                                 |
| GET                  | `/dashboard/timeline?interval=day\|month&from&to` | zero-filled doctors/patients series                                                                         |
| GET                  | `/dashboard/distributions?limit=`                 | by condition / gender / specialization                                                                      |

Import `doctor-tracker.postman_collection.json` to try everything (Login stores the token automatically).

### Profile images (admin/user, doctor, patient)

Every user, doctor and patient has an optional `profile` field holding the public URL of their photo (`<BACKEND_URL>/uploads/<file>`). Create and edit endpoints accept either JSON (no image) or `multipart/form-data` with the text fields plus an optional `file` image:

- Send `file` to set or replace the photo; the previous file is deleted once the update succeeds.
- Send `removeProfile=true` to clear it. A request containing only a `file` or only `removeProfile` is a valid edit.
- Only JPG, PNG and WebP up to 2MB are accepted. Three checks run: extension, mimetype and the real file signature (magic bytes), so a text file renamed to `.png`, SVG, or a double-extension file is rejected.
- Filenames are generated server-side (`<timestamp>-<random>.<ext>`), never taken from the client.
- If a request fails after its image was stored (validation error, duplicate email, unknown id...), the image is removed, so failed requests leave no orphan files. Deleting a doctor, patient or replacing an image also deletes the old file.
- `BACKEND_URL` must be the public address of this API, because it is embedded in the stored URLs.

## Technical Decisions

### 1. Index design that matches the query shape (no in-memory sorts)

Every list is sorted by `(field, _id)` so pagination is stable when values tie. Because MongoDB cannot serve `(createdAt, _id)` order from an index on `createdAt` alone, a plain `createdAt` index still forces a blocking in-memory `SORT` (and, in my first draft, a collection scan). The fix is to make `_id` the last key of every index, e.g. `{ doctor: 1, createdAt: -1, _id: -1 }`; one index then serves both `asc` and `desc` because it can be walked backwards. Verified with `explain()`: every list query (by doctor, by condition, by gender, date ranges, sort by name/age/patientCount) is `LIMIT > FETCH > IXSCAN` with no `SORT` or `COLLSCAN` stage. Counts and rows are fetched in parallel and rows use `.lean()`.

"Patients per doctor" is the dashboard's hottest chart, so each doctor keeps a denormalized `patientCount`, maintained with `$inc` on create/delete/reassign. The chart reads the top N through the `{ patientCount: -1, _id: -1 }` index instead of running `$group` + `$lookup` over all patients. Trade-off: writes touch two documents and, without a transaction, a crash between them can drift the counter (the seed script rebuilds counters from real data; wrap the two writes in a transaction if you run a replica set and need strict consistency).

### 2. Validate at the boundary with Zod, fail through one error pipeline

Bodies and query strings are parsed by Zod (`validateRequest`, `validateQuery`) before reaching controllers, so services only ever see typed, coerced, trusted data. Query values must be plain strings/numbers, which also blocks NoSQL operator injection (`?search[$ne]=`). Search input is regex-escaped. All failures (Zod, Mongoose cast/validation/duplicate, JWT, `AppError`) converge in `globalErrorHandler`, which returns one consistent shape and hides stack traces and internal messages outside development.

## Changes made to the boilerplate (bugs fixed)

| File                             | Problem                                                                                                                                                                                | Fix                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `utils/catchAsync.ts`            | forwarded errors **only in development**; in production a failing request never got a response                                                                                         | always `next(err)`                                          |
| `auth.service.ts`                | filtered on `isVerified: true`, a field the User model doesn't have, so login always failed; separate "email does not exist" / "incorrect password" messages leaked which emails exist | removed the filter; one generic 401 message                 |
| `middlewares/checkAuth.ts`       | read only the raw `Authorization` header (ignored the cookie the login sets); a bad token surfaced as a 500; missing token returned 403                                                | cookie or `Bearer` header; JWT errors become 401            |
| `config/index.ts`                | `JWT_REFRESH_EXPIRE` read the misspelled `JWT_REFRESH_EXPIRED` (always `undefined`)                                                                                                    | fixed                                                       |
| `utils/jwt.ts`                   | ignored the `expiresIn` argument and always signed `"30d"`                                                                                                                             | uses the argument                                           |
| `config/multer.ts`               | stored files under the client-supplied `originalname` (overwrites, path tricks), no type or size limits                                                                                | unique generated filename, image types only, 2MB cap        |
| `user.validation.ts`             | `password` optional on register, but the service hashes it unconditionally (crash)                                                                                                     | required; message says 8 chars                              |
| `utils/seedAdmin.ts`             | `console.log(admin)` printed the password hash                                                                                                                                         | logs the email only                                         |
| `app.ts`                         | duplicated `cookieParser`/`json`/`urlencoded`; hardcoded CORS origins; no security headers                                                                                             | single pass, `FRONTEND_URL` origin, `helmet`                |
| `middlewares/validateRequest.ts` | rejected refined schemas (`.refine`)                                                                                                                                                   | accepts any Zod schema                                      |
| `utils/setCookie.ts`             | `secure: false` always, no logout helper                                                                                                                                               | `secure` in production, `SameSite=Lax`, shared clear helper |

`checkAuth` and the user module keep their public names, so other projects can adopt these fixes by copying the files.

## Security Notes

- Passwords hashed with bcryptjs; login is rate-limited (10 per 15 min in production); cookies are `httpOnly`, `Secure` in production, `SameSite=Lax`.
- Role-based access: all doctor/patient/dashboard routes require `ADMIN`; a registered `USER` gets 403.
- Stateless JWT: a deleted or demoted user keeps access until the token expires. Use a short `JWT_ACCESS_EXPIRE` (and implement the refresh flow) if you need fast revocation.
- **`.env.example` in the original project contained what looked like a live MongoDB Atlas connection string. Treat that password as exposed and rotate it.** This version's `.env.example` uses placeholders.

## Known Limitations

- Search uses an escaped, case-insensitive "contains" regex. It scans the filtered set (fine for tens of thousands of records) but cannot use index bounds; move to a text index or Atlas Search for very large data.
- `skip/limit` pagination slows down on very deep pages; switch to cursor pagination if that matters.
- Mongoose builds indexes automatically on startup; for large production collections run index builds deliberately (`Model.syncIndexes()`) during deployment.
- There is no refresh-token endpoint yet (tokens are issued but not rotated).
- Images are stored on the local disk (`uploads/`). On hosts with ephemeral disks or several instances, switch the multer storage to S3/Cloudinary; the rest of the code only deals with the stored URL.
- Uploaded images are public (anyone with the URL can view them). Do not use this for sensitive documents.

## Verification Performed

Typechecked with `tsc --noEmit` and exercised against a real MongoDB 8:

- 75 end-to-end requests: auth and RBAC, every CRUD route, search/filter/sort/pagination, patient reassignment and counter integrity, dashboard aggregates, and validation/error paths.
- 48 upload tests: accepted and rejected files (fake images, `.txt`, SVG, double extensions, oversized), orphan-file cleanup after failed requests, replace/remove/delete flows for doctors, patients and users, public serving, and static-route traversal attempts.
- Production-mode checks (no hung requests, no stack leakage, `Secure` cookies) and `explain()` plans for the list queries.

## Visual Evidence

Screenshots (desktop and mobile) belong to the frontend repository README.
