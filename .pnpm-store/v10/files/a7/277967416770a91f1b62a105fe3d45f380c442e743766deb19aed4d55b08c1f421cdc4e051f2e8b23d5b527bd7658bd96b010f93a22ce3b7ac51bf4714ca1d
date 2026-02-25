"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLRequestClientFetcher = void 0;
const tslib_1 = require("tslib");
const auto_bind_1 = tslib_1.__importDefault(require("auto-bind"));
const fetcher_js_1 = require("./fetcher.js");
class GraphQLRequestClientFetcher extends fetcher_js_1.FetcherRenderer {
    constructor(visitor, config) {
        super(visitor);
        this.visitor = visitor;
        this.clientPath = typeof config === 'object' ? config.clientImportPath : null;
        (0, auto_bind_1.default)(this);
    }
    generateFetcherImplementation() {
        return this.clientPath
            ? `
function fetcher<TData, TVariables extends { [key: string]: any }>(query: string, variables?: TVariables, requestHeaders?: RequestInit['headers']) {
  return async (): Promise<TData> => graphqlClient.request({
    document: query,
    variables,
    requestHeaders
  });
}`
            : `
function fetcher<TData, TVariables extends { [key: string]: any }>(client: GraphQLClient, query: string, variables?: TVariables, requestHeaders?: RequestInit['headers']) {
  return async (): Promise<TData> => client.request({
    document: query,
    variables,
    requestHeaders
  });
}`;
    }
    generateInfiniteQueryHook(config, isSuspense = false) {
        const typeImport = this.visitor.config.useTypeImports ? 'import type' : 'import';
        if (this.clientPath)
            this.visitor.imports.add(this.clientPath);
        this.visitor.imports.add(`${typeImport} { GraphQLClient } from 'graphql-request';`);
        const { generateBaseInfiniteQueryHook, variables, options } = this.generateInfiniteQueryHelper(config, isSuspense);
        const { documentVariableName, operationResultType, operationVariablesTypes } = config;
        return this.clientPath
            ? generateBaseInfiniteQueryHook({
                implArguments: `
      pageParamKey: keyof ${operationVariablesTypes},
      ${variables},
      ${options},
      headers?: RequestInit['headers']
    `,
                implFetcher: `(metaData) => fetcher<${operationResultType}, ${operationVariablesTypes}>(${documentVariableName}, {...variables, [pageParamKey]: metaData.pageParam}, headers)()`,
            })
            : generateBaseInfiniteQueryHook({
                implArguments: `
      client: GraphQLClient,
      ${variables},
      ${options},
      headers?: RequestInit['headers']
    `,
                implFetcher: `(metaData) => fetcher<${operationResultType}, ${operationVariablesTypes}>(client, ${documentVariableName}, {...variables, ...(metaData.pageParam ?? {})}, headers)()`,
            });
    }
    generateQueryHook(config, isSuspense = false) {
        const typeImport = this.visitor.config.useTypeImports ? 'import type' : 'import';
        if (this.clientPath)
            this.visitor.imports.add(this.clientPath);
        this.visitor.imports.add(`${typeImport} { GraphQLClient } from 'graphql-request';`);
        this.visitor.imports.add(`${typeImport} { RequestInit } from 'graphql-request/dist/types.dom';`);
        const { generateBaseQueryHook, variables, options } = this.generateQueryHelper(config, isSuspense);
        const { documentVariableName, operationResultType, operationVariablesTypes } = config;
        return this.clientPath
            ? generateBaseQueryHook({
                implArguments: `
      ${variables},
      ${options},
      headers?: RequestInit['headers']
    `,
                implFetcher: `fetcher<${operationResultType}, ${operationVariablesTypes}>(${documentVariableName}, variables, headers)`,
            })
            : generateBaseQueryHook({
                implArguments: `
      client: GraphQLClient,
      ${variables},
      ${options},
      headers?: RequestInit['headers']
    `,
                implFetcher: `fetcher<${operationResultType}, ${operationVariablesTypes}>(client, ${documentVariableName}, variables, headers)`,
            });
    }
    generateMutationHook(config) {
        const typeImport = this.visitor.config.useTypeImports ? 'import type' : 'import';
        if (this.clientPath)
            this.visitor.imports.add(this.clientPath);
        this.visitor.imports.add(`${typeImport} { GraphQLClient } from 'graphql-request';`);
        const { generateBaseMutationHook, variables, options } = this.generateMutationHelper(config);
        const { documentVariableName, operationResultType, operationVariablesTypes } = config;
        return this.clientPath
            ? generateBaseMutationHook({
                implArguments: `
      ${options},
      headers?: RequestInit['headers']
    `,
                implFetcher: `(${variables}) => fetcher<${operationResultType}, ${operationVariablesTypes}>(${documentVariableName}, variables, headers)()`,
            })
            : generateBaseMutationHook({
                implArguments: `
      client: GraphQLClient,
      ${options},
      headers?: RequestInit['headers']
    `,
                implFetcher: `(${variables}) => fetcher<${operationResultType}, ${operationVariablesTypes}>(client, ${documentVariableName}, variables, headers)()`,
            });
    }
    generateFetcherFetch(config) {
        const { documentVariableName, operationResultType, operationVariablesTypes, operationName } = config;
        const variables = this.generateQueryVariablesSignature(config);
        const typeImport = this.visitor.config.useTypeImports ? 'import type' : 'import';
        if (this.clientPath)
            this.visitor.imports.add(this.clientPath);
        this.visitor.imports.add(`${typeImport} { RequestInit } from 'graphql-request/dist/types.dom';`);
        return this.clientPath
            ? `\nuse${operationName}.fetcher = (${variables}, headers?: RequestInit['headers']) => fetcher<${operationResultType}, ${operationVariablesTypes}>(${documentVariableName}, variables, headers);`
            : `\nuse${operationName}.fetcher = (client: GraphQLClient, ${variables}, headers?: RequestInit['headers']) => fetcher<${operationResultType}, ${operationVariablesTypes}>(client, ${documentVariableName}, variables, headers);`;
    }
}
exports.GraphQLRequestClientFetcher = GraphQLRequestClientFetcher;
