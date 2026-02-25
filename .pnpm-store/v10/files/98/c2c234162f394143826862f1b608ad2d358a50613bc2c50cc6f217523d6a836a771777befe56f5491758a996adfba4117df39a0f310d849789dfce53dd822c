"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FetchFetcher = void 0;
const tslib_1 = require("tslib");
const auto_bind_1 = tslib_1.__importDefault(require("auto-bind"));
const fetcher_js_1 = require("./fetcher.js");
class FetchFetcher extends fetcher_js_1.FetcherRenderer {
    constructor(visitor) {
        super(visitor);
        this.visitor = visitor;
        (0, auto_bind_1.default)(this);
    }
    generateFetcherImplementation() {
        return `
function fetcher<TData, TVariables>(endpoint: string, requestInit: RequestInit, query: string, variables?: TVariables) {
  return async (): Promise<TData> => {
    const res = await fetch(endpoint, {
      method: 'POST',
      ...requestInit,
      body: JSON.stringify({ query, variables }),
    });

    const json = await res.json();

    if (json.errors) {
      const { message } = json.errors[0];

      throw new Error(message);
    }

    return json.data;
  }
}`;
    }
    generateInfiniteQueryHook(config, isSuspense = false) {
        const { generateBaseInfiniteQueryHook, variables, options } = this.generateInfiniteQueryHelper(config, isSuspense);
        const { documentVariableName, operationResultType, operationVariablesTypes } = config;
        return generateBaseInfiniteQueryHook({
            implArguments: `
      dataSource: { endpoint: string, fetchParams?: RequestInit },
      ${variables},
      ${options}
    `,
            implFetcher: `(metaData) => fetcher<${operationResultType}, ${operationVariablesTypes}>(dataSource.endpoint, dataSource.fetchParams || {}, ${documentVariableName}, {...variables, ...(metaData.pageParam ?? {})})()`,
        });
    }
    generateQueryHook(config, isSuspense = false) {
        const { generateBaseQueryHook, variables, options } = this.generateQueryHelper(config, isSuspense);
        const { documentVariableName, operationResultType, operationVariablesTypes } = config;
        return generateBaseQueryHook({
            implArguments: `
      dataSource: { endpoint: string, fetchParams?: RequestInit },
      ${variables},
      ${options}
    `,
            implFetcher: `fetcher<${operationResultType}, ${operationVariablesTypes}>(dataSource.endpoint, dataSource.fetchParams || {}, ${documentVariableName}, variables)`,
        });
    }
    generateMutationHook(config) {
        const { generateBaseMutationHook, variables, options } = this.generateMutationHelper(config);
        const { documentVariableName, operationResultType, operationVariablesTypes } = config;
        return generateBaseMutationHook({
            implArguments: `
      dataSource: { endpoint: string, fetchParams?: RequestInit },
      ${options}
    `,
            implFetcher: `(${variables}) => fetcher<${operationResultType}, ${operationVariablesTypes}>(dataSource.endpoint, dataSource.fetchParams || {}, ${documentVariableName}, variables)()`,
        });
    }
    generateFetcherFetch(config) {
        const { documentVariableName, operationResultType, operationVariablesTypes, operationName } = config;
        const variables = this.generateQueryVariablesSignature(config);
        return `\nuse${operationName}.fetcher = (dataSource: { endpoint: string, fetchParams?: RequestInit }, ${variables}) => fetcher<${operationResultType}, ${operationVariablesTypes}>(dataSource.endpoint, dataSource.fetchParams || {}, ${documentVariableName}, variables);`;
    }
}
exports.FetchFetcher = FetchFetcher;
