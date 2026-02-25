"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HardcodedFetchFetcher = void 0;
const tslib_1 = require("tslib");
const auto_bind_1 = tslib_1.__importDefault(require("auto-bind"));
const fetcher_js_1 = require("./fetcher.js");
class HardcodedFetchFetcher extends fetcher_js_1.FetcherRenderer {
    constructor(visitor, config) {
        super(visitor);
        this.visitor = visitor;
        this.config = config;
        (0, auto_bind_1.default)(this);
    }
    getEndpoint() {
        try {
            new URL(this.config.endpoint);
            return JSON.stringify(this.config.endpoint);
        }
        catch (e) {
            return `${this.config.endpoint} as string`;
        }
    }
    getFetchParams() {
        let fetchParamsPartial = '';
        if (this.config.fetchParams) {
            const fetchParamsString = typeof this.config.fetchParams === 'string'
                ? this.config.fetchParams
                : JSON.stringify(this.config.fetchParams);
            fetchParamsPartial = `\n    ...(${fetchParamsString}),`;
        }
        return `    method: "POST",${fetchParamsPartial}`;
    }
    generateFetcherImplementation() {
        return `
function fetcher<TData, TVariables>(query: string, variables?: TVariables) {
  return async (): Promise<TData> => {
    const res = await fetch(${this.getEndpoint()}, {
${this.getFetchParams()}
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
        const { generateBaseInfiniteQueryHook } = this.generateInfiniteQueryHelper(config, isSuspense);
        const { documentVariableName, operationResultType, operationVariablesTypes } = config;
        return generateBaseInfiniteQueryHook({
            implFetcher: `(metaData) => fetcher<${operationResultType}, ${operationVariablesTypes}>(${documentVariableName}, {...variables, ...(metaData.pageParam ?? {})})()`,
        });
    }
    generateQueryHook(config, isSuspense = false) {
        const { generateBaseQueryHook } = this.generateQueryHelper(config, isSuspense);
        const { documentVariableName, operationResultType, operationVariablesTypes } = config;
        return generateBaseQueryHook({
            implFetcher: `fetcher<${operationResultType}, ${operationVariablesTypes}>(${documentVariableName}, variables)`,
        });
    }
    generateMutationHook(config) {
        const { generateBaseMutationHook, variables } = this.generateMutationHelper(config);
        const { documentVariableName, operationResultType, operationVariablesTypes } = config;
        return generateBaseMutationHook({
            implFetcher: `(${variables}) => fetcher<${operationResultType}, ${operationVariablesTypes}>(${documentVariableName}, variables)()`,
        });
    }
    generateFetcherFetch(config) {
        const { documentVariableName, operationResultType, operationVariablesTypes, operationName } = config;
        const variables = this.generateQueryVariablesSignature(config);
        return `\nuse${operationName}.fetcher = (${variables}) => fetcher<${operationResultType}, ${operationVariablesTypes}>(${documentVariableName}, variables);`;
    }
}
exports.HardcodedFetchFetcher = HardcodedFetchFetcher;
