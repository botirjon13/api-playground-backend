import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminOverviewDto } from './admin-overview.dto';

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
    const [totalUsers, admins, students, mission1Completed, xp, recentStudents] = await Promise.all(
      [
        this.prisma.user.count(),
        this.prisma.user.count({ where: { role: Role.ADMIN } }),
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
      ],
    );

    return {
      stats: {
        totalUsers,
        admins,
        students,
        mission1Completed,
        totalXp: xp._sum.xp ?? 0,
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
}
