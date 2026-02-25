"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartialType = PartialType;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const mapped_types_1 = require("@nestjs/mapped-types");
const decorators_1 = require("../decorators");
const metadata_loader_1 = require("../plugin/metadata-loader");
const plugin_constants_1 = require("../plugin/plugin-constants");
const get_fields_and_decorator_util_1 = require("../schema-builder/utils/get-fields-and-decorator.util");
const type_helpers_utils_1 = require("./type-helpers.utils");
function isPartialTypeOptions(optionsOrDecorator) {
    return (optionsOrDecorator &&
        ('decorator' in optionsOrDecorator ||
            'omitDefaultValues' in optionsOrDecorator ||
            'skipNullProperties' in optionsOrDecorator));
}
function PartialType(classRef, optionsOrDecorator) {
    const { fields, decoratorFactory } = (0, get_fields_and_decorator_util_1.getFieldsAndDecoratorForType)(classRef);
    class PartialObjectType {
        constructor() {
            (0, mapped_types_1.inheritPropertyInitializers)(this, classRef);
        }
    }
    let decorator;
    let omitDefaultValues = false;
    let skipNullProperties = true;
    if (isPartialTypeOptions(optionsOrDecorator)) {
        decorator = optionsOrDecorator.decorator;
        omitDefaultValues = optionsOrDecorator.omitDefaultValues;
        skipNullProperties = optionsOrDecorator.skipNullProperties ?? true;
    }
    else {
        decorator = optionsOrDecorator;
    }
    const applyPartialDecoratorFn = skipNullProperties === false
        ? mapped_types_1.applyValidateIfDefinedDecorator
        : mapped_types_1.applyIsOptionalDecorator;
    if (decorator) {
        decorator({ isAbstract: true })(PartialObjectType);
    }
    else {
        decoratorFactory({ isAbstract: true })(PartialObjectType);
    }
    (0, mapped_types_1.inheritValidationMetadata)(classRef, PartialObjectType);
    (0, mapped_types_1.inheritTransformationMetadata)(classRef, PartialObjectType);
    function applyFields(fields) {
        fields.forEach((item) => {
            if ((0, shared_utils_1.isFunction)(item.typeFn)) {
                // Execute type function eagerly to update the type options object (before "clone" operation)
                // when the passed function (e.g., @Field(() => Type)) lazily returns an array.
                item.typeFn();
            }
            (0, decorators_1.Field)(item.typeFn, {
                ...item.options,
                nullable: true,
                defaultValue: omitDefaultValues ? undefined : item.options.defaultValue,
            })(PartialObjectType.prototype, item.name);
            applyPartialDecoratorFn(PartialObjectType, item.name);
            (0, type_helpers_utils_1.applyFieldDecorators)(PartialObjectType, item);
        });
    }
    applyFields(fields);
    // Register a refresh hook to update the fields when the serialized metadata
    // is loaded from file.
    metadata_loader_1.MetadataLoader.addRefreshHook(() => {
        const { fields } = (0, get_fields_and_decorator_util_1.getFieldsAndDecoratorForType)(classRef, {
            overrideFields: true,
        });
        applyFields(fields);
    });
    if (PartialObjectType[plugin_constants_1.METADATA_FACTORY_NAME]) {
        const pluginFields = Object.keys(PartialObjectType[plugin_constants_1.METADATA_FACTORY_NAME]());
        pluginFields.forEach((key) => applyPartialDecoratorFn(PartialObjectType, key));
    }
    Object.defineProperty(PartialObjectType, 'name', {
        value: `Partial${classRef.name}`,
    });
    return PartialObjectType;
}
