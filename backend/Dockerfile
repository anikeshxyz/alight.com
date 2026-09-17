# Stage 1: Build JAR using Maven and Java 25
FROM maven:3.9.8-eclipse-temurin-25-alpine AS builder
WORKDIR /app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and package application
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Minimal runtime image
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

# Create unprivileged user and directories
RUN addgroup -S appgroup && adduser -S appuser -G appgroup && \
    mkdir -p /app/logs /app/uploads && \
    chown -R appuser:appgroup /app

# Copy jar from builder stage
COPY --from=builder --chown=appuser:appgroup /app/target/*.jar app.jar

USER appuser

# Expose backend port
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
