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
exports.EventSubscribersLoader = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const injector_1 = require("@nestjs/core/injector/injector");
const eventemitter2_1 = require("eventemitter2");
const event_emitter_readiness_watcher_1 = require("./event-emitter-readiness.watcher");
const events_metadata_accessor_1 = require("./events-metadata.accessor");
let EventSubscribersLoader = class EventSubscribersLoader {
    constructor(discoveryService, eventEmitter, metadataAccessor, metadataScanner, moduleRef, eventEmitterReadinessWatcher) {
        this.discoveryService = discoveryService;
        this.eventEmitter = eventEmitter;
        this.metadataAccessor = metadataAccessor;
        this.metadataScanner = metadataScanner;
        this.moduleRef = moduleRef;
        this.eventEmitterReadinessWatcher = eventEmitterReadinessWatcher;
        this.injector = new injector_1.Injector();
        this.logger = new common_1.Logger('Event');
    }
    onApplicationBootstrap() {
        try {
            this.loadEventListeners();
            this.eventEmitterReadinessWatcher.setReady();
        }
        catch (e) {
            this.eventEmitterReadinessWatcher.setErrored(e);
        }
    }
    onApplicationShutdown() {
        this.eventEmitter.removeAllListeners();
    }
    loadEventListeners() {
        const providers = this.discoveryService.getProviders();
        const controllers = this.discoveryService.getControllers();
        [...providers, ...controllers]
            .filter(wrapper => wrapper.instance && !wrapper.isAlias)
            .forEach((wrapper) => {
            const { instance } = wrapper;
            const prototype = Object.getPrototypeOf(instance) || {};
            const isRequestScoped = !wrapper.isDependencyTreeStatic();
            this.metadataScanner.scanFromPrototype(instance, prototype, (methodKey) => this.subscribeToEventIfListener(instance, methodKey, isRequestScoped, wrapper.host));
        });
    }
    subscribeToEventIfListener(instance, methodKey, isRequestScoped, moduleRef) {
        const eventListenerMetadatas = this.metadataAccessor.getEventHandlerMetadata(instance[methodKey]);
        if (!eventListenerMetadatas) {
            return;
        }
        for (const eventListenerMetadata of eventListenerMetadatas) {
            const { event, options } = eventListenerMetadata;
            const listenerMethod = this.getRegisterListenerMethodBasedOn(options);
            if (isRequestScoped) {
                this.registerRequestScopedListener({
                    event,
                    eventListenerInstance: instance,
                    listenerMethod,
                    listenerMethodKey: methodKey,
                    moduleRef,
                    options,
                });
            }
            else {
                listenerMethod(event, (...args) => this.wrapFunctionInTryCatchBlocks(instance, methodKey, args, options), options);
            }
        }
    }
    getRegisterListenerMethodBasedOn(options) {
        return options?.prependListener
            ? this.eventEmitter.prependListener.bind(this.eventEmitter)
            : this.eventEmitter.on.bind(this.eventEmitter);
    }
    registerRequestScopedListener(eventListenerContext) {
        const { listenerMethod, event, eventListenerInstance, moduleRef, listenerMethodKey, options, } = eventListenerContext;
        listenerMethod(event, async (...args) => {
            const request = this.getRequestFromEventPayload(args);
            const contextId = core_1.ContextIdFactory.getByRequest({ payload: request });
            this.moduleRef.registerRequestByContextId(request, contextId);
            const contextInstance = await this.injector.loadPerContext(eventListenerInstance, moduleRef, moduleRef.providers, contextId);
            return this.wrapFunctionInTryCatchBlocks(contextInstance, listenerMethodKey, args, options);
        }, options);
    }
    getRequestFromEventPayload(eventPayload) {
        return eventPayload.length > 1 ? eventPayload : eventPayload[0];
    }
    async wrapFunctionInTryCatchBlocks(instance, methodKey, args, options) {
        try {
            return await instance[methodKey].call(instance, ...args);
        }
        catch (e) {
            if (options?.suppressErrors ?? true) {
                const error = e;
                this.logger.error(error.message, error.stack);
            }
            else {
                throw e;
            }
        }
    }
};
exports.EventSubscribersLoader = EventSubscribersLoader;
exports.EventSubscribersLoader = EventSubscribersLoader = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.DiscoveryService,
        eventemitter2_1.EventEmitter2,
        events_metadata_accessor_1.EventsMetadataAccessor,
        core_1.MetadataScanner,
        core_1.ModuleRef,
        event_emitter_readiness_watcher_1.EventEmitterReadinessWatcher])
], EventSubscribersLoader);
//# sourceMappingURL=event-subscribers.loader.js.map