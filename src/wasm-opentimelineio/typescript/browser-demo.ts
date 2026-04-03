import { loadOpenTimelineIO } from "./index.js";

const SAMPLE_OTIO_PATH = "./clip_example.otio";
const SAMPLE_OTIO_SOURCE = "tests/sample_data/clip_example.otio";

type JSONObject = { [key: string]: JSONValue };
type JSONValue = boolean | null | number | string | JSONObject | JSONValue[];

interface DemoSummary {
  clipNames: string[];
  schemaCount: number;
  trackNames: string[];
  transitionNames: string[];
  timelineName: string;
}

function assertElement<T extends Element>(
  value: T | null,
  message: string
): T {
  if (!value) {
    throw new Error(message);
  }

  return value;
}

function walkOtioTree(value: JSONValue, visitor: (node: JSONObject) => void): void {
  if (Array.isArray(value)) {
    value.forEach((entry) => walkOtioTree(entry, visitor));
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  visitor(value);

  Object.values(value).forEach((entry) => walkOtioTree(entry, visitor));
}

function summarizeOtioDocument(document: JSONObject): DemoSummary {
  const clipNames: string[] = [];
  const trackNames: string[] = [];
  const transitionNames: string[] = [];
  let schemaCount = 0;

  walkOtioTree(document, (node) => {
    const schema = node.OTIO_SCHEMA;

    if (typeof schema !== "string") {
      return;
    }

    schemaCount += 1;

    if (schema === "Clip.1" && typeof node.name === "string") {
      clipNames.push(node.name);
    }

    if (schema === "Track.1" && typeof node.name === "string") {
      trackNames.push(node.name);
    }

    if (schema === "Transition.1" && typeof node.name === "string") {
      transitionNames.push(node.name);
    }
  });

  return {
    clipNames,
    schemaCount,
    timelineName:
      typeof document.name === "string" ? document.name : "Unnamed Timeline",
    trackNames,
    transitionNames,
  };
}

function renderSummary(summary: DemoSummary, roundtrippedJson: string): void {
  const samplePath = assertElement(
    document.querySelector<HTMLElement>("[data-sample-path]"),
    "Missing sample path output element."
  );
  const status = assertElement(
    document.querySelector<HTMLElement>("[data-demo-status]"),
    "Missing demo status element."
  );
  const timelineName = assertElement(
    document.querySelector<HTMLElement>("[data-timeline-name]"),
    "Missing timeline name output element."
  );
  const clipCount = assertElement(
    document.querySelector<HTMLElement>("[data-clip-count]"),
    "Missing clip count output element."
  );
  const trackCount = assertElement(
    document.querySelector<HTMLElement>("[data-track-count]"),
    "Missing track count output element."
  );
  const transitionCount = assertElement(
    document.querySelector<HTMLElement>("[data-transition-count]"),
    "Missing transition count output element."
  );
  const schemaCount = assertElement(
    document.querySelector<HTMLElement>("[data-schema-count]"),
    "Missing schema count output element."
  );
  const clipList = assertElement(
    document.querySelector<HTMLElement>("[data-clip-list]"),
    "Missing clip list output element."
  );
  const trackList = assertElement(
    document.querySelector<HTMLElement>("[data-track-list]"),
    "Missing track list output element."
  );
  const transitionList = assertElement(
    document.querySelector<HTMLElement>("[data-transition-list]"),
    "Missing transition list output element."
  );
  const roundtripOutput = assertElement(
    document.querySelector<HTMLElement>("[data-roundtrip-json]"),
    "Missing roundtrip json output element."
  );

  samplePath.textContent = `${SAMPLE_OTIO_SOURCE} → ${SAMPLE_OTIO_PATH}`;
  status.textContent = "Loaded and roundtripped sample OTIO successfully.";
  timelineName.textContent = summary.timelineName;
  clipCount.textContent = String(summary.clipNames.length);
  trackCount.textContent = String(summary.trackNames.length);
  transitionCount.textContent = String(summary.transitionNames.length);
  schemaCount.textContent = String(summary.schemaCount);
  clipList.textContent = summary.clipNames.join(", ") || "None";
  trackList.textContent = summary.trackNames.join(", ") || "None";
  transitionList.textContent = summary.transitionNames.join(", ") || "None";
  roundtripOutput.textContent = roundtrippedJson;
}

function renderError(error: unknown): void {
  const status = document.querySelector<HTMLElement>("[data-demo-status]");
  const roundtripOutput = document.querySelector<HTMLElement>("[data-roundtrip-json]");

  if (status) {
    status.textContent =
      error instanceof Error ? error.message : `Demo failed: ${String(error)}`;
  }

  if (roundtripOutput) {
    roundtripOutput.textContent =
      error instanceof Error ? error.stack ?? error.message : String(error);
  }
}

async function main(): Promise<void> {
  const response = await fetch(SAMPLE_OTIO_PATH);
  if (!response.ok) {
    throw new Error(`Unable to load sample OTIO: ${response.status} ${response.statusText}`);
  }

  const sampleOtioJson = await response.text();
  const sampleDocument = JSON.parse(sampleOtioJson) as JSONObject;
  const summary = summarizeOtioDocument(sampleDocument);
  const otio = await loadOpenTimelineIO();
  const parsed = otio.parseJson(sampleOtioJson);

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
    !stringified.json.includes('"OTIO_SCHEMA": "Clip.2"') ||
    !stringified.json.includes('"name": "Clip-001"') ||
    !stringified.json.includes('"OTIO_SCHEMA": "MissingReference.1"')
  ) {
    throw new Error(
      "Browser MVP roundtrip output did not contain the expected sample clip data."
    );
  }

  renderSummary(summary, stringified.json);
  console.log("OTIO browser sample demo loaded tests/sample_data/clip_example.otio.");
}

main().catch((error: unknown) => {
  renderError(error);
  console.error(error);
  queueMicrotask(() => {
    throw error instanceof Error ? error : new Error(String(error));
  });
});
