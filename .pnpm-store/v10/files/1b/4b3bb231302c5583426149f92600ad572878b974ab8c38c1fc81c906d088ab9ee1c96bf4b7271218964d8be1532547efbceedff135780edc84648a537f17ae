import { ASTVisitor, DirectiveNode, DocumentNode, DirectiveLocation } from "graphql";
import { TypeNodeInfo } from "../graphql/type-node-info.js";
import { FederationVersion } from "../specifications/federation.js";
import { Link, LinkImport } from "../specifications/link.js";
export type SubgraphType = ObjectType | InterfaceType | InputObjectType | UnionType | EnumType | ScalarType | Directive;
export declare enum TypeKind {
    OBJECT = "OBJECT",
    INTERFACE = "INTERFACE",
    ENUM = "ENUM",
    UNION = "UNION",
    SCALAR = "SCALAR",
    INPUT_OBJECT = "INPUT_OBJECT",
    DIRECTIVE = "DIRECTIVE"
}
export declare enum ArgumentKind {
    SCALAR = "SCALAR",
    OBJECT = "OBJECT",
    ENUM = "ENUM"
}
export interface Directive {
    kind: TypeKind.DIRECTIVE;
    name: string;
    composed: boolean;
    isExecutable: boolean;
    repeatable: boolean;
    locations: Set<string>;
    args: Map<string, Argument>;
}
export interface ScalarType {
    kind: TypeKind.SCALAR;
    name: string;
    inaccessible: boolean;
    policies: string[][];
    scopes: string[][];
    authenticated: boolean;
    cost: number | null;
    tags: Set<string>;
    description?: Description;
    specifiedBy?: string;
    ast: {
        directives: DirectiveNode[];
    };
}
export interface ObjectType {
    kind: TypeKind.OBJECT;
    name: string;
    fields: Map<string, Field>;
    extension: boolean;
    extensionType?: "@extends" | "extend";
    external: boolean;
    keys: Key[];
    fieldsUsedAsKeys: Set<string>;
    inaccessible: boolean;
    authenticated: boolean;
    policies: string[][];
    scopes: string[][];
    cost: number | null;
    shareable: boolean;
    tags: Set<string>;
    interfaces: Set<string>;
    isDefinition: boolean;
    description?: Description;
    deprecated?: Deprecated;
    ast: {
        directives: DirectiveNode[];
    };
}
export interface InterfaceType {
    kind: TypeKind.INTERFACE;
    name: string;
    fields: Map<string, Field>;
    fieldsUsedAsKeys: Set<string>;
    extension: boolean;
    keys: Key[];
    inaccessible: boolean;
    tags: Set<string>;
    interfaces: Set<string>;
    isDefinition: boolean;
    isInterfaceObject: boolean;
    description?: Description;
    implementedBy: Set<string>;
    ast: {
        directives: DirectiveNode[];
    };
}
export interface InputObjectType {
    kind: TypeKind.INPUT_OBJECT;
    name: string;
    fields: Map<string, InputField>;
    extension: boolean;
    inaccessible: boolean;
    tags: Set<string>;
    isDefinition: boolean;
    description?: Description;
    ast: {
        directives: DirectiveNode[];
    };
}
export interface UnionType {
    kind: TypeKind.UNION;
    name: string;
    members: Set<string>;
    tags: Set<string>;
    inaccessible: boolean;
    isDefinition: boolean;
    description?: Description;
    ast: {
        directives: DirectiveNode[];
    };
}
export interface EnumType {
    kind: TypeKind.ENUM;
    name: string;
    values: Map<string, EnumValue>;
    inaccessible: boolean;
    authenticated: boolean;
    policies: string[][];
    scopes: string[][];
    cost: number | null;
    tags: Set<string>;
    isDefinition: boolean;
    description?: Description;
    referencedByInputType: boolean;
    referencedByOutputType: boolean;
    inputTypeReferences: Set<string>;
    outputTypeReferences: Set<string>;
    ast: {
        directives: DirectiveNode[];
    };
}
export interface Field {
    name: string;
    type: string;
    isLeaf: boolean;
    args: Map<string, Argument>;
    external: boolean;
    inaccessible: boolean;
    authenticated: boolean;
    policies: string[][];
    scopes: string[][];
    cost: number | null;
    listSize: ListSize | null;
    override: string | null;
    overrideLabel: string | null;
    provides: string | null;
    requires: string | null;
    extension: boolean;
    required: boolean;
    provided: boolean;
    shareable: boolean;
    usedAsKey: boolean;
    used: boolean;
    tags: Set<string>;
    description?: Description;
    deprecated?: Deprecated;
    ast: {
        directives: DirectiveNode[];
    };
}
export interface InputField {
    name: string;
    type: string;
    kind: ArgumentKind;
    inaccessible: boolean;
    tags: Set<string>;
    cost: number | null;
    defaultValue?: string;
    description?: Description;
    deprecated?: Deprecated;
    ast: {
        directives: DirectiveNode[];
    };
}
export interface EnumValue {
    name: string;
    inaccessible: boolean;
    tags: Set<string>;
    description?: Description;
    deprecated?: Deprecated;
    ast: {
        directives: DirectiveNode[];
    };
}
export interface Argument {
    name: string;
    type: string;
    kind: ArgumentKind;
    inaccessible: boolean;
    tags: Set<string>;
    cost: number | null;
    defaultValue?: string;
    description?: Description;
    deprecated?: Deprecated;
    ast: {
        directives: DirectiveNode[];
    };
}
export interface Key {
    fields: string;
    resolvable: boolean;
}
export interface Description {
    value: string;
    block: boolean;
}
export interface Deprecated {
    reason?: string;
    deprecated: true;
}
export type ListSize = {
    printRequireOneSlicingArgument: boolean;
    assumedSize: number | null;
    slicingArguments: string[] | null;
    sizedFields: string[] | null;
    requireOneSlicingArgument: boolean;
};
export interface SubgraphState {
    graph: {
        id: string;
        name: string;
        version: FederationVersion;
        url?: string;
    };
    types: Map<string, SubgraphType>;
    schema: {
        queryType?: string;
        mutationType?: string;
        subscriptionType?: string;
    };
    links: readonly Link[];
    specs: {
        tag: boolean;
        inaccessible: boolean;
        cost: {
            used: boolean;
            names: {
                cost: string | null;
                listSize: string | null;
            };
        };
        link: boolean;
        policy: boolean;
        requiresScopes: boolean;
        authenticated: boolean;
    };
    federation: {
        version: FederationVersion;
        imports: readonly LinkImport[];
    };
}
export type SubgraphStateBuilder = ReturnType<typeof createSubgraphStateBuilder>;
export declare function createSubgraphStateBuilder(graph: {
    id: string;
    name: string;
    url?: string;
}, typeDefs: DocumentNode, version: FederationVersion, links: readonly Link[]): {
    isInterfaceObject: (typeName: string) => boolean;
    directive: {
        setComposed(directiveName: string): void;
        setLocation(directiveName: string, location: string): void;
        setRepeatable(directiveName: string): void;
        arg: {
            setTag(directiveName: string, argName: string, tag: string): void;
            setType(directiveName: string, argName: string, argType: string): void;
            setKind(directiveName: string, argName: string, argKind: ArgumentKind): void;
            setDirective(typeName: string, argName: string, directive: DirectiveNode): void;
            setDefaultValue(typeName: string, argName: string, defaultValue: string): void;
            setInaccessible(typeName: string, argName: string): void;
        };
    };
    scalarType: {
        setDefinition(typeName: string): void;
        setInaccessible(typeName: string): void;
        setAuthenticated(typeName: string): void;
        setPolicies(typeName: string, policies: string[][]): void;
        setScopes(typeName: string, scopes: string[][]): void;
        setCost(typeName: string, cost: number): void;
        setTag(typeName: string, tag: string): void;
        setDirective(typeName: string, directive: DirectiveNode): void;
        setDescription(typeName: string, description: Description): void;
        setSpecifiedBy(typeName: string, url: string): void;
    };
    objectType: {
        setDefinition(typeName: string): void;
        setExtension(typeName: string, extensionType: "@extends" | "extend"): void;
        setDescription(typeName: string, description: Description): void;
        setExternal(typeName: string): void;
        setInterface(typeName: string, interfaceName: string): void;
        setKey(typeName: string, fields: string, fieldsUsedInKey: Set<string>, resolvable: boolean): void;
        setInaccessible(typeName: string): void;
        setAuthenticated(typeName: string): void;
        setPolicies(typeName: string, policies: string[][]): void;
        setScopes(typeName: string, scopes: string[][]): void;
        setCost(typeName: string, cost: number): void;
        setShareable(typeName: string): void;
        setTag(typeName: string, tag: string): void;
        setDirective(typeName: string, directive: DirectiveNode): void;
        field: {
            setType(typeName: string, fieldName: string, fieldType: string): void;
            setLeaf(typeName: string, fieldName: string): void;
            setExtension(typeName: string, fieldName: string): void;
            setDirective(typeName: string, fieldName: string, directive: DirectiveNode): void;
            setDescription(typeName: string, fieldName: string, description: Description): void;
            setDeprecated(typeName: string, fieldName: string, reason?: string): void;
            setAuthenticated(typeName: string, fieldName: string): void;
            setPolicies(typeName: string, fieldName: string, policies: string[][]): void;
            setScopes(typeName: string, fieldName: string, scopes: string[][]): void;
            setCost(typeName: string, fieldName: string, cost: number): void;
            setListSize(typeName: string, fieldName: string, listSize: ListSize): void;
            setExternal(typeName: string, fieldName: string): void;
            setInaccessible(typeName: string, fieldName: string): void;
            setOverride(typeName: string, fieldName: string, override: string, label: string | null): void;
            setProvides(typeName: string, fieldName: string, provides: string): void;
            setRequires(typeName: string, fieldName: string, requires: string): void;
            markAsProvided(typeName: string, fieldName: string): void;
            markedAsRequired(typeName: string, fieldName: string): void;
            setShareable(typeName: string, fieldName: string): void;
            setTag(typeName: string, fieldName: string, tag: string): void;
            setUsed(typeName: string, fieldName: string): void;
            arg: {
                setType(typeName: string, fieldName: string, argName: string, argType: string): void;
                setKind(typeName: string, fieldName: string, argName: string, argKind: ArgumentKind): void;
                setDescription(typeName: string, fieldName: string, argName: string, description: Description): void;
                setDeprecated(typeName: string, fieldName: string, argName: string, reason?: string): void;
                setDirective(typeName: string, fieldName: string, argName: string, directive: DirectiveNode): void;
                setDefaultValue(typeName: string, fieldName: string, argName: string, defaultValue: string): void;
                setInaccessible(typeName: string, fieldName: string, argName: string): void;
                setTag(typeName: string, fieldName: string, argName: string, tag: string): void;
                setCost(typeName: string, fieldName: string, argName: string, cost: number): void;
            };
        };
    };
    interfaceType: {
        setDefinition(typeName: string): void;
        setExtension(typeName: string): void;
        setInterface(typeName: string, interfaceName: string): void;
        setInterfaceObject(typeName: string): void;
        setKey(typeName: string, fields: string, fieldsUsedInKey: Set<string>, resolvable: boolean): void;
        setInaccessible(typeName: string): void;
        setTag(typeName: string, tag: string): void;
        setDirective(typeName: string, directive: DirectiveNode): void;
        setDescription(typeName: string, description: Description): void;
        field: {
            setType(typeName: string, fieldName: string, fieldType: string): void;
            setLeaf(typeName: string, fieldName: string): void;
            setExternal(typeName: string, fieldName: string): void;
            setInaccessible(typeName: string, fieldName: string): void;
            setAuthenticated(typeName: string, fieldName: string): void;
            setPolicies(typeName: string, fieldName: string, policies: string[][]): void;
            setScopes(typeName: string, fieldName: string, scopes: string[][]): void;
            setCost(typeName: string, fieldName: string, cost: number): void;
            setListSize(typeName: string, fieldName: string, listSize: ListSize): void;
            setOverride(typeName: string, fieldName: string, override: string, label: string | null): void;
            setRequires(typeName: string, fieldName: string, requires: string): void;
            setShareable(typeName: string, fieldName: string): void;
            setTag(typeName: string, fieldName: string, tag: string): void;
            setUsed(typeName: string, fieldName: string): void;
            setDirective(typeName: string, fieldName: string, directive: DirectiveNode): void;
            setDescription(typeName: string, fieldName: string, description: Description): void;
            setDeprecated(typeName: string, fieldName: string, reason?: string): void;
            arg: {
                setType(typeName: string, fieldName: string, argName: string, argType: string): void;
                setKind(typeName: string, fieldName: string, argName: string, argKind: ArgumentKind): void;
                setDefaultValue(typeName: string, fieldName: string, argName: string, defaultValue: string): void;
                setDeprecated(typeName: string, fieldName: string, argName: string, reason?: string): void;
                setDescription(typeName: string, fieldName: string, argName: string, description: Description): void;
                setTag(typeName: string, fieldName: string, argName: string, tag: string): void;
                setInaccessible(typeName: string, fieldName: string, argName: string): void;
                setCost(typeName: string, fieldName: string, argName: string, cost: number): void;
                setDirective(typeName: string, fieldName: string, argName: string, directive: DirectiveNode): void;
            };
        };
    };
    inputObjectType: {
        setDefinition(typeName: string): void;
        setExtension(typeName: string): void;
        setDescription(typeName: string, description: Description): void;
        setInaccessible(typeName: string): void;
        setDirective(typeName: string, directive: DirectiveNode): void;
        setTag(typeName: string, tag: string): void;
        field: {
            setType(typeName: string, fieldName: string, fieldType: string): void;
            setKind(typeName: string, fieldName: string, fieldKind: ArgumentKind): void;
            setDescription(typeName: string, fieldName: string, description: Description): void;
            setDeprecated(typeName: string, fieldName: string, reason?: string): void;
            setDefaultValue(typeName: string, fieldName: string, defaultValue: string): void;
            setInaccessible(typeName: string, fieldName: string): void;
            setTag(typeName: string, fieldName: string, tag: string): void;
            setDirective(typeName: string, fieldName: string, directive: DirectiveNode): void;
            setCost(typeName: string, fieldName: string, cost: number): void;
        };
    };
    unionType: {
        setDefinition(typeName: string): void;
        setInaccessible(typeName: string): void;
        setTag(typeName: string, tag: string): void;
        setDescription(typeName: string, description: Description): void;
        setMember(typeName: string, member: string): void;
        setDirective(typeName: string, directive: DirectiveNode): void;
    };
    enumType: {
        setDefinition(typeName: string): void;
        setInaccessible(typeName: string): void;
        setAuthenticated(typeName: string): void;
        setPolicies(typeName: string, policies: string[][]): void;
        setScopes(typeName: string, scopes: string[][]): void;
        setCost(typeName: string, cost: number): void;
        setDescription(typeName: string, description: Description): void;
        setTag(typeName: string, tag: string): void;
        setReferencedByInputType(typeName: string, schemaCoordinate: string): void;
        setReferencedByOutputType(typeName: string, schemaCoordinate: string): void;
        setDirective(typeName: string, directive: DirectiveNode): void;
        value: {
            setValue(typeName: string, valueName: string): void;
            setDescription(typeName: string, valueName: string, description: Description): void;
            setDirective(typeName: string, valueName: string, directive: DirectiveNode): void;
            setInaccessible(typeName: string, valueName: string): void;
            setTag(typeName: string, valueName: string, tag: string): void;
            setDeprecated(typeName: string, valueName: string, reason?: string): void;
        };
    };
    composedDirectives: Set<string>;
    state: SubgraphState;
    markCostSpecAsUsed(directive: keyof SubgraphState["specs"]["cost"]["names"], name: string): void;
    markSpecAsUsed(specName: Exclude<keyof SubgraphState["specs"], "cost">): void;
    visitor(typeNodeInfo: TypeNodeInfo): ASTVisitor;
};
export declare function cleanSubgraphStateFromFederationSpec(state: SubgraphState): SubgraphState;
export declare function cleanSubgraphStateFromLinkSpec(state: SubgraphState): SubgraphState;
export declare function isExecutableDirectiveLocation(location: string | DirectiveLocation): boolean;
//# sourceMappingURL=state.d.ts.map