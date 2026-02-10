import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { context, trace, SpanStatusCode } from "@opentelemetry/api";
import { TelemetryService } from "./telemetry.service";

@Injectable()
export class TelemetryMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TelemetryMiddleware.name);

  constructor(private readonly telemetryService: TelemetryService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const span = this.telemetryService.startSpan("http.request", {
      "http.method": req.method,
      "http.url": req.url,
      "http.route": req.route?.path || req.url,
      "http.user_agent": req.get("user-agent") || "",
    });

    const ctx = trace.setSpan(context.active(), span);

    res.on("finish", () => {
      const duration = Date.now() - startTime;
      
      span.setAttribute("http.status_code", res.statusCode);
      span.setAttribute("http.duration_ms", duration);

      if (res.statusCode >= 400) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `HTTP ${res.statusCode}`,
        });
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
      }

      span.end();
    });

    context.with(ctx, () => next());
  }
}
