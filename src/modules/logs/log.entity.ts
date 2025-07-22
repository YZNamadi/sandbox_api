import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Sandbox } from '../sandboxes/sandbox.entity';
import { User } from '../users/user.entity';

@Entity()
export class Log {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Sandbox, (sandbox) => sandbox.id, { onDelete: 'CASCADE' })
  sandbox: Sandbox;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @Column()
  route: string;

  @Column()
  method: string;

  @Column()
  responseCode: number;

  @Column('jsonb', { nullable: true })
  requestBody: any;

  @Column('jsonb', { nullable: true })
  responseBody: any;

  @CreateDateColumn()
  timestamp: Date;
}
