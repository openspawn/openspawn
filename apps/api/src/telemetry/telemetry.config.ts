export interface TelemetryConfig {
  serviceName: string;
  otlpEndpoint: string;
  enabled: boolean;
  sampleRate: number;
}

export function loadTelemetryConfig(): TelemetryConfig {
  return {
    serviceName: process.env["OTEL_SERVICE_NAME"] || "bikinibottom-api",
    otlpEndpoint:
      process.env["OTEL_EXPORTER_OTLP_ENDPOINT"] ||
      "http://localhost:4318",
    enabled: process.env["OTEL_ENABLED"] !== "false",
    sampleRate: parseFloat(process.env["OTEL_SAMPLE_RATE"] || "1.0"),
  };
}
