import { ModulesContainer } from '@nestjs/core';
import { GraphQLFederationFactory } from '@nestjs/graphql';
import { GraphQLSchema } from 'graphql';
import { ApolloDriverConfig } from '../interfaces';
import { ApolloBaseDriver } from './apollo-base.driver';
/**
 * @publicApi
 */
export declare class ApolloFederationDriver extends ApolloBaseDriver {
    private readonly graphqlFederationFactory;
    private _subscriptionService?;
    private readonly pluginsExplorerService;
    constructor(graphqlFederationFactory: GraphQLFederationFactory, modulesContainer: ModulesContainer);
    start(options: ApolloDriverConfig): Promise<void>;
    generateSchema(options: ApolloDriverConfig): Promise<GraphQLSchema>;
}
//# sourceMappingURL=apollo-federation.driver.d.ts.map