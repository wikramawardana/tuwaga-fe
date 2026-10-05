# EO player verification

## Roles and entry points

| Role | Workspace |
| --- | --- |
| `admin` | `/admin`; can assign EO users and review eligibility |
| `organizer` / `panitia` | `/admin`; can read reviews and approve registrations/payments |
| `eo` | `/verification`; can review only assigned tournaments |
| `user` | Public tournament and registration pages |

EO users cannot enter the admin control room or user-management pages. The
backend independently checks their role and tournament assignment.

## Set up an external reviewer

1. The reviewer signs in to Auth and Tuwaga once to create their app account.
2. In `/admin/users`, assign **EO · Verifikasi Pemain**. Tuwaga saves the role
   to the central Auth client's `user_client_role`, then updates its own user
   record. Auth must be deployed with the companion role-sync endpoint first.
3. Open `/verification`, select a tournament, and assign the EO in **Penugasan
   EO**. This panel is admin-only. The target is validated by the backend.
4. The EO opens their workspace and reviews player/partner profiles, available
   documents, selected category, and Caprival qualification guidance where
   applicable. They record **Layak**, **Perlu klarifikasi**, or **Tidak layak**.
5. Organizers open the same verification page to read decisions and history,
   then retain control over registration approval and payment.

Existing registrations start with no review, displayed as **Belum ditinjau**.
A review does not change payment, registration status, draws, or scores.

## Synchronization and deployment

The role-sync call is server-only and uses existing `AUTH_CLIENT_ID`,
`AUTH_CLIENT_SECRET`, and `AUTH_INTERNAL_URL`/`AUTH_URL`. The credential is never
sent to browser code. If Auth fails, the local role change is not applied.
If central synchronization succeeds but the local database update fails,
retrying is safe: setting the same central app role is idempotent.

The next OAuth sign-in reads the same `app_role` claim and recognizes `eo`.
Roles edited directly in central Auth take effect in Tuwaga at next sign-in.
For immediate tournament access revocation, remove the EO assignment here.
Sessions continue to read local user roles from the dedicated app database.

Deploy the Auth companion PR and migrations first, the backend second, and
this frontend last. Production uses the existing GitOps process. No existing
user is automatically promoted or assigned to a tournament.

Run `pnpm lint`, `pnpm build`, and
`node --experimental-strip-types --test tests/roles.test.mjs`.
