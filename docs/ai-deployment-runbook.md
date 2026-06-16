# AI Deployment Runbook - Tuwaga Frontend

This file is for future AI agents working on this repo.

## Do Not Guess These Values

```text
Frontend domain: https://tuwaga.wikra.my.id
Backend API:     https://api-tuwaga.wikra.my.id/api/v1
Local FE port:   3004
Local BE port:   8004
K8s FE service:  tuwaga-fe, NodePort 31004
K8s BE service:  tuwaga-be, NodePort 31084
Namespace:       wikra-apps
GitOps repo:     /Users/wikra/MyProjects/wikra-gitops
```

## Production Deployment Checklist

1. Run `pnpm lint` and `pnpm build`.
2. Push to `main`.
3. Watch `wikramawardana/tuwaga-fe` workflow `deploy.yml`.
4. Pull `wikra-gitops` and confirm:

   ```text
   manifests/tuwaga-fe/overlays/prod/kustomization.yaml
   ```

   has `newTag: v<package-version>-build.<run-number>`, for example
   `newTag: v0.1.0-build.123`.

   Do not replace this with a commit SHA. The image tag is based on
   `package.json` `version` plus the GitHub Actions run number.

5. If Argo lags, refresh the app from the VPS:

   ```bash
   kubectl -n argocd annotate app tuwaga-fe argocd.argoproj.io/refresh=hard --overwrite
   ```

6. Confirm the deployment image:

   ```bash
   kubectl -n wikra-apps get deploy tuwaga-fe \
     -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'
   ```

## Known Pitfalls

- `NEXT_PUBLIC_API_URL` must exist at Docker build time. Runtime Kubernetes env
  alone is insufficient for browser code.
- Auth production client id and local/dev client id may differ. Query or view
  the Auth dashboard before changing OAuth envs.
- ExternalSecret syncs from Vault hourly and can overwrite manual K8s secret
  patches quickly.
- Remove any temporary files created under `/tmp` on the VPS or inside pods.
