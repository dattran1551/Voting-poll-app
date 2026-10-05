# Deployment

The app runs in two independent places. Each one has its own database, so questions submitted on one never show up on the other.

| | Vercel (original) | VNG Dokploy (copy) |
|---|---|---|
| URL | `https://voting-poll-app-psi.vercel.app` | `https://audience-qa-ytl8il-fcea1d-103-245-249-96.sslip.io` |
| Database | Neon Postgres (pooled connection string) | Postgres container `audience-qa-db` on Dokploy |
| Deploys | Automatically on every push to `main` | Manually, after pushing to `main` (see below) |

## VNG Dokploy

- Server: `https://host.vnggames.ai`
- Project / environment: `DatTK` / `production`
- App: `audience-qa` (applicationId `WnPC3EnhjxEa_eeOSbp9O`)
- Source: custom Git, `https://github.com/dattran1551/Voting-poll-app.git`, branch `main`
- Build: Nixpacks, Node 22 (`NIXPACKS_NODE_VERSION=22`), listens on `PORT=3000`
- Database: `audience-qa-db` (postgresId `Oyr7TRWeqYw6MBzxYtQ3M`). It is only reachable from inside the Dokploy network (the server firewall blocks external ports).

Environment variables are set on the app in the Dokploy UI (**Environment** tab): `DATABASE_URL`, `ADMIN_SECRET_TOKEN`, `PORT`, `NIXPACKS_NODE_VERSION`. Never commit their values.

The tables are created automatically the first time the app connects (`lib/schema.ts`), so you don't have to run `schema.sql` by hand on a new database.

### Redeploying after a change

1. Merge the change into `main` and push it to GitHub. Vercel updates by itself.
2. In Dokploy, open the `audience-qa` app and click **Deploy**. Dokploy pulls `main` from GitHub and rebuilds it, which takes about 3–4 minutes.

Uploading a local folder (`dokploy app deploy --from-folder`) currently fails on this server with an internal server error (HTTP 500 from `application.dropDeployment`). Even a one-file zip fails, so the problem is on the server side. Deploy from Git as described above.
