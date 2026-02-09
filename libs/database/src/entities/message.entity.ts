import { MessageType } from "@openspawn/shared-types";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

import type { Agent } from "./agent.entity";
import type { Channel } from "./channel.entity";
import type { Organization } from "./organization.entity";

@Entity("messages")
@Index(["channelId", "createdAt"])
@Index(["orgId", "senderId"])
@Index(["orgId", "recipientId"])
@Index(["parentMessageId"])
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "org_id", type: "uuid" })
  orgId!: string;

  @Column({ name: "channel_id", type: "uuid" })
  channelId!: string;

  @Column({ name: "sender_id", type: "uuid" })
  senderId!: string;

  @Column({ type: "varchar", length: 20, default: MessageType.TEXT })
  type!: MessageType;

  @Column({ type: "text" })
  body!: string;

  @Column({ name: "parent_message_id", type: "uuid", nullable: true })
  parentMessageId!: string | null;

  @Column({ name: "recipient_id", type: "uuid", nullable: true })
  recipientId!: string | null;

  @Column({ type: "jsonb", default: {} })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  // Relations
  @ManyToOne("Organization")
  @JoinColumn({ name: "org_id" })
  organization?: Organization;

  @ManyToOne("Channel", "messages")
  @JoinColumn({ name: "channel_id" })
  channel?: Channel;

  @ManyToOne("Agent")
  @JoinColumn({ name: "sender_id" })
  sender?: Agent;

  @ManyToOne("Agent")
  @JoinColumn({ name: "recipient_id" })
  recipient?: Agent;

  @ManyToOne("Message", "replies")
  @JoinColumn({ name: "parent_message_id" })
  parentMessage?: Message;

  @OneToMany("Message", "parentMessage")
  replies?: Message[];
}
