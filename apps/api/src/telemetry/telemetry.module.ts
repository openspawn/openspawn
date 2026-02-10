import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { TelemetryService } from "./telemetry.service";
import { TelemetryMiddleware } from "./telemetry.middleware";

@Module({
  providers: [TelemetryService, TelemetryMiddleware],
  exports: [TelemetryService],
})
export class TelemetryModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TelemetryMiddleware).forRoutes("*");
  }
}
