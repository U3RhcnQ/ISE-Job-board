# Stage 1: Build the application using Gradle
FROM eclipse-temurin:21-jdk AS builder
WORKDIR /workspace

# Copy the Gradle wrapper files, build.gradle, and settings.gradle
# to leverage Docker cache for dependencies
COPY gradlew ./gradlew
COPY gradle ./gradle
COPY build.gradle settings.gradle ./

# Grant execution rights to gradlew and download dependencies
# This layer is cached if build.gradle or settings.gradle haven't changed.
RUN chmod +x ./gradlew && ./gradlew dependencies --info

# Copy the source code
COPY src ./src

# Build the application and package it into a JAR.
# For production builds, you'd typically run tests.
# The 'bootJar' task creates the executable JAR for Spring Boot.
RUN ./gradlew bootJar -x test --info

# Stage 2: Create the runtime image from a lightweight JRE base
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create a non-root user and group for better security
ARG UID=1001
RUN addgroup -S appgroup && adduser -S appuser -G appgroup -u $UID
USER appuser

# Copy the JAR file from the builder stage.
# For Gradle, the JAR is typically in 'build/libs/'.
# The exact JAR name might vary based on your artifactId and version.
# Using a wildcard (*) is safer here.
COPY --from=builder /workspace/build/libs/*.jar app.jar

# Expose the port your Spring Boot application listens on
EXPOSE 8080

# Command to run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
