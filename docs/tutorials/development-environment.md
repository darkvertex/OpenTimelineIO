# Development Environment

This guide is the developer-oriented companion to the user-facing
[Quickstart](./quickstart.md). It shows how to get from a clean checkout to a
working OpenTimelineIO build, and it documents the repo's reproducible
containerized environment for native, Python, and browser-oriented work.

## Canonical clean environment

This repository now includes two first-class environment definitions:

- `/home/runner/work/OpenTimelineIO/OpenTimelineIO/Dockerfile` is the canonical
  clean build environment.
- `/home/runner/work/OpenTimelineIO/OpenTimelineIO/.devcontainer/devcontainer.json`
  builds on that image and is the fastest path for contributors using VS Code or
  any Dev Container-compatible editor.

The image intentionally includes the current native/Python toolchain plus the
common browser-workstream prerequisites:

- C++ build tools (`cmake`, `ninja`, `build-essential`)
- Python build tools (`python3`, `pip`, `venv`)
- docs and validation tools (`doxygen`, `graphviz`, `lcov`, `clang-format`)
- browser/wasm workbench tools (`node`, `npm`, `emscripten`)

`CMAKE_ARGS=-DOTIO_AUTOMATIC_SUBMODULES=OFF` is set in the containerized
environment so Python source builds do not re-enter submodule management when
the checkout already has populated submodules.

## Fastest path: open the repo in a dev container

1. Open the repository in a Dev Container-capable editor.
2. Reopen the folder in the container.
3. Let the `postCreateCommand` finish. It will:
   - initialize submodules
   - create `.venv`
   - install `docs/requirements.txt`
   - install OpenTimelineIO in editable dev mode

After that, the container is ready for normal development work.

### Common commands inside the devcontainer

```bash
source .venv/bin/activate
make ci-prebuild
cmake -S . -B build-local -DCMAKE_INSTALL_PREFIX=$PWD/install-local -DOTIO_SHARED_LIBS=OFF
cmake --build build-local --config Release
cmake --build build-local --target test --config Release
make doc-html
```

## Docker workflow without a devcontainer

Build the image:

```bash
docker build -t otio-dev .
```

Start an interactive shell in the clean environment:

```bash
docker run --rm -it -v "$(pwd):/workspaces/OpenTimelineIO" -w /workspaces/OpenTimelineIO otio-dev bash
```

Inside the container, create the same virtual environment used by the
devcontainer:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r docs/requirements.txt
python -m pip install -e ".[dev]"
git submodule update --init --recursive
```

## Native and Python build from a clean checkout

From the repository root:

```bash
git submodule update --init --recursive
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r docs/requirements.txt
python -m pip install -e ".[dev]"
```

Build the C++ SDK:

```bash
cmake -S . -B build-local -DCMAKE_INSTALL_PREFIX=$PWD/install-local -DOTIO_SHARED_LIBS=OFF
cmake --build build-local --config Release
cmake --build build-local --target install --config Release
```

This gives you:

- an editable Python install for day-to-day development
- a local C++ build tree in `build-local`
- an install tree in `install-local`

## Validation commands

Recommended checks after a clean setup:

```bash
source .venv/bin/activate
make ci-prebuild
cmake --build build-local --target test --config Release
make test
```

If you are iterating in an environment where the console entry points are not on
the active scripts path, you can still run the Python unit suite with:

```bash
OTIO_DISABLE_SHELLOUT_TESTS=1 make test
```

## Browser/wasm workbench

This repository does **not** yet ship a dedicated browser package, TypeScript
wrapper layer, or JavaScript runtime demo. The Dockerfile and devcontainer still
install the browser-oriented toolchain so contributors can work on that slice in
a reproducible environment.

The current starting point for experimental wasm work is to configure the C++
core with Emscripten from the same clean environment:

```bash
source .venv/bin/activate
emcmake cmake -S . -B build-wasm \
  -DOTIO_AUTOMATIC_SUBMODULES=OFF \
  -DOTIO_PYTHON_INSTALL=OFF \
  -DOTIO_SHARED_LIBS=OFF \
  -DBUILD_TESTING=OFF
cmake --build build-wasm
```

Today, that path should be treated as a workbench for the core libraries rather
than a finished browser distribution.

## Browser MVP guidance for future contributors

When adding the browser-facing layer on top of the wasm build, keep the initial
scope intentionally small:

- stay browser-first before expanding to other JavaScript runtimes
- prove the MVP with OTIO JSON parse/stringify first
- use wrapper classes for complex OTIO graph objects
- use interfaces for simple value-shaped data passed across the browser-facing API

That keeps the first browser milestone focused, testable, and aligned with the
intended architecture.
