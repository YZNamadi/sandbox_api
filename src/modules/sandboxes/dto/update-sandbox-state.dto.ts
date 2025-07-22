import { IsEnum } from 'class-validator';
import { SandboxState } from '../sandbox.entity';

export class UpdateSandboxStateDto {
  @IsEnum(SandboxState)
  state: SandboxState;
} 