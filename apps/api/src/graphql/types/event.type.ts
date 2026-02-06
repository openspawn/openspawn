import { Field, ID, ObjectType, registerEnumType } from "@nestjs/graphql";

import { EventSeverity } from "@openspawn/shared-types";

registerEnumType(EventSeverity, { name: "EventSeverity" });

@ObjectType()
export class EventType {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  type!: string;

  @Field(() => ID)
  actorId!: string;

  @Field(() => String)
  entityType!: string;

  @Field(() => ID)
  entityId!: string;

  @Field(() => EventSeverity)
  severity!: EventSeverity;

  @Field(() => String, { nullable: true })
  reasoning?: string | null;

  @Field(() => Date)
  createdAt!: Date;
}
