# WorkTrackr

WorkTrackr is a modern time-tracking app for distributed teams built with Next.js 15, TypeScript, Tailwind CSS, and Firebase. Employees log their hours with rich context, while administrators review, approve, or reject submissions in bulk and export CSVs for payroll or auditing.

## Features

- **Authentication**: Firebase Email/Password + Google sign-in, exchanged for secure session cookies via Next.js API routes.
- **Employee workspace**
  - Mobile-first form that stores entry/exit times in UTC with optional notes
  - Edit or delete submissions while they remain `pending`
  - Responsive list showing approval status, reviewer notes, and timestamps
- **Admin dashboard**
  - Filter submissions by status, employee, and date range
  - Bulk approve/reject with an optional review note
  - One-click CSV export that honours active filters
- **Server-side validation**: API routes enforce duration checks, block future dates, and normalise payloads before writing to Firestore.

## Tech Stack

- **Framework**: Next.js 15 (App Router, React Server Components, TypeScript)
- **UI**: Tailwind CSS 4, custom design tokens, modern accessible components
- **Forms & State**: React Hook Form, lightweight client components (AuthGate, RoleGate)
- **Date utilities**: date-fns, native `Intl` formatting helpers
- **Backend**: Firebase Authentication + Cloud Firestore (Admin SDK inside API routes)

## Project Structure

```
app/
  (auth)/sign-in         # Public sign-in flow
  (protected)/layout     # Authenticated shell + navigation
  (protected)/dashboard  # Employee dashboard
  (protected)/admin      # Admin dashboard
  (protected)/profile    # Profile details & sign out
  api/
    auth/session         # Session cookie management
    timeEntries          # Employee CRUD endpoints
    admin/{approve,export}
components/
  auth/                  # AuthGate, RoleGate, sign-in form
  admin/                 # Admin dashboard widgets (table, CSV button)
  dashboard/             # Employee widgets
  layout/                # Top navigation, sign-out
  ui/                    # Buttons, inputs, alerts, dialogs, toasts, spinner
lib/
  auth.ts                # Server auth helpers & guards
  firebase.ts            # Firebase client SDK initialiser
  firebaseAdmin.ts       # Admin SDK initialiser
  env.ts, constants.ts   # Config helpers
  validation.ts          # Zod schemas for payloads and queries
services/
  timeEntries.ts         # Firestore CRUD helpers for time entries
  users.ts               # Firestore helpers for user profiles
utils/
  date.ts                # UTC/local conversions, formatting
  csv.ts                 # CSV export helper
__tests__/               # Jest component & API route tests
tests/
  security/              # Firestore security rule tests (emulator)
  e2e/                   # Playwright end-to-end scenarios
```

## Firestore Data Model

```
users (collection)
  {uid}
    displayName: string
    email: string
    role: "employee" | "admin"
    createdAt: Timestamp

timeEntries (collection)
  {entryId}
    userId: string             // reference to users/{uid}
    date: "YYYY-MM-DD"
    startUtc: string           // ISO 8601
    endUtc: string             // ISO 8601
    totalMinutes: number
    status: "pending" | "approved" | "rejected"
    note?: string
    reviewNote?: string
    submittedAt: Timestamp
    approvedBy?: string        // uid of reviewer
    approvedAt?: Timestamp
```

### Required Indexes

Create these composite indexes in Firestore:

- `timeEntries`: `status ASC`, `date DESC`
- `timeEntries`: `userId ASC`, `date DESC`

## Firestore Security Rules (baseline)

The repository includes `firestore.rules` mirroring the requested behaviour:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    match /users/{uid} {
      allow read: if isSignedIn() && request.auth.uid == uid;
      allow write: if false;
    }

    match /timeEntries/{id} {
      allow read: if isSignedIn() && (
        request.auth.token.role == 'admin' || resource.data.userId == request.auth.uid
      );

      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;

      allow update, delete: if isSignedIn()
        && resource.data.userId == request.auth.uid
        && resource.data.status == 'pending';
    }
  }
}
```

The Jest rules test (`npm run test:rules`) loads this file into the Firestore emulator to validate typical allow/deny scenarios.

## Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Start Firebase emulators** (Firestore + Auth) in one terminal:
   ```bash
   npm run emulators
   ```
   The default ports are 8080 (Firestore) and 9099 (Auth). `.env.example` contains matching overrides.
3. **Run Next.js locally** in a separate terminal:
   ```bash
   npm run dev
   ```
4. **Seed test users** via the emulator UI (http://localhost:4000) or Firebase CLI. Admins require `role = "admin"` in `users/{uid}`.

## Testing

| Command | Description |
| --- | --- |
| `npm test` | Run all Jest tests (unit + integration) |
| `npm run test:unit` | Component/UI tests with React Testing Library |
| `npm run test:integration` | API route tests with mocked Firebase Admin SDK |
| `npm run test:rules` | Firestore security rules against the emulator |
| `npm run test:e2e` | Playwright end-to-end flow (requires emulator + seeded accounts) |
| `npm run test:e2e:headed` | Run Playwright in headed mode |

> **Playwright setup**: install browsers once via `npx playwright install`. The e2e scenario is skipped by default; set `E2E_EMPLOYEE_EMAIL`, `E2E_EMPLOYEE_PASSWORD`, `E2E_ADMIN_EMAIL`, and `E2E_ADMIN_PASSWORD` to enable it.

## API Overview

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/auth/session` | `POST` | Exchange Firebase ID token for secure session cookie |
| `/api/auth/session` | `GET` | Fetch authenticated user profile |
| `/api/auth/session` | `DELETE` | Revoke session cookie & Firebase refresh tokens |
| `/api/timeEntries` | `GET` | List entries (scoped to requester unless admin filters) |
| `/api/timeEntries` | `POST` | Create a new entry (validates duration & future dates) |
| `/api/timeEntries/[id]` | `PATCH` | Update a pending entry (employee or admin override) |
| `/api/timeEntries/[id]` | `DELETE` | Delete a pending entry |
| `/api/admin/approve` | `POST` | Bulk approve/reject entries with optional review note |
| `/api/admin/export` | `GET` | Export filtered entries to CSV |

## Deployment

- Configure all environment variables (client + admin) in Vercel or your hosting provider. Remember to escape newlines in `FIREBASE_PRIVATE_KEY` as `\n`.
- Provide the same Firestore indexes in production.
- Deploy with `npm run build && npm run start` or via Vercel Git integration.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run emulators` | Run Firestore + Auth emulators |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run all Jest suites |
| `npm run test:e2e` | Execute Playwright tests |

## Notes

- The repository ships with `firestore.rules` and `firestore.indexes.json`; adjust them to match your production requirements.
- Ensure emulator accounts are created for automated tests (e2e + integration).

## License

Provided as-is for internal use. Review security posture, validation logic, and regulatory requirements before going live.
