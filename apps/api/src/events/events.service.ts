import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Event } from "@openspawn/database";
import { EventSeverity } from "@openspawn/shared-types";

export interface EmitEventParams {
  orgId: string;
  type: string;
  actorId: string;
  entityType: string;
  entityId: string;
  data: Record<string, unknown>;
  severity?: EventSeverity;
  reasoning?: string;
}

export interface EventFilters {
  type?: string;
  actorId?: string;
  entityType?: string;
  entityId?: string;
  severity?: EventSeverity;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Emit an event - inserts to database and publishes to EventEmitter2
   */
  async emit(params: EmitEventParams): Promise<Event> {
    const event = this.eventRepository.create({
      orgId: params.orgId,
      type: params.type,
      actorId: params.actorId,
      entityType: params.entityType,
      entityId: params.entityId,
      data: params.data,
      severity: params.severity || EventSeverity.INFO,
      reasoning: params.reasoning,
    });

    const saved = await this.eventRepository.save(event);

    // Publish to EventEmitter2 for real-time subscriptions
    this.eventEmitter.emit(params.type, saved);
    this.eventEmitter.emit("event.created", saved);

    return saved;
  }

  /**
   * Query events with pagination and filters
   */
  async findAll(
    orgId: string,
    filters: EventFilters = {},
    page = 1,
    limit = 50,
  ): Promise<{ events: Event[]; total: number }> {
    const query = this.eventRepository
      .createQueryBuilder("event")
      .where("event.org_id = :orgId", { orgId })
      .orderBy("event.created_at", "DESC");

    if (filters.type) {
      query.andWhere("event.type = :type", { type: filters.type });
    }

    if (filters.actorId) {
      query.andWhere("event.actor_id = :actorId", { actorId: filters.actorId });
    }

    if (filters.entityType) {
      query.andWhere("event.entity_type = :entityType", {
        entityType: filters.entityType,
      });
    }

    if (filters.entityId) {
      query.andWhere("event.entity_id = :entityId", {
        entityId: filters.entityId,
      });
    }

    if (filters.severity) {
      query.andWhere("event.severity = :severity", {
        severity: filters.severity,
      });
    }

    if (filters.startDate) {
      query.andWhere("event.created_at >= :startDate", {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      query.andWhere("event.created_at <= :endDate", {
        endDate: filters.endDate,
      });
    }

    const [events, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { events, total };
  }

  /**
   * Get a single event by ID
   */
  async findOne(orgId: string, id: string): Promise<Event | null> {
    return this.eventRepository.findOne({
      where: { id, orgId },
    });
  }
}
