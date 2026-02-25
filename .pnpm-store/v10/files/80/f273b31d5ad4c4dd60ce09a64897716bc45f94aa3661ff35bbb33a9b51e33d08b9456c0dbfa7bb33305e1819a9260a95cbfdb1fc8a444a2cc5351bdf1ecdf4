import { DirectiveNode } from "graphql";
import { FederationVersion } from "../../specifications/federation.js";
import { ArgumentKind, Deprecated, Description, InputObjectType } from "../../subgraph/state.js";
import { type MapByGraph, type TypeBuilder } from "./common.js";
export declare function inputObjectTypeBuilder(): TypeBuilder<InputObjectType, InputObjectTypeState>;
export interface InputObjectTypeState {
    kind: "input";
    name: string;
    tags: Set<string>;
    inaccessible: boolean;
    hasDefinition: boolean;
    description?: Description;
    byGraph: MapByGraph<InputObjectTypeStateInGraph>;
    fields: Map<string, InputObjectTypeFieldState>;
    ast: {
        directives: DirectiveNode[];
    };
}
export type InputObjectTypeFieldState = {
    name: string;
    type: string;
    kind: ArgumentKind;
    tags: Set<string>;
    inaccessible: boolean;
    cost: number | null;
    defaultValue?: string;
    description?: Description;
    deprecated?: Deprecated;
    byGraph: MapByGraph<InputObjectFieldStateInGraph>;
    ast: {
        directives: DirectiveNode[];
    };
};
type InputObjectTypeStateInGraph = {
    inaccessible: boolean;
    version: FederationVersion;
};
type InputObjectFieldStateInGraph = {
    type: string;
    inaccessible: boolean;
    defaultValue?: string;
    version: FederationVersion;
};
export {};
//# sourceMappingURL=input-object-type.d.ts.map