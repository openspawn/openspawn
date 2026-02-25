import { GraphQLError } from "graphql";
import { Directive, EnumType, InputObjectType, InterfaceType, ObjectType, ScalarType, SubgraphState, SubgraphType, UnionType } from "../state.cjs";
import { SubgraphValidationContext } from "./validation-context.cjs";
declare const SKIP: unique symbol;
export declare function validateSubgraphState(state: SubgraphState, context: SubgraphValidationContext): GraphQLError[];
export declare function isTypeSubTypeOf(state: SubgraphState, implementationsMap: Map<string, Set<string>>, maybeSubTypeName: string, superTypeName: string): boolean;
export declare function isInputType(state: SubgraphState, typeName: string): boolean | typeof SKIP;
export declare function typeExists(state: SubgraphState, typeName: string): boolean;
export declare function isInputObjectType(type: SubgraphType): type is InputObjectType;
export declare function isScalarType(type: SubgraphType): type is ScalarType;
export declare function isEnumType(type: SubgraphType): type is EnumType;
export declare function isObjectType(type: SubgraphType): type is ObjectType;
export declare function isInterfaceType(type: SubgraphType): type is InterfaceType;
export declare function isUnionType(type: SubgraphType): type is UnionType;
export declare function isDirective(type: SubgraphType): type is Directive;
export {};
//# sourceMappingURL=validate-state.d.ts.map