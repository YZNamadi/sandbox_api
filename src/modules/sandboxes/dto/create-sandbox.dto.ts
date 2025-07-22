import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class CreateSandboxDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsObject()
  openapiSpec: object;
}
