import autoBind from 'auto-bind';
import { FetcherRenderer } from './fetcher.js';
export class HardcodedFetchFetcher extends FetcherRenderer {
    constructor(visitor, config) {
        super(visitor);
        this.visitor = visitor;
        this.config = config;
        autoBind(this);
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
