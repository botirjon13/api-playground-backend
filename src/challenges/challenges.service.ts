import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { ChallengeEntity } from './entities/challenge.entity';

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

  async findAll(): Promise<ChallengeEntity[]> {
    const challenges = await this.prisma.challenge.findMany({
      where: { is_active: true },
      orderBy: { created_at: 'desc' },
    });

    return challenges as ChallengeEntity[];
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
}
