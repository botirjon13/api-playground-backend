import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdStatus, Role } from '@prisma/client';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { ReviewAdDto } from './dto/review-ad.dto';
import { TrackAdEventDto } from './dto/track-ad-event.dto';

@Injectable()
export class AdsService {
  constructor(private readonly prisma: PrismaService) {}

  async findActive() {
    const now = new Date();
    await this.prisma.adCampaign.updateMany({
      where: { status: AdStatus.ACTIVE, endsAt: { lte: now } },
      data: { status: AdStatus.EXPIRED },
    });
    return this.prisma.adCampaign.findMany({
      where: {
        status: AdStatus.ACTIVE,
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
      orderBy: [{ startsAt: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        imageUrl: true,
        targetUrl: true,
        endsAt: true,
        durationDays: true,
        status: true,
      },
    });
  }

  async trackEvent(user: JwtUser | undefined, adId: string, input: TrackAdEventDto) {
    const now = new Date();
    const ad = await this.prisma.adCampaign.findFirst({
      where: {
        id: adId,
        status: AdStatus.ACTIVE,
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
      select: { id: true },
    });
    if (!ad) throw new NotFoundException('Active advertisement was not found.');
    await this.prisma.adEvent.create({
      data: {
        adId,
        userId: user?.sub,
        type: input.type,
      },
    });
    return { recorded: true };
  }

  async findManageable(user: JwtUser) {
    if (user.role !== Role.ADMIN && user.role !== Role.MODERATOR) {
      throw new ForbiddenException('Only staff can manage advertisements.');
    }
    const now = new Date();
    await this.prisma.adCampaign.updateMany({
      where: { status: AdStatus.ACTIVE, endsAt: { lte: now } },
      data: { status: AdStatus.EXPIRED },
    });
    const ads = await this.prisma.adCampaign.findMany({
      where: user.role === Role.ADMIN ? {} : { proposedById: user.sub },
      orderBy: { createdAt: 'desc' },
      include: {
        proposedBy: { select: { id: true, fullName: true, email: true } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    });
    const events = await this.prisma.adEvent.groupBy({
      by: ['adId', 'type'],
      where: { adId: { in: ads.map(({ id }) => id) } },
      _count: { _all: true },
    });
    const analyticsByAd = new Map<string, { impressions: number; clicks: number }>();
    for (const event of events) {
      const analytics = analyticsByAd.get(event.adId) ?? {
        impressions: 0,
        clicks: 0,
      };
      if (event.type === 'IMPRESSION') analytics.impressions = event._count._all;
      if (event.type === 'CLICK') analytics.clicks = event._count._all;
      analyticsByAd.set(event.adId, analytics);
    }
    return ads.map((ad) => ({
      ...ad,
      analytics: analyticsByAd.get(ad.id) ?? { impressions: 0, clicks: 0 },
    }));
  }

  async create(user: JwtUser, input: CreateAdDto) {
    if (user.role !== Role.ADMIN && user.role !== Role.MODERATOR) {
      throw new ForbiddenException('Only staff can submit advertisements.');
    }
    const now = new Date();
    const end = this.addDays(now, input.durationDays);
    const isAdmin = user.role === Role.ADMIN;
    return this.prisma.adCampaign.create({
      data: {
        title: input.title,
        imageUrl: input.imageUrl,
        targetUrl: input.targetUrl,
        durationDays: input.durationDays,
        startsAt: now,
        endsAt: end,
        status: isAdmin ? AdStatus.ACTIVE : AdStatus.PENDING_REVIEW,
        proposedById: isAdmin ? null : user.sub,
        createdById: user.sub,
        approvedById: isAdmin ? user.sub : null,
      },
    });
  }

  async review(user: JwtUser, adId: string, input: ReviewAdDto) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can review advertisements.');
    }
    const ad = await this.prisma.adCampaign.findUnique({
      where: { id: adId },
    });
    if (!ad) throw new NotFoundException('Advertisement was not found.');
    if (ad.status !== AdStatus.PENDING_REVIEW) {
      throw new BadRequestException('This advertisement is not awaiting review.');
    }
    if (!input.approve && !input.feedback?.trim()) {
      throw new BadRequestException('Add feedback when declining an advertisement.');
    }
    const now = new Date();
    return this.prisma.adCampaign.update({
      where: { id: adId },
      data: input.approve
        ? {
            status: AdStatus.ACTIVE,
            startsAt: now,
            endsAt: this.addDays(now, ad.durationDays),
            approvedById: user.sub,
            reviewFeedback: null,
          }
        : {
            status: AdStatus.REJECTED,
            reviewFeedback: input.feedback!.trim(),
          },
    });
  }

  private addDays(date: Date, days: number) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }
}
