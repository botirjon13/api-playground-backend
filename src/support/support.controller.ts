import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateTicketMessageDto } from './dto/create-ticket-message.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { SupportService } from './support.service';

@ApiTags('Support')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT bearer token.' })
@Controller('support/tickets')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  @ApiOperation({ summary: 'Create a support ticket or instructor application.' })
  @ApiCreatedResponse({ description: 'Ticket created with its opening message.' })
  @ApiForbiddenResponse({ description: 'Administrators cannot create support tickets.' })
  create(@CurrentUser() user: JwtUser, @Body() input: CreateTicketDto) {
    return this.supportService.create(user, input);
  }

  @Get()
  @ApiOperation({ summary: 'List the user’s tickets or staff ticket inbox.' })
  @ApiOkResponse({ description: 'Accessible tickets loaded.' })
  findAll(@CurrentUser() user: JwtUser) {
    return this.supportService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a ticket and its conversation.' })
  @ApiOkResponse({ description: 'Ticket conversation loaded.' })
  @ApiNotFoundResponse({ description: 'Ticket was not found or is inaccessible.' })
  findOne(@CurrentUser() user: JwtUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.supportService.findOne(user, id);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Reply to a ticket conversation.' })
  @ApiOkResponse({ description: 'Reply saved and ticket state updated.' })
  @ApiNotFoundResponse({ description: 'Ticket was not found or is inaccessible.' })
  addMessage(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: CreateTicketMessageDto,
  ) {
    return this.supportService.addMessage(user, id, input);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update ticket or instructor application review status.' })
  @ApiOkResponse({ description: 'Ticket status updated.' })
  @ApiForbiddenResponse({ description: 'Only administrators can update ticket status.' })
  @ApiNotFoundResponse({ description: 'Ticket was not found.' })
  updateStatus(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: UpdateTicketStatusDto,
  ) {
    return this.supportService.updateStatus(user, id, input);
  }
}
