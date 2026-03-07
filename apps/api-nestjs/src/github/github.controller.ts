import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { GitHubService } from "./github.service";
import { IntegrationLinkService } from "./integration-link.service";
import { CreateGitHubConnectionDto } from "./dto/create-github-connection.dto";
import { UpdateGitHubConnectionDto } from "./dto/update-github-connection.dto";

@Controller("integrations/github/connections")
@UseGuards(AuthGuard)
export class GitHubController {
  constructor(
    private readonly githubService: GitHubService,
    private readonly linkService: IntegrationLinkService,
  ) {}

  @Post()
  async create(@Request() req: any, @Body() dto: CreateGitHubConnectionDto) {
    return this.githubService.create(req.user.orgId, dto);
  }

  @Get()
  async findAll(@Request() req: any) {
    return this.githubService.findByOrg(req.user.orgId);
  }

  @Get(":id")
  async findOne(@Request() req: any, @Param("id") id: string) {
    return this.githubService.findById(req.user.orgId, id);
  }

  @Patch(":id")
  async update(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateGitHubConnectionDto,
  ) {
    return this.githubService.update(req.user.orgId, id, dto);
  }

  @Delete(":id")
  async remove(@Request() req: any, @Param("id") id: string) {
    return this.githubService.remove(req.user.orgId, id);
  }

  @Post(":id/test")
  async test(@Request() req: any, @Param("id") id: string) {
    await this.githubService.findById(req.user.orgId, id); // auth check
    return this.githubService.testConnection(id);
  }

  @Get(":id/links")
  async getLinks(@Request() req: any, @Param("id") _id: string) {
    return this.linkService.findByOrg(req.user.orgId, "github");
  }
}
