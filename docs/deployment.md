# Tuwaga Frontend Deployment

This frontend is deployed on the Wikra k3s Kubernetes cluster through GitOps.
Production is not served by Vercel or Docker Compose.

## Current Production Shape

| Item | Value |
| --- | --- |
| Repository | `wikramawardana/tuwaga-fe` |
| Image | `ghcr.io/wikramawardana/tuwaga-fe:v<package-version>-build.<run-number>` |
| Kubernetes namespace | `wikra-apps` |
| Kubernetes app/deployment | `tuwaga-fe` |
| Container port | `3000` |
| NodePort | `31004` |
| Public domain | `https://tuwaga.wikra.my.id` |
| API domain | `https://api-tuwaga.wikra.my.id/api/v1` |
| GitOps app | `wikra-gitops/apps/45-tuwaga-fe.yaml` |
| GitOps image tag | `wikra-gitops/manifests/tuwaga-fe/overlays/prod/kustomization.yaml` |
| Runtime secrets | Vault KV v2 path `secret/tuwaga-fe`, synced by ExternalSecret `tuwaga-fe-env` |

## Required GitHub Actions Secrets

These are used at Docker build time:

```text
NEXT_PUBLIC_APP_URL=https://tuwaga.wikra.my.id
NEXT_PUBLIC_API_URL=https://api-tuwaga.wikra.my.id/api/v1
GH_PAT or GITOPS_TOKEN=<token that can push to wikra-gitops>
HEALTHCHECK_URL=https://tuwaga.wikra.my.id
```

Important: `NEXT_PUBLIC_*` values are baked into the browser bundle during
`pnpm build`. Setting only Kubernetes runtime env is not enough for client-side
code.

## Required Vault Secret

Vault path `secret/tuwaga-fe` must contain:

```text
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://tuwaga.wikra.my.id
NEXT_PUBLIC_API_URL=https://api-tuwaga.wikra.my.id/api/v1
APP_URL=https://tuwaga.wikra.my.id
AUTH_URL=https://auth.wikra.my.id
AUTH_CLIENT_ID=<production Tuwaga OAuth client id from Auth>
AUTH_CLIENT_SECRET=<production Tuwaga OAuth client secret from Auth>
BETTER_AUTH_SECRET=<Tuwaga Better Auth secret>
DATABASE_URL=<PostgreSQL URL used by Better Auth client tables>
```

The production Auth client currently registered for Tuwaga is the client whose
redirect URL is:

```text
https://tuwaga.wikra.my.id/api/auth/oauth2/callback/auth
```

Do not use a local/dev client id in production.

## Normal Deploy Flow

1. Make frontend changes locally.
2. Run checks:

   ```bash
   pnpm lint
   pnpm build
   ```

3. Commit and push to `main`.
4. GitHub Actions reads `package.json` `version`, then builds and pushes an
   immutable image tag such as
   `ghcr.io/wikramawardana/tuwaga-fe:v0.1.0-build.123`.
5. The workflow updates:

   ```text
   wikra-gitops/manifests/tuwaga-fe/overlays/prod/kustomization.yaml
   ```

   The `newTag` value must be a version-build tag, not a git commit SHA.

6. Argo CD syncs the GitOps change into Kubernetes.
7. Verify production.

## Verification Commands

From the VPS:

```bash
kubectl -n wikra-apps get deploy tuwaga-fe \
  -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'

kubectl -n wikra-apps rollout status deploy/tuwaga-fe
kubectl -n wikra-apps logs deploy/tuwaga-fe --tail=100
curl -fsSIL https://tuwaga.wikra.my.id
```

Check that the browser create-tournament request goes to:

```text
https://api-tuwaga.wikra.my.id/api/v1/admin/tournaments
```

If it goes to `https://tuwaga.wikra.my.id/admin/tournaments`, the public API URL
was missing at build time.

## DNS And Nginx

Cloudflare points `tuwaga.wikra.my.id` to the VPS.

The VPS nginx route proxies:

```text
tuwaga.wikra.my.id -> 127.0.0.1:31004
```

## Common Failure Modes

### Browser POST returns 404 on `tuwaga.wikra.my.id/admin/tournaments`

Cause: `NEXT_PUBLIC_API_URL` was empty during Docker build. Next.js baked an
empty API base into the browser bundle.

Fix:

1. Set GitHub Actions secret:

   ```text
   NEXT_PUBLIC_API_URL=https://api-tuwaga.wikra.my.id/api/v1
   ```

2. Confirm `src/lib/tuwagaApi.ts` has the production fallback.
3. Rebuild and redeploy the frontend image.

### Login redirects to Auth home page

Usually one of these is wrong:

- Tuwaga FE uses a dev OAuth client id.
- Auth production DB does not contain that client id.
- Auth `ALLOWED_ORIGINS` does not include `https://tuwaga.wikra.my.id`.
- The OAuth callback URL is missing:
  `https://tuwaga.wikra.my.id/api/auth/oauth2/callback/auth`.

### ExternalSecret overwrites manual Kubernetes secret edits

Production env comes from Vault. Patch Vault, not only the generated
Kubernetes Secret.
