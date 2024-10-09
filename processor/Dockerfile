FROM pytorch/pytorch:2.4.1-cuda11.8-cudnn9-runtime

ENV TERM=xterm-256color
ENV REDIS_HOST=redis
ENV REDIS_PORT=6379
ENV REDIS_DB=0
ENV RQ_QUEUE=default
ENV LOG_LEVEL=DEBUG
ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8

RUN apt -q update

RUN conda install -y flask anaconda::redis rq timm pillow requests gunicorn

WORKDIR /app

COPY models ./models
COPY service.py .
COPY wsgi.py .
COPY detect.py .