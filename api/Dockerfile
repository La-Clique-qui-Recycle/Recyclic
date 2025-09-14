FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/

# Install package in development mode
RUN pip install -e .

# Copy environment file
COPY ../env.example .env

# Add src to Python path
ENV PYTHONPATH=/app/src:/app/src/recyclic_api

# Create non-root user
RUN useradd -m -u 1000 recyclic && chown -R recyclic:recyclic /app
USER recyclic

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
