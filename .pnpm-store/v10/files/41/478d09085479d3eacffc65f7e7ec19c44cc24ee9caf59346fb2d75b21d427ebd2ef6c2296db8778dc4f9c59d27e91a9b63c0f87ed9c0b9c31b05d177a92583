import { Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OnEventMetadata } from './decorators';
export declare class EventsMetadataAccessor {
    private readonly reflector;
    constructor(reflector: Reflector);
    getEventHandlerMetadata(target: Type<unknown>): OnEventMetadata[] | undefined;
}
