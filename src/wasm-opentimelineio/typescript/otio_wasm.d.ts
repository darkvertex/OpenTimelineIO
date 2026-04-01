export interface OTIOSerializableObjectHandle {
  delete(): void;
  isValid(): boolean;
  schemaName(): string;
  schemaVersion(): number;
}

export interface OTIOErrorStatusHandle {
  outcome: number;
  details: string;
  fullDescription: string;
}

export interface OTIOParseResultHandle {
  ok: boolean;
  value: OTIOSerializableObjectHandle;
  error: OTIOErrorStatusHandle;
}

export interface OTIOStringifyResultHandle {
  ok: boolean;
  json: string;
  error: OTIOErrorStatusHandle;
}

export interface OpenTimelineIOWasmModule {
  parseOtioJson(input: string): OTIOParseResultHandle;
  stringifyOtioJson(
    value: OTIOSerializableObjectHandle,
    indent?: number
  ): OTIOStringifyResultHandle;
  roundtripOtioJson(input: string, indent?: number): OTIOStringifyResultHandle;
}

declare function createOpenTimelineIO(
  moduleOverrides?: Record<string, unknown>
): Promise<OpenTimelineIOWasmModule>;

export default createOpenTimelineIO;
