# AIO backend

This folder contains a lightweight backend server for the AIO prototype.

## Files

- `server.py`: HTTP server with `/query` endpoint on `localhost:5001`
- `rag.py`: retrieval and answer generation helpers
- `requirements.txt`: Python dependencies
- `.env.example`: required environment variables
- `run.sh`: starts the backend and loads `.env` if present

## Run

```bash
cd tools/aio-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edit .env and set AOAI_API_KEY
python3 server.py
```
