import { Injectable } from "@nestjs/common";
import { PubSub } from "graphql-subscriptions";

export const PUBSUB_TOKEN = "PUBSUB";

// Subscription event names
export const TASK_UPDATED = "taskUpdated";
export const CREDIT_TRANSACTION_CREATED = "creditTransactionCreated";
export const EVENT_CREATED = "eventCreated";
export const MESSAGE_CREATED = "messageCreated";

@Injectable()
export class PubSubProvider {
  private readonly pubSub: PubSub;

  constructor() {
    this.pubSub = new PubSub();
  }

  get instance(): PubSub {
    return this.pubSub;
  }

  publish(trigger: string, payload: Record<string, unknown>): Promise<void> {
    return this.pubSub.publish(trigger, payload);
  }

  asyncIterableIterator<T>(triggers: string | string[]): AsyncIterableIterator<T> {
    return this.pubSub.asyncIterableIterator<T>(triggers);
  }
}
