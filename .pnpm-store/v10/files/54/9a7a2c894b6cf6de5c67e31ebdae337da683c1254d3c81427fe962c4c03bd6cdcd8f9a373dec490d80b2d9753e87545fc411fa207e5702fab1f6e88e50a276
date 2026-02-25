"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnEvent = void 0;
const extend_metadata_util_1 = require("@nestjs/common/utils/extend-metadata.util");
const constants_1 = require("../constants");
const OnEvent = (event, options) => {
    const decoratorFactory = (target, key, descriptor) => {
        (0, extend_metadata_util_1.extendArrayMetadata)(constants_1.EVENT_LISTENER_METADATA, [{ event, options }], descriptor.value);
        return descriptor;
    };
    decoratorFactory.KEY = constants_1.EVENT_LISTENER_METADATA;
    return decoratorFactory;
};
exports.OnEvent = OnEvent;
//# sourceMappingURL=on-event.decorator.js.map