import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";

@Entity("nonces")
@Index(["expiresAt"])
export class Nonce {
  @PrimaryColumn({ type: "varchar", length: 64 })
  nonce!: string;

  @Column({ name: "agent_id", type: "uuid" })
  agentId!: string;

  @Column({ name: "expires_at", type: "timestamptz" })
  expiresAt!: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
