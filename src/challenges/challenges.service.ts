import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CourseCompletionStatus, EnrollmentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { QueryChallengesDto } from './dto/query-challenges.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { ChallengeEntity } from './entities/challenge.entity';

export interface PaginatedResult {
  data: ChallengeEntity[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class ChallengesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createChallengeDto: CreateChallengeDto): Promise<ChallengeEntity> {
    const challenge = await this.prisma.challenge.create({
      data: {
        ...createChallengeDto,
        is_active: true,
      },
    });

    return challenge as ChallengeEntity;
  }

  async findAll(query: QueryChallengesDto): Promise<PaginatedResult> {
    const { page = 1, limit = 10, difficulty, category, search, sort = 'desc' } = query;

    // Build dynamic where condition
    const where: Prisma.ChallengeWhereInput = {
      is_active: true,
    };

    // Add difficulty filter
    if (difficulty) {
      where.difficulty = difficulty;
    }

    // Add category filter (case-insensitive)
    if (category) {
      where.category = {
        contains: category,
        mode: 'insensitive',
      };
    }

    // Add search filter (search in title and description)
    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries in parallel
    const [challenges, total] = await Promise.all([
      this.prisma.challenge.findMany({
        where,
        orderBy: { created_at: sort === 'asc' ? 'asc' : 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.challenge.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: challenges as ChallengeEntity[],
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findOne(id: string): Promise<ChallengeEntity> {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
    });

    if (!challenge || !challenge.is_active) {
      throw new NotFoundException('Challenge not found.');
    }

    return challenge as ChallengeEntity;
  }

  async update(id: string, updateChallengeDto: UpdateChallengeDto): Promise<ChallengeEntity> {
    await this.findOne(id);

    const updated = await this.prisma.challenge.update({
      where: { id },
      data: {
        ...updateChallengeDto,
      },
    });

    return updated as ChallengeEntity;
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    await this.prisma.challenge.update({
      where: { id },
      data: { is_active: false },
    });

    return { message: 'Challenge deleted successfully' };
  }
  async completeMission1(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.mission1) {
      return {
        success: false,
        message: 'Mission already completed',
      };
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        mission1: true,
        xp: {
          increment: 10,
        },
      },
    });

    const course = await this.prisma.course.findFirst({
      where: { slug: 'rest-api-basics', status: 'PUBLISHED' },
      select: {
        id: true,
        isFree: true,
        finalQuestions: { select: { id: true } },
        enrollments: {
          where: { userId },
          select: { status: true },
        },
      },
    });
    if (course && course.enrollments.length > 0 && course.finalQuestions.length === 0) {
      if (course.isFree) {
        await this.prisma.$transaction(async (transaction) => {
          await transaction.courseEnrollment.update({
            where: { userId_courseId: { userId, courseId: course.id } },
            data: { status: EnrollmentStatus.COMPLETED },
          });
          await transaction.courseCertificate.upsert({
            where: { userId_courseId: { userId, courseId: course.id } },
            create: {
              userId,
              courseId: course.id,
              recipientName: user.fullName?.trim() || 'OsonTrack tinglovchisi',
              code: randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase(),
            },
            update: {},
          });
        });
      } else {
        await this.prisma.courseCompletionReview.upsert({
          where: { userId_courseId: { userId, courseId: course.id } },
          create: { userId, courseId: course.id },
          update: { status: CourseCompletionStatus.PENDING_REVIEW },
        });
      }
    }

    return {
      success: true,
      xp: updatedUser.xp,
      mission1: updatedUser.mission1,
    };
  }
}
