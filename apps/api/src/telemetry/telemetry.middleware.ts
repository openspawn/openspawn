import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { TelemetryService } from "./telemetry.service";

@Injectable()
export class TelemetryMiddleware implements NestMiddleware {
  constructor(private readonly telemetryService: TelemetryService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    if (!this.telemetryService.isEnabled) {
      next();
      return;
    }

    const operationName = `${req.method} ${req.path}`;
    const span = this.telemetryService.startSpan(operationName, {
      "http.method": req.method,
      "http.url": req.originalUrl,
      "http.user_agent": req.get("user-agent") || "unknown",
    });

    const startTime = Date.now();

    res.on("finish", () => {
      const durationMs = Date.now() - startTime;
      span.attributes["http.status_code"] = String(res.statusCode);
      this.telemetryService.endSpan(
        span,
        res.statusCode >= 400 ? "ERROR" : "OK",
      );
      this.telemetryService.recordLatency(operationName, durationMs);
      this.telemetryService.recordThroughput(operationName);

      if (res.statusCode >= 400) {
        this.telemetryService.recordError(
          operationName,
          `HTTP_${res.statusCode}`,
        );
      }
    });

    next();
  }
}
