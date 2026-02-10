import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TelemetrySettings } from "./telemetry-settings";

describe("TelemetrySettings", () => {
  const mockConfig = {
    enabled: true,
    endpoint: "http://localhost:4318",
    serviceName: "openspawn-api",
    serviceVersion: "1.0.0",
  };

  it("renders telemetry configuration", () => {
    render(<TelemetrySettings config={mockConfig} />);

    expect(screen.getByText("Telemetry Configuration")).toBeInTheDocument();
    expect(screen.getByText("openspawn-api")).toBeInTheDocument();
    expect(screen.getByText("1.0.0")).toBeInTheDocument();
  });

  it("shows enabled status when telemetry is enabled", () => {
    render(<TelemetrySettings config={mockConfig} />);

    expect(screen.getByText("Enabled")).toBeInTheDocument();
  });

  it("shows disabled status when telemetry is disabled", () => {
    const disabledConfig = { ...mockConfig, enabled: false };
    render(<TelemetrySettings config={disabledConfig} />);

    expect(screen.getByText("Disabled")).toBeInTheDocument();
  });

  it("displays endpoint URL in input", () => {
    render(<TelemetrySettings config={mockConfig} />);

    const input = screen.getByLabelText("Endpoint URL") as HTMLInputElement;
    expect(input.value).toBe("http://localhost:4318");
  });

  it("handles null endpoint", () => {
    const configWithNullEndpoint = { ...mockConfig, endpoint: null };
    render(<TelemetrySettings config={configWithNullEndpoint} />);

    const input = screen.getByLabelText("Endpoint URL") as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("allows editing endpoint URL", () => {
    render(<TelemetrySettings config={mockConfig} />);

    const input = screen.getByLabelText("Endpoint URL") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "http://new-endpoint:4318" } });

    expect(input.value).toBe("http://new-endpoint:4318");
  });

  it("calls onSave when save button is clicked", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<TelemetrySettings config={mockConfig} onSave={onSave} />);

    const input = screen.getByLabelText("Endpoint URL") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "http://new-endpoint:4318" } });

    const saveButton = screen.getByText("Save Configuration");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        endpoint: "http://new-endpoint:4318",
      });
    });
  });

  it("shows saving state when saving", async () => {
    const onSave = vi.fn(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    render(<TelemetrySettings config={mockConfig} onSave={onSave} />);

    const saveButton = screen.getByText("Save Configuration");
    fireEvent.click(saveButton);

    expect(screen.getByText("Saving...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Save Configuration")).toBeInTheDocument();
    });
  });

  it("disables save button while saving", async () => {
    const onSave = vi.fn(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    render(<TelemetrySettings config={mockConfig} onSave={onSave} />);

    const saveButton = screen.getByText("Save Configuration") as HTMLButtonElement;
    fireEvent.click(saveButton);

    expect(saveButton.disabled).toBe(true);

    await waitFor(() => {
      expect(saveButton.disabled).toBe(false);
    });
  });

  it("displays information about OpenTelemetry", () => {
    render(<TelemetrySettings config={mockConfig} />);

    expect(
      screen.getByText("About OpenTelemetry Integration")
    ).toBeInTheDocument();
    expect(screen.getByText(/OpenSpawn uses OpenTelemetry/)).toBeInTheDocument();
  });

  it("shows environment variable hint", () => {
    render(<TelemetrySettings config={mockConfig} />);

    expect(screen.getByText(/OTEL_EXPORTER_OTLP_ENDPOINT/)).toBeInTheDocument();
  });

  it("renders without onSave callback", () => {
    render(<TelemetrySettings config={mockConfig} />);

    const saveButton = screen.getByText("Save Configuration");
    fireEvent.click(saveButton);

    // Should not crash when onSave is undefined
    expect(saveButton).toBeInTheDocument();
  });

  it("handles empty string as null endpoint", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<TelemetrySettings config={mockConfig} onSave={onSave} />);

    const input = screen.getByLabelText("Endpoint URL") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "" } });

    const saveButton = screen.getByText("Save Configuration");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({ endpoint: null });
    });
  });
});
