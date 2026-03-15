---
applyTo: "**/Dockerfile*"
---

# Dockerfile conventions

- Use multi-stage builds to minimize final image size
- Pin base image tags to specific versions (never use :latest)
- Run as non-root user (create with `adduser`/`addgroup`)
- Use COPY over ADD; use .dockerignore to exclude unnecessary files
- Combine RUN commands to reduce layers
- Set HEALTHCHECK instruction for container health monitoring
- Label images with org.opencontainers.image.* annotations
- Scan images with Trivy before deployment
