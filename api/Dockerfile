FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/
COPY generate_openapi.py .

# Copy tests
COPY tests/ ./tests/

# Copy the admin creation script and make it executable
COPY create_admin.sh .
RUN chmod +x create_admin.sh

# Copy Alembic configuration and migrations
COPY alembic.ini .
COPY migrations/ ./migrations/

# Copy pytest configuration
COPY pytest.ini .




# Add src to Python path
ENV PYTHONPATH=/app/src

# Create non-root user
RUN useradd -m -u 1000 recyclic && chown -R recyclic:recyclic /app
USER recyclic

EXPOSE 8000

CMD ["uvicorn", "recyclic_api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
