"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyFieldDecorators = applyFieldDecorators;
const decorators_1 = require("../decorators");
function applyFieldDecorators(targetClass, item) {
    if (item.extensions) {
        (0, decorators_1.Extensions)(item.extensions)(targetClass.prototype, item.name);
    }
    if (item.directives?.length) {
        item.directives.map((directive) => {
            (0, decorators_1.Directive)(directive.sdl)(targetClass.prototype, item.name);
        });
    }
}
