import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { LinearService } from "./linear.service";
import { IntegrationLinkService } from "../github/integration-link.service";
import { CreateLinearConnectionDto } from "./dto/create-linear-connection.dto";
import { UpdateLinearConnectionDto } from "./dto/update-linear-connection.dto";

@Controller("linear/connections")
@UseGuards(AuthGuard)
export class LinearController {
  constructor(private readonly linearService: LinearService, private readonly linkService: IntegrationLinkService) {}
  @Post() async create(@Request() req: any, @Body() dto: CreateLinearConnectionDto) { return this.linearService.create(req.user.orgId, dto); }
  @Get() async findAll(@Request() req: any) { return this.linearService.findByOrg(req.user.orgId); }
  @Get(":id") async findOne(@Request() req: any, @Param("id") id: string) { return this.linearService.findById(req.user.orgId, id); }
  @Patch(":id") async update(@Request() req: any, @Param("id") id: string, @Body() dto: UpdateLinearConnectionDto) { return this.linearService.update(req.user.orgId, id, dto); }
  @Delete(":id") async remove(@Request() req: any, @Param("id") id: string) { return this.linearService.remove(req.user.orgId, id); }
  @Post(":id/test") async test(@Request() req: any, @Param("id") id: string) { await this.linearService.findById(req.user.orgId, id); return this.linearService.testConnection(id); }
  @Get(":id/links") async getLinks(@Request() req: any, @Param("id") _id: string) { return this.linkService.findByOrg(req.user.orgId, "linear"); }
}
