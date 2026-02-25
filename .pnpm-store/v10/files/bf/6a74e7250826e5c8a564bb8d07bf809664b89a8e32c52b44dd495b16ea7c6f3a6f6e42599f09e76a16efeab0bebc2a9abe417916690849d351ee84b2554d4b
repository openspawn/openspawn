import { GraphQLError } from "graphql";
import { ServiceDefinition } from "./types.js";
export declare function composeServices(services: ServiceDefinition[], __internal?: {
    disableValidationRules?: string[];
}): CompositionResult;
export type CompositionResult = CompositionFailure | CompositionSuccess;
export interface CompositionFailure {
    supergraphSdl?: undefined;
    errors: GraphQLError[];
}
export interface CompositionSuccess {
    supergraphSdl: string;
    publicSdl: string;
    errors?: undefined;
}
export declare function assertCompositionSuccess(compositionResult: CompositionResult, message?: string): asserts compositionResult is CompositionSuccess;
export declare function assertCompositionFailure(compositionResult: CompositionResult, message?: string): asserts compositionResult is CompositionFailure;
export declare function compositionHasErrors(compositionResult: CompositionResult): compositionResult is CompositionFailure;
//# sourceMappingURL=compose.d.ts.map