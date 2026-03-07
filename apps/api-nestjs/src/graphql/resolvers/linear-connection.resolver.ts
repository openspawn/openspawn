import { Args, ID, Mutation, Query, Resolver } from "@nestjs/graphql";

import { OrgFromContext, validateOrgAccess } from "../../auth/decorators";
import { LinearService } from "../../linear";
import { IntegrationLinkService } from "../../github";
import {
  LinearConnectionType,
  CreateLinearConnectionInput,
  UpdateLinearConnectionInput,
} from "../types";

@Resolver(() => LinearConnectionType)
export class LinearConnectionResolver {
  constructor(
    private readonly linearService: LinearService,
    private readonly linkService: IntegrationLinkService,
  ) {}

  @Query(() => [LinearConnectionType])
  async linearConnections(
    @Args("orgId", { type: () => ID }) orgId: string,
    @OrgFromContext() authenticatedOrgId?: string,
  ) {
    validateOrgAccess(orgId, authenticatedOrgId);
    return this.linearService.findByOrg(orgId);
  }

  @Query(() => LinearConnectionType, { nullable: true })
  async linearConnection(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("id", { type: () => ID }) id: string,
    @OrgFromContext() authenticatedOrgId?: string,
  ) {
    validateOrgAccess(orgId, authenticatedOrgId);
    return this.linearService.findById(orgId, id);
  }

  @Mutation(() => LinearConnectionType)
  async createLinearConnection(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("input") input: CreateLinearConnectionInput,
    @OrgFromContext() authenticatedOrgId?: string,
  ) {
    validateOrgAccess(orgId, authenticatedOrgId);
    return this.linearService.create(orgId, input as any);
  }

  @Mutation(() => LinearConnectionType)
  async updateLinearConnection(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("id", { type: () => ID }) id: string,
    @Args("input") input: UpdateLinearConnectionInput,
    @OrgFromContext() authenticatedOrgId?: string,
  ) {
    validateOrgAccess(orgId, authenticatedOrgId);
    return this.linearService.update(orgId, id, input as any);
  }

  @Mutation(() => Boolean)
  async deleteLinearConnection(
    @Args("orgId", { type: () => ID }) orgId: string,
    @Args("id", { type: () => ID }) id: string,
    @OrgFromContext() authenticatedOrgId?: string,
  ) {
    validateOrgAccess(orgId, authenticatedOrgId);
    await this.linearService.remove(orgId, id);
    return true;
  }
}
