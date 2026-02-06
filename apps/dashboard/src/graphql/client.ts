import { Client, cacheExchange, fetchExchange, subscriptionExchange } from "@urql/core";
import { createClient as createWSClient } from "graphql-ws";

const wsClient = createWSClient({
  url: import.meta.env.VITE_WS_URL || "ws://localhost:3000/graphql",
});

export const client = new Client({
  url: import.meta.env.VITE_API_URL || "http://localhost:3000/graphql",
  exchanges: [
    cacheExchange,
    fetchExchange,
    subscriptionExchange({
      forwardSubscription: (operation) => ({
        subscribe: (sink) => ({
          unsubscribe: wsClient.subscribe(operation, sink),
        }),
      }),
    }),
  ],
});
