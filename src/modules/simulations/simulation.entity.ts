import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Sandbox } from '../sandboxes/sandbox.entity';

@Entity()
export class Simulation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Sandbox, (sandbox) => sandbox.id)
  sandbox: Sandbox;

  @Column()
  name: string; // e.g. KYC, Fraud, Balance

  @Column('jsonb')
  config: any; // JSON scenario or plugin config

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 