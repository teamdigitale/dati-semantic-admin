# dati-semantic-admin

Admin panel for **NDC** (National Data Catalog — *Catalogo Nazionale dei Dati*). Single Spring Boot deployment hosting a React SPA plus a BFF (OAuth2 client) that proxies authenticated requests to the NDC backend (`dati-semantic-backend`).

## Architecture

- Browser ↔ **Admin BFF** (this app, port 8080): serves the SPA, terminates the user session, runs the OAuth2 Authorization Code + PKCE flow against Keycloak.
- BFF ↔ **NDC Backend** (`dati-semantic-backend`, port 8081): the BFF acts as a reverse proxy on `/bff/api/**`, attaching the user's bearer JWT to every backend call.
- All authentication state lives server-side in the `HttpSession`; the browser only holds the `JSESSIONID` cookie (HttpOnly) and the `XSRF-TOKEN` cookie (double-submit CSRF protection).

Authorization is role-based via the Keycloak `realm_access.roles` claim, mapped to `ROLE_NDC_ADMIN`, `ROLE_NDC_VIEWER`, `ROLE_NDC_SERVICE` on the backend.

## Stack

- **Backend**: Spring Boot 3.5.x, Java 21, `spring-boot-starter-oauth2-client`, `RestClient`.
- **Frontend**: React 18, Vite, TypeScript, Bootstrap Italia (`design-react-kit`), TanStack Query.
- **Build**: Gradle (with `gradle-node-plugin` to integrate the npm build); single fat jar containing the bundled SPA.
- **Auth**: OAuth2 Authorization Code + PKCE against Keycloak; server-side session.

## Requirements

- JDK 21
- Docker / docker-compose (for the local Keycloak)
- *(Optional)* Node 20 + npm — the Gradle plugin downloads them on first build
- *(Optional)* [`just`](https://just.systems) for the convenience commands listed below

## Build & run

Full build (FE bundle + Spring Boot jar):

```bash
./gradlew build
```

Run the app (serves the bundled SPA on `http://localhost:8080`):

```bash
./gradlew bootRun
```

Frontend only:

```bash
./gradlew npmBuild
```

Clean:

```bash
./gradlew clean
```

## Frontend dev loop (HMR)

For Vite hot reload during FE development:

```bash
# Terminal 1 — Spring backend (auth, session, proxy)
./gradlew bootRun

# Terminal 2 — Vite dev server (HMR)
cd frontend
npm run dev
```

Open `http://localhost:5173`. Requests to `/bff/api`, `/oauth2`, `/login`, `/logout` are proxied to port 8080 (see `vite.config.ts`).

## Configuration

Defaults live in `src/main/resources/application.yml`; local-only overrides in `application-local.yml` (activated with `SPRING_PROFILES_ACTIVE=local`).

| Property | Local default | Description |
|---|---|---|
| `ndc.bff.backend-url` | `http://localhost:8081` | URL of the NDC backend (`dati-semantic-backend`) |
| `spring.security.oauth2.client.registration.keycloak.client-id` | `ndc-admin-bff-client` | OAuth client registered in Keycloak |
| `spring.security.oauth2.client.registration.keycloak.client-secret` | *(env `OAUTH2_CLIENT_SECRET`)* | OAuth client secret |
| `spring.security.oauth2.client.provider.keycloak.issuer-uri` | `http://localhost:8082/realms/ndc` | Keycloak realm URL |

In production all of the above come from environment variables — no secrets are baked into the image.

## Layout

```
src/main/java/it/gov/innovazione/ndc/admin/   # Spring Boot (BFF, proxy, security)
src/main/resources/static/                     # Bundled SPA (generated, not tracked)
frontend/                                      # React + Vite sources
local/keycloak/                                # Pre-baked realm for local dev
```

## Local end-to-end setup

```bash
just kc-up         # Keycloak on :8082, realm "ndc" pre-imported
just dev           # Spring Boot on :8080 (local profile)
# in another terminal, if you want FE hot reload
just fe-dev        # Vite on :5173, proxying to :8080
```

The NDC backend (`dati-semantic-backend`) is expected on `:8081`. With no backend up, the BFF and login flow still work — only `/bff/api/**` calls will fail.

**Test users pre-loaded in realm `ndc`:**

| Username | Password | Role |
|---|---|---|
| `mario.rossi` | `password` | `ndc-admin` |
| `giulia.viewer` | `password` | `ndc-viewer` |

**Keycloak clients in the local realm:**

- `ndc-admin-bff-client` — confidential, used by this BFF. Secret: `local-development-secret`.
- `ndc-cron-service-client` — service account (client_credentials), used by schedulers calling the backend. Secret: `local-cron-secret`.

> These secrets are **local-development only**. The realm export under `local/keycloak/` is meant for running Keycloak in dev — production deployments use a separately-managed realm.

Keycloak admin console: `http://localhost:8082/admin` (user `admin` / password `admin`).

## Container image

Local build (multi-stage Dockerfile, distroless runtime):

```bash
just image
just image-run
```

CI publishes to `ghcr.io/<org>/dati-semantic-admin` on every push to `main`; see `.github/workflows/ci.yml`.

## Lint & format

```bash
just lint          # FE (eslint) + BE (spotless check)
just format        # FE (prettier) + BE (spotless apply)
```

## License

Released under the [EUPL-1.2](https://joinup.ec.europa.eu/collection/eupl) license, consistent with the upstream `dati-semantic-backend` project.
