import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, TicketCategory, TicketStatus } from '@prisma/client';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketMessageDto } from './dto/create-ticket-message.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';

const ticketInclude = {
  requester: {
    select: { id: true, fullName: true, email: true, role: true },
  },
  messages: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      sender: {
        select: { id: true, fullName: true, email: true, role: true },
      },
    },
  },
};

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: JwtUser, input: CreateTicketDto) {
    if (user.role === Role.ADMIN) {
      throw new ForbiddenException('Administrators manage support tickets from the support inbox.');
    }

    if (input.category === TicketCategory.INSTRUCTOR_APPLICATION) {
      if (
        !input.instructorSpecialty ||
        !input.instructorExperience ||
        !input.instructorCourseIdea
      ) {
        throw new BadRequestException(
          'Instructor applications require a specialty, experience, and course proposal.',
        );
      }
    } else if (
      input.instructorSpecialty ||
      input.instructorExperience ||
      input.instructorPortfolio ||
      input.instructorCourseIdea
    ) {
      throw new BadRequestException(
        'Instructor application details are only allowed for instructor applications.',
      );
    }

    return this.prisma.supportTicket.create({
      data: {
        userId: user.sub,
        category: input.category,
        subject: input.subject,
        instructorSpecialty: input.instructorSpecialty,
        instructorExperience: input.instructorExperience,
        instructorPortfolio: input.instructorPortfolio,
        instructorCourseIdea: input.instructorCourseIdea,
        messages: {
          create: {
            body: input.message,
            senderId: user.sub,
          },
        },
      },
      include: ticketInclude,
    });
  }

  findAll(user: JwtUser) {
    const where =
      user.role === Role.ADMIN
        ? {}
        : user.role === Role.MODERATOR
          ? {
              category: { not: TicketCategory.INSTRUCTOR_APPLICATION },
            }
          : { userId: user.sub };

    return this.prisma.supportTicket.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: ticketInclude,
    });
  }

  async findOne(user: JwtUser, ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: ticketInclude,
    });

    this.assertAccess(ticket, user);
    return ticket;
  }

  async addMessage(user: JwtUser, ticketId: string, input: CreateTicketMessageDto) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, userId: true, category: true, status: true },
    });
    this.assertAccess(ticket, user);

    if (
      ticket.status === TicketStatus.CLOSED ||
      ticket.status === TicketStatus.APPROVED ||
      ticket.status === TicketStatus.REJECTED
    ) {
      throw new BadRequestException(
        'This ticket is closed. Create a new ticket if you need more help.',
      );
    }
    if (
      ticket.category === TicketCategory.INSTRUCTOR_APPLICATION &&
      user.role === Role.STUDENT &&
      ticket.status !== TicketStatus.NEEDS_INFORMATION
    ) {
      throw new BadRequestException(
        'You can reply to an instructor application when additional information is requested.',
      );
    }

    const isStaff = user.role === Role.ADMIN || user.role === Role.MODERATOR;
    let nextStatus: TicketStatus = ticket.status;
    if (ticket.category === TicketCategory.INSTRUCTOR_APPLICATION) {
      if (user.role === Role.STUDENT) nextStatus = TicketStatus.IN_REVIEW;
      else if (ticket.status === TicketStatus.OPEN) nextStatus = TicketStatus.IN_REVIEW;
    } else if (isStaff) {
      nextStatus = TicketStatus.CLOSED;
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.supportTicketMessage.create({
        data: { ticketId, senderId: user.sub, body: input.body },
      });
      await transaction.supportTicket.update({
        where: { id: ticketId },
        data: { status: nextStatus },
      });
    });

    return this.findOne(user, ticketId);
  }

  async updateStatus(user: JwtUser, ticketId: string, input: UpdateTicketStatusDto) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can review or close tickets.');
    }

    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, userId: true, category: true },
    });
    this.assertAccess(ticket, user);

    if (
      ticket.category !== TicketCategory.INSTRUCTOR_APPLICATION &&
      (input.status === TicketStatus.APPROVED || input.status === TicketStatus.REJECTED)
    ) {
      throw new BadRequestException(
        'Approval and rejection statuses are only valid for instructor applications.',
      );
    }

    await this.prisma.$transaction(async (transaction) => {
      await transaction.supportTicket.update({
        where: { id: ticketId },
        data: { status: input.status },
      });
      if (
        ticket.category === TicketCategory.INSTRUCTOR_APPLICATION &&
        input.status === TicketStatus.APPROVED
      ) {
        await transaction.user.update({
          where: { id: ticket.userId },
          data: { role: Role.MODERATOR },
        });
      }
    });
    return this.findOne(user, ticketId);
  }

  private assertAccess(
    ticket: { id: string; userId: string; category?: TicketCategory } | null,
    user: JwtUser,
  ): asserts ticket is { id: string; userId: string; category?: TicketCategory } {
    if (!ticket) throw new NotFoundException('Ticket not found.');

    const isStaff = user.role === Role.ADMIN || user.role === Role.MODERATOR;
    const isAllowedStaff =
      isStaff &&
      (user.role === Role.ADMIN || ticket.category !== TicketCategory.INSTRUCTOR_APPLICATION);
    if (ticket.userId !== user.sub && !isAllowedStaff) {
      throw new NotFoundException('Ticket not found.');
    }
  }
}
