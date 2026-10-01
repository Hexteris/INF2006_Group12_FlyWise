FROM python:3.12-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       libmariadb-dev \
       gcc \
       pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY FastAPI.py .
COPY ["SQL Queries/", "./SQL Queries/"]
COPY ["ML Model/", "./ML Model/"]

EXPOSE 8000

CMD ["uvicorn", "FastAPI:app", "--host", "0.0.0.0", "--port", "8000"]