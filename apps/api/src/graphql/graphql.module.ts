import { join } from "path";

import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";

import { AgentsModule } from "../agents";
import { CreditsModule } from "../credits";
import { EventsModule } from "../events";
import { GitHubModule } from "../github";
import { LinearModule } from "../linear";
import { InboundWebhooksModule } from "../inbound-webhooks/inbound-webhooks.module";
import { MessagesModule } from "../messages";
import { TasksModule } from "../tasks";
import { WebhooksModule } from "../webhooks";

import { PubSubProvider } from "./pubsub.provider";
import {
  AgentResolver,
  CreditResolver,
  DirectMessageResolver,
  EventResolver,
  GitHubConnectionResolver,
  LinearConnectionResolver,
  InboundWebhookKeyResolver,
  MessageResolver,
  TaskResolver,
  WebhookResolver,
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
    WebhooksModule,
    InboundWebhooksModule,
    GitHubModule,
    LinearModule,
  ],
  providers: [
    PubSubProvider,
    TaskResolver,
    AgentResolver,
    CreditResolver,
    DirectMessageResolver,
    EventResolver,
    GitHubConnectionResolver,
    LinearConnectionResolver,
    InboundWebhookKeyResolver,
    MessageResolver,
    WebhookResolver,
  ],
  exports: [PubSubProvider],
})
export class GraphqlModule {}
