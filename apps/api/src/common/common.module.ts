import { Module } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";

import { IdempotencyKey, Nonce } from "@openspawn/database";

import { HttpExceptionFilter } from "./filters/http-exception.filter";
import { IdempotencyInterceptor } from "./interceptors/idempotency.interceptor";
import { CleanupTask } from "./tasks/cleanup.task";

@Module({
  imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([Nonce, IdempotencyKey])],
  providers: [
    CleanupTask,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
  ],
})
export class CommonModule {}
