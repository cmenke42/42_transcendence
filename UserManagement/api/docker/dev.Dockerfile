# syntax=docker/dockerfile:1

# Build the base image.
ARG PYTHON_VERSION=3.12
FROM python:${PYTHON_VERSION}-slim AS base

# Prevents Python from writing pyc files (precompiled bytecode).
ENV PYTHONDONTWRITEBYTECODE=1

# Keeps Python from buffering stdout and stderr to avoid situations where
# the application crashes without emitting any logs due to buffering.
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Create a non-privileged user that the app will run under.
ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser


# Builder stage for dependencies
FROM base AS builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    # Required for argon password hashing    
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.cache/pip to speed up subsequent builds.
RUN --mount=type=cache,target=/root/.cache/pip \
    #TODO change for produciton
    python -m pip install -r requirements.txt


# Final stage
FROM base AS final

WORKDIR /app

# Copy the dependencies from the builder stage.
COPY --from=builder /usr/local /usr/local

# Copy entrypoint script
COPY ./docker/entrypoint.sh /usr/local/bin/entrypoint.sh

# Switch to the non-privileged user to run the application.
USER appuser

# Prepare the application.
ENTRYPOINT [ "entrypoint.sh" ]

# Run the application.
CMD [ "python", "manage.py", "runserver", "0.0.0.0:8000" ]