# TODO: Run $ docker buildx build --build-arg APP_JAR=maven_project-1.0-SNAPSHOT.jar -t cv47522/my-java-app:1.0 .
# Create this Dockerfile in your repository root
FROM openjdk:25-ea-21-slim-bullseye

ARG APP_JAR=app.jar
LABEL maintainer="your-email@example.com"
LABEL version="1.0"

# Create app directory
WORKDIR /app

# Copy JAR file
COPY target/*.jar $APP_JAR

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Run application
ENTRYPOINT ["java", "-jar", "maven_project-1.0-SNAPSHOT.jar"]