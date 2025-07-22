import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Team } from '../users/team.entity';

export enum SandboxState {
  ACTIVE = 'active',
  STOPPED = 'stopped',
  RESET = 'reset',
}

@Entity()
export class Sandbox {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('jsonb')
  openapiSpec: any;

  @Column({ type: 'enum', enum: SandboxState, default: SandboxState.STOPPED })
  state: SandboxState;

  @ManyToOne(() => Team, (team) => team.id)
  team: Team;

  @Column({ default: 1 })
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 