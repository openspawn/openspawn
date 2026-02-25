import { SetMetadata } from "@nestjs/common";

import type { AgentRole } from "@openspawn/shared-types";

export const ROLES_KEY = "roles";
export const Roles = (...roles: AgentRole[]) => SetMetadata(ROLES_KEY, roles);
