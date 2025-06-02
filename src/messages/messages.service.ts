import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from 'src/users/users.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { TokenPayloadDto } from 'src/auth/dto/token-payload.dto';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly userService: UsersService,
  ) {}

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    const messages = await this.messageRepository.find({
      take: limit,
      skip: offset,
    });
    return messages;
  }

  async getMessage(id: number) {
    const message = await this.messageRepository.findOne({
      where: { id },
    });
    if (message) return message;

    throw new NotFoundException('message not found');
  }

  async createMessage(
    createMessageDto: CreateMessageDto,
    tokenPaylod: TokenPayloadDto,
  ) {
    const { toId } = createMessageDto;

    const from = await this.userService.findOne(tokenPaylod.sub);
    const to = await this.userService.findOne(toId);

    const newMessage = {
      text: createMessageDto.text,
      from,
      to,
      read: false,
      date: new Date(),
    };

    const message = this.messageRepository.create(newMessage);
    await this.messageRepository.save(message);
    return {
      ...message,
      from: { id: message.from.id, name: message.from.name },
      to: { id: message.to.id, name: message.to.name },
    };
  }

  async updateMessage(
    id: number,
    updateMessageDto: UpdateMessageDto,
    tokenPaylod: TokenPayloadDto,
  ) {
    const message = await this.getMessage(id);

    if (message.from.id !== tokenPaylod.sub) {
      throw new ForbiddenException('cannot perform this action');
    }

    message.text = updateMessageDto?.text ?? message.text;
    message.read = updateMessageDto?.read ?? message.read;

    await this.messageRepository.save(message);
    return message;
  }

  async deleteMessage(id: number, tokenPaylod: TokenPayloadDto) {
    const message = await this.getMessage(id);

    if (message.from.id !== tokenPaylod.sub) {
      throw new ForbiddenException('cannot perform this action');
    }

    return this.messageRepository.remove(message);
  }
}
