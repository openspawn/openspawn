import { OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, ModuleRef } from '@nestjs/core';
import { EventEmitter2 } from 'eventemitter2';
import { EventEmitterReadinessWatcher } from './event-emitter-readiness.watcher';
import { EventsMetadataAccessor } from './events-metadata.accessor';
export declare class EventSubscribersLoader implements OnApplicationBootstrap, OnApplicationShutdown {
    private readonly discoveryService;
    private readonly eventEmitter;
    private readonly metadataAccessor;
    private readonly metadataScanner;
    private readonly moduleRef;
    private readonly eventEmitterReadinessWatcher;
    private readonly injector;
    private readonly logger;
    constructor(discoveryService: DiscoveryService, eventEmitter: EventEmitter2, metadataAccessor: EventsMetadataAccessor, metadataScanner: MetadataScanner, moduleRef: ModuleRef, eventEmitterReadinessWatcher: EventEmitterReadinessWatcher);
    onApplicationBootstrap(): void;
    onApplicationShutdown(): void;
    loadEventListeners(): void;
    private subscribeToEventIfListener;
    private getRegisterListenerMethodBasedOn;
    private registerRequestScopedListener;
    private getRequestFromEventPayload;
    private wrapFunctionInTryCatchBlocks;
}
