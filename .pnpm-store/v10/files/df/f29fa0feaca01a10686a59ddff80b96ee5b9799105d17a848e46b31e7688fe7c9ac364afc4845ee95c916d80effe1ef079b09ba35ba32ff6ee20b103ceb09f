"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var EventEmitterModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventEmitterModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const eventemitter2_1 = require("eventemitter2");
const event_emitter_readiness_watcher_1 = require("./event-emitter-readiness.watcher");
const event_subscribers_loader_1 = require("./event-subscribers.loader");
const events_metadata_accessor_1 = require("./events-metadata.accessor");
let EventEmitterModule = EventEmitterModule_1 = class EventEmitterModule {
    static forRoot(options) {
        return {
            global: options?.global ?? true,
            module: EventEmitterModule_1,
            imports: [core_1.DiscoveryModule],
            providers: [
                event_subscribers_loader_1.EventSubscribersLoader,
                events_metadata_accessor_1.EventsMetadataAccessor,
                event_emitter_readiness_watcher_1.EventEmitterReadinessWatcher,
                {
                    provide: eventemitter2_1.EventEmitter2,
                    useFactory: () => new eventemitter2_1.EventEmitter2(options),
                },
            ],
            exports: [eventemitter2_1.EventEmitter2, event_emitter_readiness_watcher_1.EventEmitterReadinessWatcher],
        };
    }
};
exports.EventEmitterModule = EventEmitterModule;
exports.EventEmitterModule = EventEmitterModule = EventEmitterModule_1 = __decorate([
    (0, common_1.Module)({})
], EventEmitterModule);
//# sourceMappingURL=event-emitter.module.js.map