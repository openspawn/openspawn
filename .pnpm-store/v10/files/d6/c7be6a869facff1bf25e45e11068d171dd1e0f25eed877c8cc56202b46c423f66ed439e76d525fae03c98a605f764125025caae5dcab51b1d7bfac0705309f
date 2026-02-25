"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsMetadataAccessor = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const constants_1 = require("./constants");
let EventsMetadataAccessor = class EventsMetadataAccessor {
    constructor(reflector) {
        this.reflector = reflector;
    }
    getEventHandlerMetadata(target) {
        if (!target ||
            (typeof target !== 'function' && typeof target !== 'object')) {
            return undefined;
        }
        const metadata = this.reflector.get(constants_1.EVENT_LISTENER_METADATA, target);
        if (!metadata) {
            return undefined;
        }
        return Array.isArray(metadata) ? metadata : [metadata];
    }
};
exports.EventsMetadataAccessor = EventsMetadataAccessor;
exports.EventsMetadataAccessor = EventsMetadataAccessor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], EventsMetadataAccessor);
//# sourceMappingURL=events-metadata.accessor.js.map