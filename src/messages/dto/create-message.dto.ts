import { IsNotEmpty, IsPositive, IsString, MinLength } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  readonly text: string;

  @IsPositive()
  toId: number;
}
