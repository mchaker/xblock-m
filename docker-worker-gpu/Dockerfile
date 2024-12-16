FROM nvidia/cuda:12.4.1-cudnn-devel-ubuntu22.04

WORKDIR /xblock

ENV PYTHON_VERSION=3.11

RUN apt update && \
    apt install -y \
    python${PYTHON_VERSION} \
    python${PYTHON_VERSION}-dev \
    python3-pip

RUN pip install --upgrade pip

COPY ./lib /xblock/lib
COPY ./processor /xblock/processor

RUN pip3 install --use-deprecated=legacy-resolver -r ./processor/requirements.txt

CMD ["python3", "processor/worker.py"]
