# Browser and WebAssembly Build

This guide documents the browser-first MVP path for OpenTimelineIO.

The browser package lives under `src/wasm-opentimelineio` and contains:

- the Emscripten/embind bridge in `otio_wasm_bindings.cpp`
- the TypeScript wrapper layer in `typescript/index.ts`
- the browser sample-file demo in `typescript/browser-demo.ts`

## MVP scope

The current browser target intentionally starts small:

- browser-first before other JavaScript runtimes
- OTIO JSON parse/stringify as the first supported workflow
- wrapper classes for complex OTIO objects
- interfaces for simple value-shaped data such as parse/stringify results and
  error payloads

That means the first browser-facing wrapper is `OTIOSerializableObject`, while
TypeScript value-only data is described with interfaces such as
`OTIOParseResult`, `OTIOStringifyResult`, and `OTIOErrorStatus`.

## Prerequisites

Use the repo `Dockerfile` or `.devcontainer` for the canonical setup. For a
local environment, make sure you have:

- Python and the standard OTIO development dependencies
- Node and npm
- Emscripten (`emcmake`, `em++`)

## Clean checkout build

From the repository root:

```bash
git submodule update --init --recursive
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r docs/requirements.txt
python -m pip install -e ".[dev]"
npm ci --prefix src/wasm-opentimelineio
```

Configure the browser build:

```bash
emcmake cmake -S . -B build-wasm \
  -DOTIO_AUTOMATIC_SUBMODULES=OFF \
  -DOTIO_PYTHON_INSTALL=OFF \
  -DOTIO_SHARED_LIBS=OFF \
  -DOTIO_WASM_BUILD=ON \
  -DBUILD_TESTING=OFF
```

Build the wasm package:

```bash
cmake --build build-wasm --target otio_wasm_package
```

Generated browser artifacts land in:

`build-wasm/src/wasm-opentimelineio/dist/`

The main outputs are:

- `otio_wasm.js`
- `otio_wasm.d.ts`
- `otio_wasm.wasm`
- `index.js`
- `index.d.ts`
- `browser-demo.js`
- `browser-demo.html`
- `clip_example.otio`

## Minimal validation path

Build the browser package:

```bash
cmake --build build-wasm --target otio_wasm_package
```

Then serve the generated `build-wasm/src/wasm-opentimelineio/dist/` directory
with any static web server and open `browser-demo.html`.

That page loads the module in a browser-oriented environment, fetches the copied
repo sample `tests/sample_data/clip_example.otio`, parses it with the wasm
module, and then renders a visible summary of the timeline, tracks, clips, and
transitions before showing the roundtripped OTIO JSON.

## Browser hello world

The hello-world flow is:

```ts
import { loadOpenTimelineIO } from "./index.js";

const otio = await loadOpenTimelineIO();
const parsed = otio.parseJson(inputJson);
const stringified = otio.stringifyJson(parsed.value!, 2);
```

This is the first supported browser MVP path and should stay central as the web
bindings expand.
