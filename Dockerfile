# FlyWise - React frontend Dockerfile
# Builds the React client for FastAPI to serve via StaticFiles.
#
# This is a frontend-only build. The FastAPI backend will be added in a later stage.
# To create a unified image with FastAPI, add a Python stage after this one.

FROM node:24-alpine AS frontend

WORKDIR /app
RUN chown node:node /app

USER node

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

COPY --chown=node:node . .

# Build the React client. Output goes to dist/client.
RUN npm run build

# The built assets are now in /app/dist/client.
# When FastAPI is added, copy them to the final stage and mount with StaticFiles.
# Example final stage:
# FROM python:3.12-alpine
# COPY --from=frontend /app/dist/client /app/static
# COPY backend/ /app/backend
# RUN pip install -r /app/backend/requirements.txt
# CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]