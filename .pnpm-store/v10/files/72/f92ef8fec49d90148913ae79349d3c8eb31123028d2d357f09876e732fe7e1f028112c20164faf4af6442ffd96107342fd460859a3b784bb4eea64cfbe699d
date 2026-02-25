import { GraphQLSchema, OperationDefinitionNode } from 'graphql';
import { Types } from '@graphql-codegen/plugin-helpers';
import { ClientSideBasePluginConfig, ClientSideBaseVisitor, LoadedFragment } from '@graphql-codegen/visitor-plugin-common';
import { BaseReactQueryPluginConfig, ReactQueryRawPluginConfig } from './config.cjs';
import { FetcherRenderer } from './fetcher.cjs';
export type ReactQueryPluginConfig = BaseReactQueryPluginConfig & ClientSideBasePluginConfig;
export declare class ReactQueryVisitor extends ClientSideBaseVisitor<ReactQueryRawPluginConfig, ReactQueryPluginConfig> {
    protected rawConfig: ReactQueryRawPluginConfig;
    private _externalImportPrefix;
    fetcher: FetcherRenderer;
    reactQueryHookIdentifiersInUse: Set<string>;
    reactQueryOptionsIdentifiersInUse: Set<string>;
    constructor(schema: GraphQLSchema, fragments: LoadedFragment[], rawConfig: ReactQueryRawPluginConfig, documents: Types.DocumentFile[]);
    get imports(): Set<string>;
    private createFetcher;
    get hasOperations(): boolean;
    getImports(): string[];
    getFetcherImplementation(): string;
    private _getHookSuffix;
    protected buildOperation(node: OperationDefinitionNode, documentVariableName: string, operationType: string, operationResultType: string, operationVariablesTypes: string, hasRequiredVariables: boolean): string;
}
