import { join } from "path";

import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";

import { AgentsModule } from "../agents";
import { CreditsModule } from "../credits";
import { EventsModule } from "../events";
import { MessagesModule } from "../messages";
import { TasksModule } from "../tasks";

import { PubSubProvider } from "./pubsub.provider";
import {
  AgentResolver,
  CreditResolver,
  DirectMessageResolver,
  EventResolver,
  MessageResolver,
  TaskResolver,
} from "./resolvers";

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "schema.gql"),
      sortSchema: true,
      subscriptions: {
        "graphql-ws": true,
      },
      playground: process.env["NODE_ENV"] !== "production",
      introspection: process.env["NODE_ENV"] !== "production",
      context: ({ req }: { req: unknown }) => ({ req }),
    }),
    AgentsModule,
    TasksModule,
    CreditsModule,
    EventsModule,
    MessagesModule,
  ],
  providers: [
    PubSubProvider,
    TaskResolver,
    AgentResolver,
    CreditResolver,
    EventResolver,
    MessageResolver,
    DirectMessageResolver,
  ],
  exports: [PubSubProvider],
})
export class GraphqlModule {}
