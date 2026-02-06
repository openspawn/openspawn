import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Agent, Nonce } from "@openspawn/database";

import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";

@Module({
  imports: [TypeOrmModule.forFeature([Agent, Nonce])],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
