import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AdStatus,
  CourseStatus,
  EnrollmentStatus,
  Prisma,
  Role,
  TicketStatus,
  User,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminOverviewDto } from './admin-overview.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

export type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async getAdminOverview(): Promise<AdminOverviewDto> {
    const [
      totalUsers,
      admins,
      moderators,
      students,
      mission1Completed,
      xp,
      recentStudents,
      totalCourses,
      publishedCourses,
      coursesPendingReview,
      completedEnrollments,
      totalTickets,
      openTickets,
      ticketsInReview,
      closedTickets,
      activeAds,
      adsPendingReview,
      adImpressions,
      adClicks,
      certificatesIssued,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: Role.ADMIN } }),
      this.prisma.user.count({ where: { role: Role.MODERATOR } }),
      this.prisma.user.count({ where: { role: Role.STUDENT } }),
      this.prisma.user.count({
        where: { role: Role.STUDENT, mission1: true },
      }),
      this.prisma.user.aggregate({ _sum: { xp: true } }),
      this.prisma.user.findMany({
        where: { role: Role.STUDENT },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          xp: true,
          mission1: true,
          createdAt: true,
        },
      }),
      this.prisma.course.count(),
      this.prisma.course.count({ where: { status: CourseStatus.PUBLISHED } }),
      this.prisma.course.count({ where: { status: CourseStatus.PENDING_REVIEW } }),
      this.prisma.courseEnrollment.count({
        where: { status: EnrollmentStatus.COMPLETED },
      }),
      this.prisma.supportTicket.count(),
      this.prisma.supportTicket.count({ where: { status: TicketStatus.OPEN } }),
      this.prisma.supportTicket.count({
        where: {
          status: {
            in: [TicketStatus.IN_REVIEW, TicketStatus.NEEDS_INFORMATION],
          },
        },
      }),
      this.prisma.supportTicket.count({ where: { status: TicketStatus.CLOSED } }),
      this.prisma.adCampaign.count({
        where: {
          status: AdStatus.ACTIVE,
          startsAt: { lte: new Date() },
          endsAt: { gt: new Date() },
        },
      }),
      this.prisma.adCampaign.count({ where: { status: AdStatus.PENDING_REVIEW } }),
      this.prisma.adEvent.count({ where: { type: 'IMPRESSION' } }),
      this.prisma.adEvent.count({ where: { type: 'CLICK' } }),
      this.prisma.courseCertificate.count(),
    ]);

    return {
      stats: {
        totalUsers,
        admins,
        moderators,
        students,
        mission1Completed,
        totalXp: xp._sum.xp ?? 0,
        courses: {
          total: totalCourses,
          published: publishedCourses,
          pendingReview: coursesPendingReview,
          completedEnrollments,
        },
        tickets: {
          total: totalTickets,
          open: openTickets,
          inReview: ticketsInReview,
          closed: closedTickets,
        },
        ads: {
          active: activeAds,
          pendingReview: adsPendingReview,
          impressions: adImpressions,
          clicks: adClicks,
        },
        certificatesIssued,
      },
      recentStudents,
    };
  }

  async findProfileById(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        xp: true,
        mission1: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Authenticated user was not found');
    }

    return user;
  }

  async updateProfile(id: string, input: UpdateProfileDto): Promise<SafeUser> {
    return this.prisma.user.update({
      where: { id },
      data: { fullName: input.fullName.trim() },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        xp: true,
        mission1: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
