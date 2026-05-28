# dati-semantic-admin — task runner
# https://just.systems  (richiede `just` installato)

# Default: lista i comandi disponibili
default:
    @just --list

# --- Sviluppo ---

# Avvia Keycloak locale (in background)
kc-up:
    docker compose up -d keycloak

# Stop Keycloak locale
kc-down:
    docker compose down

# Tail log Keycloak
kc-logs:
    docker compose logs -f keycloak

# Apri la admin console di Keycloak (user/pass: admin/admin)
kc-console:
    @echo "Keycloak admin: http://localhost:8082/admin"
    @echo "  user: admin"
    @echo "  pass: admin"

# Avvia backend Spring (profilo local). Richiede Keycloak su 8082 e BE NDC su 8081.
dev:
    SPRING_PROFILES_ACTIVE=local ./gradlew bootRun

# Avvia dev server Vite (hot reload). In parallelo con `just dev`.
fe-dev:
    cd frontend && npm run dev

# --- Build ---

# Build completo: FE + jar
build:
    ./gradlew build

# Build solo del jar (senza FE, usa l'ultimo build esistente)
build-jar:
    ./gradlew bootJar -x copyFrontendDist

# Build solo del FE
fe-build:
    ./gradlew npmBuild

# Clean
clean:
    ./gradlew clean

# --- Test ---

# Test backend
test:
    ./gradlew test

# Lint completo (FE + BE)
lint: fe-lint be-lint

# Format completo (FE + BE) - applica modifiche
format: fe-format be-format

# Lint solo frontend
fe-lint:
    cd frontend && npm run lint

# Lint solo backend
be-lint:
    ./gradlew spotlessCheck

# Format solo frontend
fe-format:
    cd frontend && npm run format

# Format solo backend
be-format:
    ./gradlew spotlessApply

# --- Container ---

# Build immagine Docker locale
image:
    docker build -t dati-semantic-admin:dev .

# Run dell'immagine appena buildata
image-run:
    docker run --rm -p 8080:8080 --network host \
        -e SPRING_PROFILES_ACTIVE=local \
        dati-semantic-admin:dev

# --- Setup ---

# Installa dipendenze npm (eseguito da gradle automaticamente, qui per debug)
fe-install:
    cd frontend && npm install
