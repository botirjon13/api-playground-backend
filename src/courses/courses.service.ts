import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CourseStatus, EnrollmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CourseDto, CourseEnrollmentDto } from './course.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  findPublished(): Promise<CourseDto[]> {
    return this.prisma.course.findMany({
      where: { status: CourseStatus.PUBLISHED },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        level: true,
        isFree: true,
        priceCents: true,
        status: true,
      },
    });
  }

  async findMyEnrollments(userId: string): Promise<CourseEnrollmentDto[]> {
    return this.prisma.courseEnrollment.findMany({
      where: {
        userId,
        status: EnrollmentStatus.ACTIVE,
        course: { status: CourseStatus.PUBLISHED },
      },
      orderBy: { enrolledAt: 'asc' },
      select: {
        enrolledAt: true,
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            level: true,
            isFree: true,
            priceCents: true,
            status: true,
          },
        },
      },
    });
  }

  async enroll(userId: string, slug: string): Promise<CourseEnrollmentDto> {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      select: {
        id: true,
        status: true,
        isFree: true,
      },
    });

    if (!course || course.status !== CourseStatus.PUBLISHED) {
      throw new NotFoundException('Published course was not found');
    }

    if (!course.isFree) {
      throw new ForbiddenException('Paid course enrollment is not available yet');
    }

    return this.prisma.courseEnrollment.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId: course.id,
        },
      },
      create: {
        userId,
        courseId: course.id,
      },
      update: {
        status: EnrollmentStatus.ACTIVE,
      },
      select: {
        enrolledAt: true,
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            level: true,
            isFree: true,
            priceCents: true,
            status: true,
          },
        },
      },
    });
  }
}
