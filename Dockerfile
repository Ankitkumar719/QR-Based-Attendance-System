FROM node:20-bullseye

# Install Python + build deps for face-recognition (dlib)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-dev \
    build-essential cmake pkg-config \
    libopenblas-dev liblapack-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Node deps (backend)
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci --omit=dev

# Python deps (face worker uses ml/requirements.txt)
COPY ml/requirements.txt ./ml/requirements.txt
RUN python3 -m pip install --no-cache-dir -r ml/requirements.txt

# App sources
COPY backend ./backend
COPY frontend ./frontend
COPY ml ./ml

ENV NODE_ENV=production
WORKDIR /app/backend
EXPOSE 5000

CMD ["node", "server.js"]

