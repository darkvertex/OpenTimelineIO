# syntax=docker/dockerfile:1.7

FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04 AS dev

ENV DEBIAN_FRONTEND=noninteractive \
    CMAKE_ARGS=-DOTIO_AUTOMATIC_SUBMODULES=OFF \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        ca-certificates \
        clang-format \
        cmake \
        curl \
        doxygen \
        emscripten \
        git \
        graphviz \
        lcov \
        make \
        ninja-build \
        nodejs \
        npm \
        pkg-config \
        python-is-python3 \
        python3 \
        python3-dev \
        python3-pip \
        python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspaces/OpenTimelineIO
