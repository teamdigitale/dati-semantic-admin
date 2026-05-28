# dati-semantic-admin

Pannello amministrativo NDC (MGT-DASH). Single deployment Spring Boot che ospita la SPA React + un BFF (OAuth2 client) che proxa verso il BE NDC (`dati-semantic-backend`).

Vedi `backlog/MGT-DASH/piano_tecnico.md` nel workspace di lavoro per l'architettura e le decisioni.

## Stack

- **Backend**: Spring Boot 3.5.x, Java 21, `spring-boot-starter-oauth2-client`, `WebClient`.
- **Frontend**: React 18, Vite, TypeScript, in `frontend/`.
- **Build**: Gradle (con plugin `gradle-node-plugin` per integrare la build npm).
- **Auth**: OAuth2 Authorization Code + PKCE verso Keycloak ISTAT, sessione `HttpSession` lato server, cookie `JSESSIONID` HttpOnly.

## Requisiti

- JDK 21
- (Opzionale, scaricato in automatico) Node 20 + npm — il plugin Gradle li scarica al primo build.
- Docker / docker-compose per Keycloak locale.
- [`just`](https://just.systems) per i comandi rapidi (facoltativo: equivalente a Makefile).

## Build & run locale

Single command (build FE + jar Spring Boot):

```bash
./gradlew build
```

Avvio app (serve la SPA buildata su `http://localhost:8080`):

```bash
./gradlew bootRun
```

Build solo frontend:

```bash
./gradlew npmBuild
```

Clean:

```bash
./gradlew clean
```

## Sviluppo con hot reload del FE

Per lavorare sul FE con HMR Vite:

```bash
# Terminale 1 - backend Spring (gestisce auth, sessione, proxy verso BE)
./gradlew bootRun

# Terminale 2 - dev server Vite (HMR)
cd frontend
npm run dev
```

Apri `http://localhost:5173`. Le chiamate a `/bff/api`, `/oauth2`, `/login`, `/logout` vengono proxate verso 8080 (vedi `vite.config.ts`).

## Configurazione

Properties in `src/main/resources/application.yml` (default), override in `application-local.yml`. Variabili chiave:

| Property | Default local | Descrizione |
|---|---|---|
| `ndc.bff.backend-url` | `http://localhost:8081` | URL del BE `dati-semantic-backend` |
| `spring.security.oauth2.client.registration.keycloak.client-id` | `ndc-admin-bff-client` | Client OAuth registrato in Keycloak |
| `spring.security.oauth2.client.provider.keycloak.issuer-uri` | `http://localhost:8082/realms/ndc` | URL realm Keycloak |

## Struttura

```
src/main/java/it/gov/innovazione/ndc/admin/    # Spring Boot
src/main/resources/static/                      # SPA buildata (NON committata)
frontend/                                       # sorgenti React + Vite
deploy/                                         # manifest K8s / pipeline
```

## Setup locale completo

```bash
just kc-up         # avvia Keycloak (porta 8082) con realm "ndc" pre-importato
just dev           # avvia Spring Boot (porta 8080)
# in altro terminale, se serve hot reload del FE
just fe-dev        # avvia Vite (porta 5173, proxy verso 8080)
```

**Utenti di test pre-caricati nel realm `ndc`**:

| Username | Password | Ruolo |
|---|---|---|
| `mario.rossi` | `password` | `ndc-admin` |
| `giulia.viewer` | `password` | `ndc-viewer` |

Client OAuth: `ndc-admin-bff-client` (secret `local-development-secret`).
Service client per scheduler: `ndc-cron-service-client` (secret `local-cron-secret`).
Admin Keycloak: `http://localhost:8082/admin` (admin/admin).

## Container image

Build immagine locale (multi-stage Dockerfile):

```bash
just image
just image-run
```

In CI: GitHub Actions pubblica su `ghcr.io/<org>/dati-semantic-admin` ad ogni push su `main`. Vedi `.github/workflows/ci.yml`.
