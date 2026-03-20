# C++ execution environment
FROM gcc:latest

# Set working directory
WORKDIR /workspace

# Install timeout utility (already available in gcc image)

# Create non-root user for security
RUN useradd -m -u 1000 coderunner && \
    chown -R coderunner:coderunner /workspace

USER coderunner

# Default command
CMD ["g++"]
