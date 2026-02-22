FROM python:3.12-slim

WORKDIR /app

COPY actiancortex-0.1.0b1-py3-none-any.whl .
COPY mynextdate-backend/requirements.txt .
RUN pip install --no-cache-dir actiancortex-0.1.0b1-py3-none-any.whl -r requirements.txt && rm actiancortex-0.1.0b1-py3-none-any.whl

COPY mynextdate-backend/ .

EXPOSE 8000

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2
