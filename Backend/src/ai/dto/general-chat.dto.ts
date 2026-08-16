import { IsNotEmpty, IsString } from 'class-validator';

export class SendGeneralChatMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'Message text cannot be empty' })
  message: string;
}
