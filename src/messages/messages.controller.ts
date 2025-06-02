import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MessageService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AuthTokenGuard } from 'src/auth/guards/auth-token.guard';
import { TokenPayloadParam } from 'src/auth/params/token-payload.param';
import { TokenPayloadDto } from 'src/auth/dto/token-payload.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messageService: MessageService) {}

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const messages = await this.messageService.findAll(paginationDto);
    return messages;
  }

  @Get(':id')
  async getMessage(@Param('id') id: number) {
    return this.messageService.getMessage(id);
  }

  @UseGuards(AuthTokenGuard)
  @Post()
  async createMessage(
    @Body() createMessageDto: CreateMessageDto,
    @TokenPayloadParam() tokenPaylod: TokenPayloadDto,
  ) {
    return this.messageService.createMessage(createMessageDto, tokenPaylod);
  }

  @UseGuards(AuthTokenGuard)
  @Patch(':id')
  async updateMessage(
    @Param('id') id: number,
    @Body() updateMessageDto: UpdateMessageDto,
    @TokenPayloadParam() tokenPaylod: TokenPayloadDto,
  ) {
    return this.messageService.updateMessage(id, updateMessageDto, tokenPaylod);
  }

  @UseGuards(AuthTokenGuard)
  @Delete(':id')
  async deleteMessage(
    @Param('id') id: number,
    @TokenPayloadParam() tokenPaylod: TokenPayloadDto,
  ) {
    return this.messageService.deleteMessage(id, tokenPaylod);
  }
}
