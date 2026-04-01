FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    cmake \
    python3 \
    python3-dev \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src

COPY . .

RUN cmake -S . -B /tmp/otio-cpp-build \
    -DCMAKE_INSTALL_PREFIX=/opt/otio \
    -DOTIO_AUTOMATIC_SUBMODULES=OFF \
    -DOTIO_SHARED_LIBS=OFF \
    && cmake --build /tmp/otio-cpp-build --parallel \
    && cmake --build /tmp/otio-cpp-build --target test --parallel \
    && cmake --build /tmp/otio-cpp-build --target install --parallel

RUN python3 -m pip install --upgrade pip setuptools wheel \
    && CMAKE_ARGS="-DOTIO_AUTOMATIC_SUBMODULES=OFF" python3 -m pip install --no-build-isolation . -v \
    && python3 -c "import opentimelineio, opentimelineio._otio, opentimelineio._opentime"
