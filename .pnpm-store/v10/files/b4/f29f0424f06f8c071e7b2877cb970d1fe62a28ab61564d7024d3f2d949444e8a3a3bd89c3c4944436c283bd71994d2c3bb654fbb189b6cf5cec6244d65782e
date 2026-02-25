import { ASTNode, ConstDirectiveNode, DirectiveDefinitionNode, DocumentNode, EnumTypeDefinitionNode, EnumValueDefinitionNode, FieldDefinitionNode, InputObjectTypeDefinitionNode, InputValueDefinitionNode, InterfaceTypeDefinitionNode, ObjectTypeDefinitionNode, ScalarTypeDefinitionNode, SchemaDefinitionNode, StringValueNode, UnionTypeDefinitionNode } from "graphql";
import { ArgumentKind } from "../../subgraph/state.cjs";
type inferArgument<T> = T extends (arg: infer A) => any ? A : never;
export type DirectiveAST = inferArgument<typeof createDirectiveNode>;
export type ObjectTypeAST = inferArgument<typeof createObjectTypeNode>;
export type FieldAST = inferArgument<typeof createFieldNode>;
export type FieldArgumentAST = inferArgument<typeof createFieldArgumentNode>;
export type InputFieldAST = inferArgument<typeof createInputFieldNode>;
export type EnumValueAST = inferArgument<typeof createEnumValueNode>;
export type JoinTypeAST = inferArgument<typeof createJoinTypeDirectiveNode>;
export type JoinImplementsAST = inferArgument<typeof createJoinImplementsDirectiveNode>;
export type JoinFieldAST = inferArgument<typeof createJoinFieldDirectiveNode>;
export type JoinUnionMemberAST = inferArgument<typeof createJoinUnionMemberDirectiveNode>;
export type JoinEnumValueAST = inferArgument<typeof createJoinEnumValueDirectiveNode>;
type Link = inferArgument<typeof createLinkDirectiveNode>;
type Cost = inferArgument<typeof createCostDirectiveNode>;
type ListSize = inferArgument<typeof createListSizeDirectiveNode>;
type DescriptionAST = inferArgument<typeof createDescriptionNode>;
type Deprecated = {
    reason?: string;
    deprecated: true;
};
export declare function createSchemaNode(schema: {
    query?: string;
    mutation?: string;
    subscription?: string;
    links?: Link[];
}): SchemaDefinitionNode;
export declare function createDirectiveNode(directive: {
    name: string;
    tags?: string[];
    arguments: FieldArgumentAST[];
    locations: string[];
    repeatable: boolean;
}): DirectiveDefinitionNode;
export declare function createObjectTypeNode(objectType: {
    name: string;
    fields: FieldAST[];
    interfaces?: string[];
    join?: {
        type?: JoinTypeAST[];
        implements?: JoinImplementsAST[];
    };
    tags?: string[];
    inaccessible?: boolean;
    authenticated?: boolean;
    policies?: string[][];
    scopes?: string[][];
    cost: Cost | null;
    description?: DescriptionAST;
    ast?: {
        directives?: ConstDirectiveNode[];
    };
}): ObjectTypeDefinitionNode;
export declare function createInterfaceTypeNode(interfaceType: {
    name: string;
    fields: FieldAST[];
    interfaces?: string[];
    join?: {
        type?: JoinTypeAST[];
        implements?: JoinImplementsAST[];
    };
    tags?: string[];
    inaccessible?: boolean;
    authenticated?: boolean;
    policies?: string[][];
    scopes?: string[][];
    description?: DescriptionAST;
    ast?: {
        directives?: ConstDirectiveNode[];
    };
}): InterfaceTypeDefinitionNode;
export declare function createInputObjectTypeNode(inputObjectType: {
    name: string;
    fields: InputFieldAST[];
    join?: {
        type?: JoinTypeAST[];
    };
    tags?: string[];
    inaccessible?: boolean;
    description?: DescriptionAST;
    ast?: {
        directives?: ConstDirectiveNode[];
    };
}): InputObjectTypeDefinitionNode;
export declare function createUnionTypeNode(unionType: {
    name: string;
    join?: {
        type?: JoinTypeAST[];
        unionMember?: JoinUnionMemberAST[];
    };
    members: string[];
    inaccessible?: boolean;
    description?: DescriptionAST;
    tags?: string[];
    ast?: {
        directives?: ConstDirectiveNode[];
    };
}): UnionTypeDefinitionNode;
export declare function createEnumTypeNode(enumType: {
    name: string;
    join?: {
        type?: JoinTypeAST[];
    };
    tags?: string[];
    inaccessible?: boolean;
    authenticated?: boolean;
    policies?: string[][];
    scopes?: string[][];
    cost: Cost | null;
    description?: DescriptionAST;
    values: EnumValueAST[];
    ast?: {
        directives?: ConstDirectiveNode[];
    };
}): EnumTypeDefinitionNode;
export declare function createScalarTypeNode(scalarType: {
    name: string;
    join?: {
        type?: JoinTypeAST[];
    };
    tags?: string[];
    inaccessible?: boolean;
    authenticated?: boolean;
    policies?: string[][];
    scopes?: string[][];
    cost: Cost | null;
    description?: DescriptionAST;
    specifiedBy?: string;
    ast?: {
        directives?: ConstDirectiveNode[];
    };
}): ScalarTypeDefinitionNode;
export declare function createJoinGraphEnumTypeNode(graphs: Array<{
    name: string;
    enumValue: string;
    url?: string;
}>): EnumTypeDefinitionNode;
declare function createFieldNode(field: {
    name: string;
    type: string;
    arguments?: FieldArgumentAST[];
    join?: {
        field?: JoinFieldAST[];
    };
    inaccessible?: boolean;
    cost: Cost | null;
    listSize: ListSize | null;
    tags?: string[];
    description?: DescriptionAST;
    deprecated?: Deprecated;
    ast?: {
        directives?: ConstDirectiveNode[];
    };
}): FieldDefinitionNode;
declare function createInputFieldNode(inputField: {
    name: string;
    type: string;
    defaultValue?: string;
    tags?: string[];
    inaccessible?: boolean;
    cost: Cost | null;
    description?: DescriptionAST;
    ast?: {
        directives?: ConstDirectiveNode[];
    };
    join?: {
        field?: JoinFieldAST[];
    };
}): InputValueDefinitionNode;
declare function createEnumValueNode(enumValue: {
    name: string;
    join?: {
        enumValue?: JoinEnumValueAST[];
    };
    tags?: string[];
    inaccessible?: boolean;
    description?: DescriptionAST;
    deprecated?: Deprecated;
    ast?: {
        directives?: ConstDirectiveNode[];
    };
}): EnumValueDefinitionNode;
declare function createFieldArgumentNode(argument: {
    name: string;
    type: string;
    kind: ArgumentKind;
    defaultValue?: string;
    inaccessible?: boolean;
    cost: Cost | null;
    tags?: string[];
    description?: DescriptionAST;
    deprecated?: Deprecated;
    ast?: {
        directives?: ConstDirectiveNode[];
    };
}): InputValueDefinitionNode;
declare function createJoinTypeDirectiveNode(join: {
    graph: string;
    key?: string;
    isInterfaceObject?: boolean;
    extension?: boolean;
    resolvable?: boolean;
}): ConstDirectiveNode;
declare function createJoinImplementsDirectiveNode(join: {
    graph: string;
    interface: string;
}): ConstDirectiveNode;
declare function createJoinFieldDirectiveNode(join: {
    graph?: string;
    type?: string;
    override?: string;
    overrideLabel?: string;
    usedOverridden?: boolean;
    external?: boolean;
    provides?: string;
    requires?: string;
}): ConstDirectiveNode;
declare function createJoinUnionMemberDirectiveNode(join: {
    graph: string;
    member: string;
}): ConstDirectiveNode;
declare function createJoinEnumValueDirectiveNode(join: {
    graph: string;
}): ConstDirectiveNode;
declare function createDescriptionNode(description: {
    value: string;
    block: boolean;
}): StringValueNode;
declare function createCostDirectiveNode(input: {
    cost: number;
    directiveName: string;
}): ConstDirectiveNode;
declare function createListSizeDirectiveNode(input: {
    assumedSize: number | null;
    slicingArguments: string[] | null;
    sizedFields: string[] | null;
    requireOneSlicingArgument: boolean;
    printRequireOneSlicingArgument: boolean;
    directiveName: string;
}): ConstDirectiveNode;
declare function createLinkDirectiveNode(link: {
    url: string;
    import?: Array<{
        name: string;
        alias?: string;
    }>;
    for?: string;
}): ConstDirectiveNode;
export declare function schemaCoordinate(paths: readonly (string | number)[], nodes: readonly (ASTNode | readonly ASTNode[])[]): string;
export declare function stripFederation(supergraph: DocumentNode): DocumentNode;
export {};
//# sourceMappingURL=ast.d.ts.map