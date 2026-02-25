import { SupergraphState } from "../state.cjs";
import { DirectiveArgState, DirectiveState } from "./directive.cjs";
import { EnumTypeState } from "./enum-type.cjs";
import { InputObjectTypeFieldState, InputObjectTypeState } from "./input-object-type.cjs";
import { InterfaceTypeFieldState, InterfaceTypeState } from "./interface-type.cjs";
import { ObjectTypeFieldArgState, ObjectTypeFieldState, ObjectTypeState } from "./object-type.cjs";
export declare function visitSupergraphState(supergraphState: SupergraphState, visitors: Array<SupergraphVisitorMap>): void;
export interface SupergraphVisitorMap {
    ObjectType?(objectState: ObjectTypeState): void;
    ObjectTypeField?(objectState: ObjectTypeState, fieldState: ObjectTypeFieldState): void;
    ObjectTypeFieldArg?(objectState: ObjectTypeState, fieldState: ObjectTypeFieldState, argState: ObjectTypeFieldArgState): void;
    InterfaceTypeField?(interfaceState: InterfaceTypeState, fieldState: InterfaceTypeFieldState): void;
    EnumType?(enumState: EnumTypeState): void;
    InputObjectType?(inputObjectState: InputObjectTypeState): void;
    InputObjectTypeField?(inputObjectState: InputObjectTypeState, fieldState: InputObjectTypeFieldState): void;
    InterfaceType?(interfaceState: InterfaceTypeState): void;
    Directive?(directiveState: DirectiveState): void;
    DirectiveFieldArg?(directiveState: DirectiveState, directiveArgState: DirectiveArgState): void;
}
//# sourceMappingURL=visitor.d.ts.map