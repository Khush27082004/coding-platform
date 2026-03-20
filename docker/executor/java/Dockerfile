# Java execution environment
FROM openjdk:17-slim

# Set working directory
WORKDIR /workspace

# Install timeout utility
RUN apt-get update && apt-get install -y coreutils && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd -m -u 1000 coderunner && \
    chown -R coderunner:coderunner /workspace

USER coderunner

# Default command
CMD ["java"]
