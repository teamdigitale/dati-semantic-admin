# Multi-stage build: una immagine minima con il jar Spring Boot + SPA buildata dentro.
#
# Stage 1: build (JDK 21 + Node, scaricato da Gradle plugin).
# Stage 2: runtime distroless con il solo jar copiato.

# -------- Stage 1: build --------
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /workspace

# Cache delle dipendenze Gradle: copia prima i file di descrizione, poi il sorgente.
COPY gradlew settings.gradle build.gradle gradle.properties ./
COPY gradle ./gradle
# Pre-warm dependencies (best effort; non rompe se manca rete dei plugin all'inizio)
RUN ./gradlew --no-daemon help || true

# Copia tutto il sorgente (Java + frontend)
COPY src ./src
COPY frontend ./frontend

# Build completa (npm install + npm run build + bootJar)
RUN ./gradlew --no-daemon bootJar -x test

# -------- Stage 2: runtime --------
FROM gcr.io/distroless/java21-debian12:nonroot
WORKDIR /app
COPY --from=build /workspace/build/libs/*.jar /app/app.jar

EXPOSE 8080
USER nonroot
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
