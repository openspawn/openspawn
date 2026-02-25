import { ASTNode, ASTVisitor, DirectiveDefinitionNode, EnumValueDefinitionNode, FieldDefinitionNode, InputValueDefinitionNode, TypeDefinitionNode, TypeExtensionNode } from "graphql";
type Maybe<T> = T | null | undefined;
export declare class TypeNodeInfo {
    private _type;
    private _field;
    private _arg;
    private _value;
    constructor();
    get [Symbol.toStringTag](): string;
    getTypeDef(): Maybe<DirectiveDefinitionNode | TypeDefinitionNode | TypeExtensionNode>;
    getFieldDef(): Maybe<FieldDefinitionNode | InputValueDefinitionNode>;
    getArgumentDef(): Maybe<InputValueDefinitionNode>;
    getValueDef(): Maybe<EnumValueDefinitionNode>;
    enter(node: ASTNode): void;
    leave(node: ASTNode): void;
}
export declare function visitWithTypeNodeInfo(typeInfo: TypeNodeInfo, visitor: ASTVisitor): ASTVisitor;
export {};
//# sourceMappingURL=type-node-info.d.ts.map