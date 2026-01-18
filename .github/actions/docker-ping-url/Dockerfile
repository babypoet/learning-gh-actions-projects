# Stage 1: Build stage
FROM python:alpine3.23

WORKDIR /app

# Install build dependencies

COPY requirements.txt .

RUN pythhon3 -V
RUN pip install --no-cache-dir -r requirements.txt

#Copy wvwrything into current directrory
COPY. .




WORKDIR /app


CMD [ "python", "/app/main.py" ]