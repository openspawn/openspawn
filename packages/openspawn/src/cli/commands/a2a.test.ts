import { describe, it, expect } from "vitest";

// We test the exported a2aCommand by mocking fetch and capturing console output
describe("a2a CLI", () => {
  // Since the CLI uses global fetch and process.exit, we test the output format
  // and argument parsing logic through integration-style tests

  describe("help output", () => {
    it("prints help with no args", async () => {
      const logs: string[] = [];
      const origLog = console.log;
      console.log = (msg: string) => logs.push(msg);

      const { a2aCommand } = await import("./a2a.js");
      await a2aCommand([]);

      console.log = origLog;
      const output = logs.join("\n");
      expect(output).toContain("openspawn a2a");
      expect(output).toContain("send");
      expect(output).toContain("agents");
      expect(output).toContain("tasks");
    });

    it("prints help with --help flag", async () => {
      const logs: string[] = [];
      const origLog = console.log;
      console.log = (msg: string) => logs.push(msg);

      const { a2aCommand } = await import("./a2a.js");
      await a2aCommand(["--help"]);

      console.log = origLog;
      const output = logs.join("\n");
      expect(output).toContain("openspawn a2a");
    });
  });

  describe("register subcommand", () => {
    it("prints registration instructions", async () => {
      const logs: string[] = [];
      const origLog = console.log;
      console.log = (msg: string) => logs.push(msg);

      const { a2aCommand } = await import("./a2a.js");
      await a2aCommand(["register"]);

      console.log = origLog;
      const output = logs.join("\n");
      expect(output).toContain("curl");
      expect(output).toContain("/a2a/agents");
    });
  });

  describe("unknown subcommand", () => {
    it("reports unknown subcommand", async () => {
      const errors: string[] = [];
      const origError = console.error;
      const origLog = console.log;
      const origExit = process.exit;
      console.error = (msg: string) => errors.push(msg);
      console.log = () => { /* noop */ };
      process.exit = (() => { throw new Error("exit"); }) as never;

      const { a2aCommand } = await import("./a2a.js");
      try {
        await a2aCommand(["bogus"]);
      } catch {
        // expected
      }

      console.error = origError;
      console.log = origLog;
      process.exit = origExit;

      expect(errors.some((e) => e.includes("Unknown a2a subcommand"))).toBe(true);
    });
  });
});
