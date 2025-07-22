import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Sandbox } from '../sandboxes/sandbox.entity';

@Entity()
export class Mock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Sandbox, (sandbox) => sandbox.id, { onDelete: 'CASCADE' })
  sandbox: Sandbox;

  @Column()
  path: string; // e.g. /kyc/verify

  @Column()
  method: string; // GET, POST, etc.

  @Column('jsonb')
  response: any;

  @Column({ default: false })
  isRandomized: boolean;

  @Column({ nullable: true })
  delayMs: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
