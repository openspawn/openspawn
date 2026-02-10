export interface TelemetryConfig {
  enabled: boolean;
  serviceName: string;
  serviceVersion: string;
  otlpEndpoint: string;
  otlpHeaders: Record<string, string>;
  environment: string;
  sampleRate: number;
}

export function getTelemetryConfig(): TelemetryConfig {
  const enabled = process.env["OPENTELEMETRY_ENABLED"] === "true";
  const serviceName =
    process.env["OPENTELEMETRY_SERVICE_NAME"] || "openspawn-api";
  const serviceVersion = process.env["OPENTELEMETRY_SERVICE_VERSION"] || "1.0.0";
  const otlpEndpoint =
    process.env["OPENTELEMETRY_OTLP_ENDPOINT"] ||
    "http://localhost:4318/v1/traces";
  const environment = process.env["NODE_ENV"] || "development";
  const sampleRate = parseFloat(
    process.env["OPENTELEMETRY_SAMPLE_RATE"] || "1.0",
  );

  // Parse OTLP headers from env (format: key1=value1,key2=value2)
  const headersStr = process.env["OPENTELEMETRY_OTLP_HEADERS"] || "";
  const otlpHeaders: Record<string, string> = {};
  if (headersStr) {
    headersStr.split(",").forEach((pair) => {
      const [key, value] = pair.split("=");
      if (key && value) {
        otlpHeaders[key.trim()] = value.trim();
      }
    });
  }

  return {
    enabled,
    serviceName,
    serviceVersion,
    otlpEndpoint,
    otlpHeaders,
    environment,
    sampleRate,
  };
}
