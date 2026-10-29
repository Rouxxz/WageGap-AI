FROM python:3.10-slim

# libgomp1 é exigido pelo LightGBM
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
# timeout maior: pyarrow, lightgbm e shap são grandes e a rede pode oscilar
RUN pip install --no-cache-dir --default-timeout=300 --retries 10 -r requirements.txt

COPY . .

CMD ["python", "-m", "src.run", "--help"]
