"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSupergraph = validateSupergraph;
const visitor_js_1 = require("../composition/visitor.js");
const auth_on_requires_rule_js_1 = require("./rules/auth-on-requires-rule.js");
const default_value_uses_inaccessible_rule_js_1 = require("./rules/default-value-uses-inaccessible-rule.js");
const directive_composition_rule_js_1 = require("./rules/directive-composition-rule.js");
const enum_values_rule_js_1 = require("./rules/enum-values-rule.js");
const extension_with_base_js_1 = require("./rules/extension-with-base.js");
const external_argument_missing_rule_js_1 = require("./rules/external-argument-missing-rule.js");
const external_missing_on_base_rule_js_1 = require("./rules/external-missing-on-base-rule.js");
const external_type_mismatch_rule_js_1 = require("./rules/external-type-mismatch-rule.js");
const field_argument_default_mismatch_rule_js_1 = require("./rules/field-argument-default-mismatch-rule.js");
const field_arguments_of_the_same_type_rule_js_1 = require("./rules/field-arguments-of-the-same-type-rule.js");
const fields_of_the_same_type_rule_js_1 = require("./rules/fields-of-the-same-type-rule.js");
const input_field_default_mismatch_rule_js_1 = require("./rules/input-field-default-mismatch-rule.js");
const input_object_values_rule_js_1 = require("./rules/input-object-values-rule.js");
const interface_field_no_implementation_rule_js_1 = require("./rules/interface-field-no-implementation-rule.js");
const interface_key_missing_implementation_type_js_1 = require("./rules/interface-key-missing-implementation-type.js");
const interface_object_usage_error_js_1 = require("./rules/interface-object-usage-error.js");
const interface_subtype_rule_js_1 = require("./rules/interface-subtype-rule.js");
const invalid_field_sharing_rule_js_1 = require("./rules/invalid-field-sharing-rule.js");
const link_import_name_mismatch_rule_js_1 = require("./rules/link-import-name-mismatch-rule.js");
const list_size_slicing_arguments_rule_js_1 = require("./rules/list-size-slicing-arguments-rule.js");
const no_inaccessible_on_implemented_interface_fields_rule_js_1 = require("./rules/no-inaccessible-on-implemented-interface-fields-rule.js");
const only_inaccessible_children_rule_js_1 = require("./rules/only-inaccessible-children-rule.js");
const override_source_has_override_js_1 = require("./rules/override-source-has-override.js");
const referenced_inaccessible_rule_js_1 = require("./rules/referenced-inaccessible-rule.js");
const required_argument_missing_in_some_subgraph_rule_js_1 = require("./rules/required-argument-missing-in-some-subgraph-rule.js");
const required_argument_or_field_is_not_inaccessible_rule_js_1 = require("./rules/required-argument-or-field-is-not-inaccessible-rule.js");
const required_input_field_missing_in_some_subgraph_rule_js_1 = require("./rules/required-input-field-missing-in-some-subgraph-rule.js");
const required_query_rule_js_1 = require("./rules/required-query-rule.js");
const satisfiablity_rule_js_1 = require("./rules/satisfiablity-rule.js");
const subgraph_name_rule_js_1 = require("./rules/subgraph-name-rule.js");
const types_of_the_same_kind_rule_js_1 = require("./rules/types-of-the-same-kind-rule.js");
const validation_context_js_1 = require("./validation-context.js");
function validateSupergraph(subgraphStates, state, __internal) {
    const context = (0, validation_context_js_1.createSupergraphValidationContext)(subgraphStates);
    for (const subgraphState of subgraphStates.values()) {
        state.addSubgraph(subgraphState);
    }
    const preSupergraphRules = [
        required_query_rule_js_1.RequiredQueryRule,
        types_of_the_same_kind_rule_js_1.TypesOfTheSameKindRule,
        link_import_name_mismatch_rule_js_1.LinkImportNameMismatchRule,
    ];
    const rulesToSkip = __internal?.disableValidationRules ?? [];
    for (const rule of preSupergraphRules) {
        if (rulesToSkip.includes(rule.name)) {
            continue;
        }
        rule(context);
    }
    for (const subgraphState of subgraphStates.values()) {
        state.visitSubgraphState(subgraphState);
    }
    state.composeSupergraphState();
    const postSupergraphRules = [
        interface_field_no_implementation_rule_js_1.InterfaceFieldNoImplementationRule,
        extension_with_base_js_1.ExtensionWithBaseRule,
        fields_of_the_same_type_rule_js_1.FieldsOfTheSameTypeRule,
        field_arguments_of_the_same_type_rule_js_1.FieldArgumentsOfTheSameTypeRule,
        enum_values_rule_js_1.EnumValuesRule,
        override_source_has_override_js_1.OverrideSourceHasOverrideRule,
        external_missing_on_base_rule_js_1.ExternalMissingOnBaseRule,
        input_object_values_rule_js_1.InputObjectValuesRule,
        required_argument_missing_in_some_subgraph_rule_js_1.RequiredArgumentMissingInSomeSubgraph,
        required_input_field_missing_in_some_subgraph_rule_js_1.RequiredInputFieldMissingInSomeSubgraphRule,
        external_argument_missing_rule_js_1.ExternalArgumentMissingRule,
        input_field_default_mismatch_rule_js_1.InputFieldDefaultMismatchRule,
        field_argument_default_mismatch_rule_js_1.FieldArgumentDefaultMismatchRule,
        default_value_uses_inaccessible_rule_js_1.DefaultValueUsesInaccessibleRule,
        only_inaccessible_children_rule_js_1.OnlyInaccessibleChildrenRule,
        referenced_inaccessible_rule_js_1.ReferencedInaccessibleRule,
        directive_composition_rule_js_1.DirectiveCompositionRule,
        interface_object_usage_error_js_1.InterfaceObjectUsageErrorRule,
        interface_key_missing_implementation_type_js_1.InterfaceKeyMissingImplementationTypeRule,
        external_type_mismatch_rule_js_1.ExternalTypeMismatchRule,
        invalid_field_sharing_rule_js_1.InvalidFieldSharingRule,
        satisfiablity_rule_js_1.SatisfiabilityRule,
        subgraph_name_rule_js_1.SubgraphNameRule,
        required_argument_or_field_is_not_inaccessible_rule_js_1.RequiredArgumentOrFieldIsNotInaccessibleRule,
        interface_subtype_rule_js_1.InterfaceSubtypeRule,
        no_inaccessible_on_implemented_interface_fields_rule_js_1.NoInaccessibleOnImplementedInterfaceFieldsRule,
        list_size_slicing_arguments_rule_js_1.ListSizeSlicingArgumentsRule,
        auth_on_requires_rule_js_1.AuthOnRequiresRule,
    ];
    const supergraph = state.getSupergraphState();
    (0, visitor_js_1.visitSupergraphState)(supergraph, postSupergraphRules.map((rule) => {
        if (rulesToSkip.includes(rule.name)) {
            return {};
        }
        return rule(context, supergraph);
    }));
    return context.collectReportedErrors();
}
