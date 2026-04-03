import createOpenTimelineIO, {
  type OTIOSerializableObjectHandle,
  type OpenTimelineIOWasmModule,
} from "./otio_wasm.js";

export interface OTIOErrorStatus {
  outcome: number;
  details: string;
  fullDescription: string;
}

export interface OTIOParseResult {
  ok: boolean;
  value?: OTIOSerializableObject;
  error?: OTIOErrorStatus;
}

export interface OTIOStringifyResult {
  ok: boolean;
  json?: string;
  error?: OTIOErrorStatus;
}

export class OTIOSerializableObject {
  constructor(private readonly handle: OTIOSerializableObjectHandle) {}

  get schemaName(): string {
    return this.handle.schemaName();
  }

  get schemaVersion(): number {
    return this.handle.schemaVersion();
  }

  dispose(): void {
    this.handle.delete();
  }

  _handle(): OTIOSerializableObjectHandle {
    return this.handle;
  }
}

function toErrorStatus(error: OTIOErrorStatus): OTIOErrorStatus {
  return {
    outcome: error.outcome,
    details: error.details,
    fullDescription: error.fullDescription,
  };
}

export class OpenTimelineIOBrowser {
  constructor(private readonly module: OpenTimelineIOWasmModule) {}

  parseJson(input: string): OTIOParseResult {
    const result = this.module.parseOtioJson(input);

    if (!result.ok) {
      return {
        ok: false,
        error: toErrorStatus(result.error),
      };
    }

    return {
      ok: true,
      value: new OTIOSerializableObject(result.value),
    };
  }

  stringifyJson(
    value: OTIOSerializableObject,
    indent = 4
  ): OTIOStringifyResult {
    const result = this.module.stringifyOtioJson(value._handle(), indent);

    if (!result.ok) {
      return {
        ok: false,
        error: toErrorStatus(result.error),
      };
    }

    return {
      ok: true,
      json: result.json,
    };
  }

  roundtripJson(input: string, indent = 4): OTIOStringifyResult {
    const result = this.module.roundtripOtioJson(input, indent);

    if (!result.ok) {
      return {
        ok: false,
        error: toErrorStatus(result.error),
      };
    }

    return {
      ok: true,
      json: result.json,
    };
  }
}

export async function loadOpenTimelineIO(
  moduleOverrides: Record<string, unknown> = {}
): Promise<OpenTimelineIOBrowser> {
  const module = await createOpenTimelineIO(moduleOverrides);
  return new OpenTimelineIOBrowser(module);
}
