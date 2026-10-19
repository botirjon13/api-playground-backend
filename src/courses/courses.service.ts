import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  CourseCompletionStatus,
  CourseStatus,
  EnrollmentStatus,
  FinalTestAttemptStatus,
  Prisma,
  Role,
} from '@prisma/client';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CourseDto, CourseEnrollmentDto } from './course.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { ReviewCompletionDto, ReviewFinalTestDto } from './dto/review-completion.dto';
import { SubmitFinalTestDto } from './dto/submit-final-test.dto';
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
  isFree: true,
  passingScore: true,
  lessons: {
    orderBy: { position: 'asc' as const },
    include: {
      resources: { orderBy: { position: 'asc' as const } },
      completions: { select: { lessonId: true } },
    },
  },
  instructor: { select: { fullName: true } },
  finalQuestions: { orderBy: { position: 'asc' as const } },
};

const courseManagerInclude = {
  ...courseContentInclude,
  instructor: { select: { id: true, fullName: true, email: true } },
  finalQuestions: {
    orderBy: { position: 'asc' as const },
  },
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
        finalQuestions: { select: { id: true } },
        lessons: {
          orderBy: { position: 'asc' },
          select: { id: true, title: true, position: true },
        },
      },
    });
    if (!course) throw new NotFoundException('Published course was not found');
    return { ...course, hasFinalTest: course.finalQuestions.length > 0, finalQuestions: undefined };
  }

  async findLearningContent(user: JwtUser, slug: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        slug,
        status: CourseStatus.PUBLISHED,
        enrollments: {
          some: {
            userId: user.sub,
            status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED] },
          },
        },
      },
      select: {
        ...enrolledCourseSelect,
        lessons: {
          ...enrolledCourseSelect.lessons,
          include: {
            resources: { orderBy: { position: 'asc' } },
            completions: {
              where: { userId: user.sub },
              select: { lessonId: true },
            },
          },
        },
        finalQuestions: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            prompt: true,
            optionA: true,
            optionB: true,
            optionC: true,
            optionD: true,
            position: true,
          },
        },
        finalTestAttempts: {
          where: { userId: user.sub },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, score: true, status: true, reviewFeedback: true },
        },
        completionReviews: {
          where: { userId: user.sub },
          select: { id: true, status: true, feedback: true },
        },
        enrollments: {
          where: { userId: user.sub },
          select: { status: true },
        },
        certificates: {
          where: { userId: user.sub },
          select: { id: true, code: true, issuedAt: true, recipientName: true },
        },
      },
    });
    if (!course) {
      throw new NotFoundException('Enrolled published course was not found');
    }
    return course;
  }

  async completeLesson(user: JwtUser, slug: string, lessonId: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        slug,
        status: CourseStatus.PUBLISHED,
        enrollments: {
          some: {
            userId: user.sub,
            status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED] },
          },
        },
      },
      select: {
        id: true,
        isFree: true,
        lessons: { select: { id: true } },
        finalQuestions: { select: { id: true }, take: 1 },
      },
    });
    if (!course) throw new NotFoundException('Enrolled published course was not found.');
    if (!course.lessons.some((lesson) => lesson.id === lessonId)) {
      throw new NotFoundException('Lesson was not found in this course.');
    }

    await this.prisma.courseLessonCompletion.upsert({
      where: { userId_lessonId: { userId: user.sub, lessonId } },
      create: { userId: user.sub, lessonId },
      update: {},
    });
    const completedCount = await this.prisma.courseLessonCompletion.count({
      where: { userId: user.sub, lesson: { courseId: course.id } },
    });
    const allLessonsComplete =
      course.lessons.length > 0 && completedCount === course.lessons.length;
    const hasFinalTest = course.finalQuestions.length > 0;

    let completion:
      'IN_PROGRESS' | 'FINAL_TEST_REQUIRED' | 'CERTIFICATE_ISSUED' | 'PENDING_REVIEW' =
      'IN_PROGRESS';
    if (allLessonsComplete && hasFinalTest) {
      completion = 'FINAL_TEST_REQUIRED';
    } else if (allLessonsComplete) {
      completion = await this.completeCourse(user.sub, course.id, course.isFree);
    }
    return {
      completedLessons: completedCount,
      totalLessons: course.lessons.length,
      completion,
    };
  }

  async submitFinalTest(user: JwtUser, slug: string, input: SubmitFinalTestDto) {
    const course = await this.prisma.course.findFirst({
      where: {
        slug,
        status: CourseStatus.PUBLISHED,
        enrollments: {
          some: {
            userId: user.sub,
            status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED] },
          },
        },
      },
      select: {
        id: true,
        isFree: true,
        passingScore: true,
        lessons: { select: { id: true } },
        finalQuestions: {
          orderBy: { position: 'asc' },
          select: { correctOption: true },
        },
        certificates: {
          where: { userId: user.sub },
          select: { id: true },
          take: 1,
        },
        finalTestAttempts: {
          where: {
            userId: user.sub,
            status: FinalTestAttemptStatus.PENDING_REVIEW,
          },
          select: { id: true },
          take: 1,
        },
      },
    });
    if (!course) throw new NotFoundException('Enrolled published course was not found.');
    if (!course.finalQuestions.length) {
      throw new BadRequestException('This course does not have a final test.');
    }
    if (course.certificates.length) {
      throw new BadRequestException('A certificate has already been issued for this course.');
    }
    if (course.finalTestAttempts.length) {
      throw new BadRequestException('A final-test attempt is already awaiting moderator review.');
    }
    if (input.answers.length !== course.finalQuestions.length) {
      throw new BadRequestException('Submit one answer for every final-test question.');
    }
    const completedLessons = await this.prisma.courseLessonCompletion.count({
      where: { userId: user.sub, lesson: { courseId: course.id } },
    });
    if (completedLessons !== course.lessons.length) {
      throw new BadRequestException('Complete every course lesson before taking the final test.');
    }

    const correct = input.answers.reduce(
      (count, answer, index) =>
        count + (answer === course.finalQuestions[index].correctOption ? 1 : 0),
      0,
    );
    const score = Math.round((correct / course.finalQuestions.length) * 100);
    const passed = score >= course.passingScore;
    const status = passed
      ? course.isFree
        ? FinalTestAttemptStatus.PASSED
        : FinalTestAttemptStatus.PENDING_REVIEW
      : FinalTestAttemptStatus.FAILED;
    const result = await this.prisma.$transaction(async (transaction) => {
      const attempt = await transaction.courseFinalTestAttempt.create({
        data: {
          userId: user.sub,
          courseId: course.id,
          answers: input.answers,
          score,
          status,
        },
        select: { id: true, score: true, status: true },
      });
      if (passed && course.isFree) {
        await this.issueCertificate(transaction, user.sub, course.id);
      }
      if (passed) {
        await transaction.courseEnrollment.update({
          where: { userId_courseId: { userId: user.sub, courseId: course.id } },
          data: {
            status: course.isFree ? EnrollmentStatus.COMPLETED : EnrollmentStatus.ACTIVE,
          },
        });
      }
      return attempt;
    });
    return {
      ...result,
      completion: !passed ? 'IN_PROGRESS' : course.isFree ? 'CERTIFICATE_ISSUED' : 'PENDING_REVIEW',
    };
  }

  async getCompletionReviews(user: JwtUser) {
    if (user.role !== Role.MODERATOR) {
      throw new ForbiddenException('Only moderators can review course completions.');
    }
    return this.prisma.courseCompletionReview.findMany({
      where: { course: { instructorId: user.sub }, status: CourseCompletionStatus.PENDING_REVIEW },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        course: { select: { id: true, title: true, slug: true, isFree: true } },
      },
    });
  }

  async reviewCompletion(user: JwtUser, reviewId: string, input: ReviewCompletionDto) {
    const review = await this.prisma.courseCompletionReview.findUnique({
      where: { id: reviewId },
      include: { course: { select: { id: true, instructorId: true } } },
    });
    if (!review) throw new NotFoundException('Completion review was not found.');
    if (user.role !== Role.MODERATOR || review.course.instructorId !== user.sub) {
      throw new ForbiddenException('You can only review completions for your courses.');
    }
    if (review.status !== CourseCompletionStatus.PENDING_REVIEW) {
      throw new BadRequestException('This completion request has already been reviewed.');
    }
    if (input.status === CourseCompletionStatus.REJECTED && !input.feedback?.trim()) {
      throw new BadRequestException('Provide feedback when declining course completion.');
    }
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.courseCompletionReview.update({
        where: { id: reviewId },
        data: {
          status: input.status,
          feedback: input.feedback?.trim(),
          reviewedById: user.sub,
          reviewedAt: new Date(),
        },
      });
      if (input.status === CourseCompletionStatus.APPROVED) {
        await this.issueCertificate(transaction, review.userId, review.courseId);
        await transaction.courseEnrollment.update({
          where: {
            userId_courseId: {
              userId: review.userId,
              courseId: review.courseId,
            },
          },
          data: { status: EnrollmentStatus.COMPLETED },
        });
      }
      return updated;
    });
  }

  async getFinalTestReviews(user: JwtUser) {
    if (user.role !== Role.MODERATOR) {
      throw new ForbiddenException('Only moderators can review final tests.');
    }
    return this.prisma.courseFinalTestAttempt.findMany({
      where: {
        status: FinalTestAttemptStatus.PENDING_REVIEW,
        course: { instructorId: user.sub },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        course: { select: { id: true, title: true, slug: true } },
      },
    });
  }

  async reviewFinalTest(user: JwtUser, attemptId: string, input: ReviewFinalTestDto) {
    const attempt = await this.prisma.courseFinalTestAttempt.findUnique({
      where: { id: attemptId },
      include: { course: { select: { id: true, instructorId: true } } },
    });
    if (!attempt) throw new NotFoundException('Final-test attempt was not found.');
    if (user.role !== Role.MODERATOR || attempt.course.instructorId !== user.sub) {
      throw new ForbiddenException('You can only review tests for your courses.');
    }
    if (attempt.status !== FinalTestAttemptStatus.PENDING_REVIEW) {
      throw new BadRequestException('This final-test attempt has already been reviewed.');
    }
    if (input.status === FinalTestAttemptStatus.REJECTED && !input.feedback?.trim()) {
      throw new BadRequestException('Provide feedback when declining a final test.');
    }
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.courseFinalTestAttempt.update({
        where: { id: attemptId },
        data: {
          status: input.status,
          reviewFeedback: input.feedback?.trim(),
          reviewedById: user.sub,
          reviewedAt: new Date(),
        },
      });
      if (input.status === FinalTestAttemptStatus.APPROVED) {
        await transaction.courseEnrollment.update({
          where: {
            userId_courseId: { userId: attempt.userId, courseId: attempt.courseId },
          },
          data: { status: EnrollmentStatus.COMPLETED },
        });
        await this.issueCertificate(transaction, attempt.userId, attempt.courseId);
      }
      return updated;
    });
  }

  async findCertificates(userId: string) {
    return this.prisma.courseCertificate.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
      select: {
        id: true,
        code: true,
        issuedAt: true,
        recipientName: true,
        course: { select: { id: true, slug: true, title: true } },
      },
    });
  }

  async verifyCertificate(code: string) {
    const certificate = await this.prisma.courseCertificate.findUnique({
      where: { code },
      select: {
        code: true,
        issuedAt: true,
        recipientName: true,
        course: { select: { title: true } },
      },
    });
    if (!certificate) throw new NotFoundException('Certificate was not found.');
    return certificate;
  }

  private async completeCourse(userId: string, courseId: string, isFree: boolean) {
    if (isFree) {
      await this.prisma.$transaction(async (transaction) => {
        await transaction.courseEnrollment.update({
          where: { userId_courseId: { userId, courseId } },
          data: { status: EnrollmentStatus.COMPLETED },
        });
        await this.issueCertificate(transaction, userId, courseId);
      });
      return 'CERTIFICATE_ISSUED' as const;
    }
    await this.prisma.courseCompletionReview.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId },
      update: {
        status: CourseCompletionStatus.PENDING_REVIEW,
        feedback: null,
        reviewedById: null,
        reviewedAt: null,
      },
    });
    return 'PENDING_REVIEW' as const;
  }

  private async issueCertificate(
    transaction: Prisma.TransactionClient,
    userId: string,
    courseId: string,
  ) {
    const user = await transaction.user.findUnique({
      where: { id: userId },
      select: { fullName: true },
    });
    if (!user) throw new NotFoundException('Certificate recipient was not found.');

    return transaction.courseCertificate.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: {
        userId,
        courseId,
        recipientName: user.fullName?.trim() || 'OsonTrack tinglovchisi',
        code: randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase(),
      },
      update: {},
    });
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
          passingScore: input.passingScore ?? 70,
          instructorId: user.sub,
          lessons: { create: this.toLessonCreate(input.lessons) },
          finalQuestions: {
            create: this.toFinalQuestionCreate(input.finalQuestions ?? []),
          },
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
        await transaction.courseFinalQuestion.deleteMany({ where: { courseId } });
        return transaction.course.update({
          where: { id: courseId },
          data: {
            slug: input.slug,
            title: input.title,
            description: input.description,
            level: input.level,
            isFree: input.isFree,
            passingScore: input.passingScore ?? 70,
            status: CourseStatus.DRAFT,
            approvedById: null,
            publishedById: null,
            publishedAt: null,
            reviewFeedback: null,
            lessons: { create: this.toLessonCreate(input.lessons) },
            finalQuestions: {
              create: this.toFinalQuestionCreate(input.finalQuestions ?? []),
            },
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

  private toFinalQuestionCreate(questions: NonNullable<CreateCourseDto['finalQuestions']>) {
    return questions.map((question, position) => ({ ...question, position }));
  }

  async findMyEnrollments(userId: string): Promise<CourseEnrollmentDto[]> {
    return this.prisma.courseEnrollment.findMany({
      where: {
        userId,
        status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED] },
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
      update: {},
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

  async completeMissionOne(userId: string) {
    const course = await this.prisma.course.findFirst({
      where: { slug: 'rest-api-basics', status: CourseStatus.PUBLISHED },
      select: { id: true, isFree: true, finalQuestions: { select: { id: true } } },
    });
    if (!course || course.finalQuestions.length > 0) return;
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId: course.id } },
      select: { status: true },
    });
    if (!enrollment) return;
    if (!course.isFree) {
      await this.prisma.courseCompletionReview.upsert({
        where: { userId_courseId: { userId, courseId: course.id } },
        create: { userId, courseId: course.id },
        update: {},
      });
      return;
    }
    await this.prisma.$transaction(async (transaction) => {
      await transaction.courseEnrollment.update({
        where: { userId_courseId: { userId, courseId: course.id } },
        data: { status: EnrollmentStatus.COMPLETED },
      });
      await this.issueCertificate(transaction, userId, course.id);
    });
  }
}
