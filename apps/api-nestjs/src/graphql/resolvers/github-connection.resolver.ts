import { Args, ID, Mutation, Query, Resolver } from "@nestjs/graphql";

import { OrgFromContext, validateOrgAccess } from "../../auth/decorators";
import { GitHubService } from "../../github";
import { IntegrationLinkService } from "../../github";
import {
  GitHubConnectionType,
  CreateGitHubConnectionInput,
  UpdateGitHubConnectionInput,
  IntegrationLinkType,
} from "../types";

@Resolver(() => GitHubConnectionType)
export class GitHubConnectionResolver {
  constructor(
    private readonly githubService: GitHubService,
    private readonly linkService: IntegrationLinkService,
  ) {}

  @Query(() => [GitHubConnectionType])
  async githubConnections(
    @Args("orgId", { type: () => ID }) orgId: string,
    @OrgFromContext() authenticatedOrgId?: string,
  ) {
    validateOrgAccess(orgId, authenticatedOrgId);
    return this.githubService.findByOrg(orgId);
  }

  @Query(() => GitHubConnectionType, { nullable: true })
  async githubConnection(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("id", { type: () => ID }) id: string,
    @OrgFromContext() authenticatedOrgId?: string,
  ) {
    validateOrgAccess(orgId, authenticatedOrgId);
    return this.githubService.findById(orgId, id);
  }

  @Mutation(() => GitHubConnectionType)
  async createGitHubConnection(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("input") input: CreateGitHubConnectionInput,
    @OrgFromContext() authenticatedOrgId?: string,
  ) {
    validateOrgAccess(orgId, authenticatedOrgId);
    return this.githubService.create(orgId, input as any);
  }

  @Mutation(() => GitHubConnectionType)
  async updateGitHubConnection(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("id", { type: () => ID }) id: string,
    @Args("input") input: UpdateGitHubConnectionInput,
    @OrgFromContext() authenticatedOrgId?: string,
  ) {
    validateOrgAccess(orgId, authenticatedOrgId);
    return this.githubService.update(orgId, id, input as any);
  }

  @Mutation(() => Boolean)
  async deleteGitHubConnection(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("id", { type: () => ID }) id: string,
    @OrgFromContext() authenticatedOrgId?: string,
  ) {
    validateOrgAccess(orgId, authenticatedOrgId);
    await this.githubService.remove(orgId, id);
    return true;
  }

  @Query(() => [IntegrationLinkType])
  async integrationLinks(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("provider", { nullable: true }) provider?: string,
    @OrgFromContext() authenticatedOrgId?: string,
  ) {
    validateOrgAccess(orgId, authenticatedOrgId);
    return this.linkService.findByOrg(orgId, provider);
  }
}
