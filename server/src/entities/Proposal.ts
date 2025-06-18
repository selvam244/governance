import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("proposals")
export class Proposal {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 100, unique: true })
  onchain_id!: string;

  @Column({ type: "varchar", length: 500 })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "boolean", default: false })
  published!: boolean;

  @Column({ type: "integer", default: 0 })
  state!: number; // 0-7 representing different proposal states

  @Column({ type: "integer", default: 0 })
  for!: number; // votes in favor

  @Column({ type: "integer", default: 0 })
  against!: number; // votes against

  @Column({ type: "integer", default: 0 })
  abstain!: number; // abstain votes

  @Column({ type: "integer" })
  userId!: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: "userId" })
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
