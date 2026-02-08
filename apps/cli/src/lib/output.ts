let outputJson = false;

export function setJsonOutput(enabled: boolean): void {
  outputJson = enabled;
}

export function isJsonOutput(): boolean {
  return outputJson;
}

export function output(data: unknown): void {
  if (outputJson) {
    console.log(JSON.stringify(data, null, 2));
  } else if (typeof data === "string") {
    console.log(data);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

export function outputTable(headers: string[], rows: string[][]): void {
  if (outputJson) {
    const data = rows.map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h.toLowerCase().replace(/\s+/g, "_")] = row[i] ?? "";
      });
      return obj;
    });
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length)),
  );

  const headerLine = headers.map((h, i) => h.padEnd(widths[i] ?? 0)).join("  ");
  console.log(headerLine);
  console.log("-".repeat(headerLine.length));

  for (const row of rows) {
    console.log(
      row.map((cell, i) => (cell ?? "").padEnd(widths[i] ?? 0)).join("  "),
    );
  }
}

export function outputError(message: string): void {
  if (outputJson) {
    console.error(JSON.stringify({ error: message }));
  } else {
    console.error(`Error: ${message}`);
  }
}

export function outputSuccess(message: string): void {
  if (outputJson) {
    console.log(JSON.stringify({ success: true, message }));
  } else {
    console.log(`✓ ${message}`);
  }
}
