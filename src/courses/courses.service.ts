import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CourseStatus, EnrollmentStatus, Prisma, Role } from '@prisma/client';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CourseDto, CourseEnrollmentDto } from './course.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseStatusDto } from './dto/update-course-status.dto';

const courseContentInclude = {
  lessons: {
    orderBy: { position: 'asc' as const },
    include: { resources: { orderBy: { position: 'asc' as const } } },
  },
  instructor: { select: { id: true, fullName: true } },
};

const enrolledCourseSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  level: true,
  lessons: {
    orderBy: { position: 'asc' as const },
    include: { resources: { orderBy: { position: 'asc' as const } } },
  },
  instructor: { select: { fullName: true } },
};

const courseManagerInclude = {
  ...courseContentInclude,
  instructor: { select: { id: true, fullName: true, email: true } },
};

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

  async findPublishedBySlug(slug: string) {
    const course = await this.prisma.course.findFirst({
      where: { slug, status: CourseStatus.PUBLISHED },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        level: true,
        isFree: true,
        priceCents: true,
        status: true,
        lessons: {
          orderBy: { position: 'asc' },
          select: { id: true, title: true, position: true },
        },
      },
    });
    if (!course) throw new NotFoundException('Published course was not found');
    return course;
  }

  async findLearningContent(user: JwtUser, slug: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        slug,
        status: CourseStatus.PUBLISHED,
        enrollments: {
          some: {
            userId: user.sub,
            status: EnrollmentStatus.ACTIVE,
          },
        },
      },
      select: enrolledCourseSelect,
    });
    if (!course) {
      throw new NotFoundException('Enrolled published course was not found');
    }
    return course;
  }

  findManageable(user: JwtUser) {
    return this.prisma.course.findMany({
      where: user.role === Role.ADMIN ? {} : { instructorId: user.sub },
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
      include: courseManagerInclude,
    });
  }

  async createDraft(user: JwtUser, input: CreateCourseDto) {
    if (user.role !== Role.MODERATOR) {
      throw new ForbiddenException('Only moderators can create courses.');
    }
    try {
      return await this.prisma.course.create({
        data: {
          slug: input.slug,
          title: input.title,
          description: input.description,
          level: input.level,
          isFree: input.isFree,
          instructorId: user.sub,
          lessons: { create: this.toLessonCreate(input.lessons) },
        },
        include: courseManagerInclude,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A course with this slug already exists.');
      }
      throw error;
    }
  }

  async updateDraft(user: JwtUser, courseId: string, input: CreateCourseDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, instructorId: true, status: true },
    });
    if (!course) throw new NotFoundException('Course was not found.');
    if (user.role !== Role.MODERATOR || course.instructorId !== user.sub) {
      throw new ForbiddenException('You can only edit your own courses.');
    }
    if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.REJECTED) {
      throw new BadRequestException('Only draft or rejected courses can be edited.');
    }
    try {
      return await this.prisma.$transaction(async (transaction) => {
        await transaction.courseLesson.deleteMany({
          where: { courseId },
        });
        return transaction.course.update({
          where: { id: courseId },
          data: {
            slug: input.slug,
            title: input.title,
            description: input.description,
            level: input.level,
            isFree: input.isFree,
            status: CourseStatus.DRAFT,
            approvedById: null,
            publishedById: null,
            publishedAt: null,
            reviewFeedback: null,
            lessons: { create: this.toLessonCreate(input.lessons) },
          },
          include: courseManagerInclude,
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A course with this slug already exists.');
      }
      throw error;
    }
  }

  async submitForReview(user: JwtUser, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { lessons: { select: { title: true, content: true } } },
    });
    if (!course) throw new NotFoundException('Course was not found.');
    if (user.role !== Role.MODERATOR || course.instructorId !== user.sub) {
      throw new ForbiddenException('You can only submit your own courses.');
    }
    if (course.status !== CourseStatus.DRAFT && course.status !== CourseStatus.REJECTED) {
      throw new BadRequestException('This course is not ready for review.');
    }
    if (
      !course.lessons.length ||
      course.lessons.some((lesson) => !lesson.title.trim() || lesson.content.trim().length < 10)
    ) {
      throw new BadRequestException(
        'Add at least one complete lesson before submitting the course.',
      );
    }
    return this.prisma.course.update({
      where: { id: courseId },
      data: { status: CourseStatus.PENDING_REVIEW },
      include: courseManagerInclude,
    });
  }

  async updateCourseStatus(user: JwtUser, courseId: string, input: UpdateCourseStatusDto) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can review courses.');
    }
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, status: true, isFree: true },
    });
    if (!course) throw new NotFoundException('Course was not found.');

    const isValidTransition =
      (course.status === CourseStatus.PENDING_REVIEW &&
        (input.status === CourseStatus.APPROVED || input.status === CourseStatus.REJECTED)) ||
      (course.status === CourseStatus.APPROVED &&
        (input.status === CourseStatus.PUBLISHED || input.status === CourseStatus.REJECTED));
    if (!isValidTransition) {
      throw new BadRequestException(
        `Course cannot transition from ${course.status} to ${input.status}.`,
      );
    }
    if (input.status === CourseStatus.REJECTED && !input.feedback?.trim()) {
      throw new BadRequestException('Add review feedback when returning a course for changes.');
    }
    if (input.status === CourseStatus.PUBLISHED && !course.isFree) {
      throw new BadRequestException(
        'Paid courses cannot be published until course payments are available.',
      );
    }
    return this.prisma.course.update({
      where: { id: courseId },
      data: {
        status: input.status,
        approvedById: input.status === CourseStatus.APPROVED ? user.sub : undefined,
        publishedById: input.status === CourseStatus.PUBLISHED ? user.sub : null,
        publishedAt: input.status === CourseStatus.PUBLISHED ? new Date() : null,
        reviewFeedback:
          input.status === CourseStatus.REJECTED
            ? input.feedback!.trim()
            : input.status === CourseStatus.APPROVED
              ? null
              : undefined,
      },
      include: courseManagerInclude,
    });
  }

  private toLessonCreate(lessons: CreateCourseDto['lessons']) {
    return lessons.map((lesson, position) => ({
      title: lesson.title,
      content: lesson.content,
      videoUrl: lesson.videoUrl || null,
      position,
      resources: {
        create: lesson.resources.map((resource, resourcePosition) => ({
          title: resource.title,
          url: resource.url,
          position: resourcePosition,
        })),
      },
    }));
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
