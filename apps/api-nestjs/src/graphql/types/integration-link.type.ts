import { Field, ID, ObjectType } from "@nestjs/graphql";
import { GraphQLScalarType } from "graphql";

const JSONScalar = new GraphQLScalarType({
  name: "JSON",
  description: "Arbitrary JSON value",
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral: (ast) => (ast as any).value,
});

@ObjectType()
export class IntegrationLinkType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  orgId!: string;

  @Field(() => String)
  provider!: string;

  @Field(() => String)
  sourceType!: string;

  @Field(() => String)
  sourceId!: string;

  @Field(() => String)
  targetType!: string;

  @Field(() => ID)
  targetId!: string;

  @Field(() => JSONScalar)
  metadata!: Record<string, unknown>;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  updatedAt!: Date;
}
