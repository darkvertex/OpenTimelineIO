import { loadOpenTimelineIO } from "./index.js";

const SAMPLE_OTIO_JSON = `{
  "OTIO_SCHEMA": "Timeline.1",
  "name": "browser-mvp",
  "global_start_time": null,
  "tracks": {
    "OTIO_SCHEMA": "Stack.1",
    "name": "tracks",
    "children": []
  },
  "metadata": {}
}`;

async function main(): Promise<void> {
  const otio = await loadOpenTimelineIO();
  const parsed = otio.parseJson(SAMPLE_OTIO_JSON);

  if (!parsed.ok || !parsed.value) {
    throw new Error(parsed.error?.fullDescription ?? "Failed to parse OTIO JSON.");
  }

  const stringified = otio.stringifyJson(parsed.value, 2);
  parsed.value.dispose();

  if (!stringified.ok || !stringified.json) {
    throw new Error(
      stringified.error?.fullDescription ?? "Failed to stringify OTIO JSON."
    );
  }

  if (
    !stringified.json.includes('"OTIO_SCHEMA": "Timeline.1"') ||
    !stringified.json.includes('"name": "browser-mvp"')
  ) {
    throw new Error("Browser MVP roundtrip output did not contain the expected timeline data.");
  }

  console.log("OTIO browser MVP JSON parse/stringify succeeded.");
}

main().catch((error: unknown) => {
  console.error(error);
  queueMicrotask(() => {
    throw error instanceof Error ? error : new Error(String(error));
  });
});
