import { GraphQLError } from "graphql";
import type { SubgraphState } from "../../subgraph/state.cjs";
export type SupergraphValidationContext = ReturnType<typeof createSupergraphValidationContext>;
export declare function createSupergraphValidationContext(subgraphStates: Map<string, SubgraphState>): {
    subgraphStates: Map<string, SubgraphState>;
    graphIdToName(id: string): string;
    graphNameToId(name: string): string | null;
    reportError(error: GraphQLError): void;
    collectReportedErrors(): GraphQLError[];
};
//# sourceMappingURL=validation-context.d.ts.map