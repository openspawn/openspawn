import { OperationDefinitionNode } from 'graphql';
import { ReactQueryVisitor } from './visitor.js';
export interface GenerateConfig {
    node: OperationDefinitionNode;
    documentVariableName: string;
    operationName: string;
    operationResultType: string;
    operationVariablesTypes: string;
    hasRequiredVariables: boolean;
}
interface GenerateBaseHookConfig {
    implArguments?: string;
    implHookOuter?: string;
    implFetcher: string;
}
type ReactQueryMethodMap = {
    [key: string]: {
        getHook: (operationName?: string) => string;
        getOptions: () => string;
        getOtherTypes?: () => {
            [key: string]: string;
        };
    };
};
export declare abstract class FetcherRenderer {
    protected visitor: ReactQueryVisitor;
    constructor(visitor: ReactQueryVisitor);
    abstract generateFetcherImplementation(): string;
    abstract generateFetcherFetch(config: GenerateConfig): string;
    protected abstract generateQueryHook(config: GenerateConfig, isSuspense?: boolean): string;
    protected abstract generateInfiniteQueryHook(config: GenerateConfig, isSuspense?: boolean): string;
    protected abstract generateMutationHook(config: GenerateConfig): string;
    createQueryMethodMap(isSuspense?: boolean): ReactQueryMethodMap;
    protected generateInfiniteQueryHelper(config: GenerateConfig, isSuspense: boolean): {
        generateBaseInfiniteQueryHook: (hookConfig: GenerateBaseHookConfig) => string;
        variables: string;
        options: string;
    };
    protected generateQueryHelper(config: GenerateConfig, isSuspense: boolean): {
        generateBaseQueryHook: (hookConfig: GenerateBaseHookConfig) => string;
        variables: string;
        options: string;
    };
    protected generateMutationHelper(config: GenerateConfig): {
        generateBaseMutationHook: (hookConfig: GenerateBaseHookConfig) => string;
        variables: string;
        options: string;
    };
    protected generateQueryVariablesSignature({ hasRequiredVariables, operationVariablesTypes, }: GenerateConfig): string;
    private generateQueryOptionsSignature;
    private generateInfiniteQueryVariablesSignature;
    private generateInfiniteQueryOptionsSignature;
    generateInfiniteQueryKey(config: GenerateConfig, isSuspense: boolean): string;
    generateInfiniteQueryOutput(config: GenerateConfig, isSuspense?: boolean): {
        hook: string;
        getKey: string;
        rootKey: string;
    };
    generateQueryKey(config: GenerateConfig, isSuspense: boolean): string;
    generateQueryOutput(config: GenerateConfig, isSuspense?: boolean): {
        hook: string;
        document: string;
        getKey: string;
        rootKey: string;
    };
    generateMutationKey({ node }: GenerateConfig): string;
    generateMutationOutput(config: GenerateConfig): {
        hook: string;
        getKey: string;
    };
    private generateInfiniteQueryFormattedParameters;
    private generateQueryFormattedParameters;
    private generateMutationFormattedParameters;
}
export {};
