import { Controller, Get } from "@nestjs/common";

import { Public } from "../auth";

import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get("health")
  getHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  getData() {
    return this.appService.getData();
  }
}
