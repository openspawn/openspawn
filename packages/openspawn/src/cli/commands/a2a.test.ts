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

    it("includes test subcommand in help", async () => {
      const logs: string[] = [];
      const origLog = console.log;
      console.log = (msg: string) => logs.push(msg);

      const { a2aCommand } = await import("./a2a.js");
      await a2aCommand([]);

      console.log = origLog;
      const output = logs.join("\n");
      expect(output).toContain("test");
      expect(output).toContain("compliance");
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

  describe("test subcommand", () => {
    it("exits with error when router is not running", async () => {
      const errors: string[] = [];
      const logs: string[] = [];
      const origError = console.error;
      const origLog = console.log;
      const origExit = process.exit;
      console.error = (msg: string) => errors.push(msg);
      console.log = (msg: string) => logs.push(msg);
      process.exit = ((code?: number) => { throw new Error(`exit:${code}`); }) as never;

      // Override A2A_URL to a port that's definitely not running
      const origEnv = process.env.A2A_URL;
      process.env.A2A_URL = "http://127.0.0.1:19876";

      // Dynamic import to pick up env change
      const mod = await import("./a2a.js");
      try {
        await mod.a2aCommand(["test", "http://127.0.0.1:19876"]);
      } catch {
        // expected — either process.exit or fetch error
      }

      console.error = origError;
      console.log = origLog;
      process.exit = origExit;
      if (origEnv !== undefined) {
        process.env.A2A_URL = origEnv;
      } else {
        delete process.env.A2A_URL;
      }

      // Should show compliance test header or error about router
      const allOutput = [...logs, ...errors].join("\n");
      expect(allOutput).toMatch(/A2A Compliance Test|Cannot reach|Could not register/);
    });

    it("accepts --self flag", async () => {
      const logs: string[] = [];
      const errors: string[] = [];
      const origLog = console.log;
      const origError = console.error;
      const origExit = process.exit;
      console.log = (msg: string) => logs.push(msg);
      console.error = (msg: string) => errors.push(msg);
      process.exit = ((code?: number) => { throw new Error(`exit:${code}`); }) as never;

      const { a2aCommand } = await import("./a2a.js");
      try {
        await a2aCommand(["test", "--self"]);
      } catch {
        // expected
      }

      console.log = origLog;
      console.error = origError;
      process.exit = origExit;

      const allOutput = [...logs, ...errors].join("\n");
      expect(allOutput).toMatch(/A2A Compliance Test|Cannot reach|Could not register/);
    });

    it("accepts a custom URL argument", async () => {
      const logs: string[] = [];
      const errors: string[] = [];
      const origLog = console.log;
      const origError = console.error;
      const origExit = process.exit;
      console.log = (msg: string) => logs.push(msg);
      console.error = (msg: string) => errors.push(msg);
      process.exit = ((code?: number) => { throw new Error(`exit:${code}`); }) as never;

      const { a2aCommand } = await import("./a2a.js");
      try {
        await a2aCommand(["test", "http://127.0.0.1:19877"]);
      } catch {
        // expected — router not running
      }

      console.log = origLog;
      console.error = origError;
      process.exit = origExit;

      const allOutput = [...logs, ...errors].join("\n");
      expect(allOutput).toContain("http://127.0.0.1:19877");
    });
  });
});
