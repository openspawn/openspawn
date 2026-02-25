"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventEmitterReadinessWatcher = void 0;
const common_1 = require("@nestjs/common");
const promise_with_resolvers_1 = require("./utils/promise-with-resolvers");
let EventEmitterReadinessWatcher = class EventEmitterReadinessWatcher {
    constructor() {
        this.readyPromise = (0, promise_with_resolvers_1.promiseWithResolvers)();
    }
    waitUntilReady() {
        return this.readyPromise.promise;
    }
    setReady() {
        this.readyPromise.resolve();
    }
    setErrored(error) {
        this.readyPromise.reject(error);
    }
};
exports.EventEmitterReadinessWatcher = EventEmitterReadinessWatcher;
exports.EventEmitterReadinessWatcher = EventEmitterReadinessWatcher = __decorate([
    (0, common_1.Injectable)()
], EventEmitterReadinessWatcher);
//# sourceMappingURL=event-emitter-readiness.watcher.js.map