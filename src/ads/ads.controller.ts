import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@prisma/client';
import { AdsService } from './ads.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { ReviewAdDto } from './dto/review-ad.dto';
import { TrackAdEventDto } from './dto/track-ad-event.dto';

@ApiTags('Advertisements')
@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Get('active')
  @ApiOperation({ summary: 'List currently active advertisements.' })
  @ApiOkResponse({ description: 'Active advertisements loaded.' })
  findActive() {
    return this.adsService.findActive();
  }

  @Post(':id/events')
  @ApiOperation({ summary: 'Record an active advertisement impression or click.' })
  @ApiCreatedResponse({ description: 'Advertisement event recorded.' })
  trackEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: TrackAdEventDto,
    @Req() request: Request & { user?: JwtUser },
  ) {
    return this.adsService.trackEvent(request.user, id, input);
  }

  @Get('manage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List advertisements for staff review and management.' })
  @ApiOkResponse({ description: 'Manageable advertisements loaded.' })
  findManageable(@CurrentUser() user: JwtUser) {
    return this.adsService.findManageable(user);
  }

  @Post('manage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create an advertisement or submit a moderator proposal.' })
  @ApiCreatedResponse({ description: 'Advertisement created or proposed.' })
  @ApiForbiddenResponse({ description: 'Only staff can submit advertisements.' })
  create(@CurrentUser() user: JwtUser, @Body() input: CreateAdDto) {
    return this.adsService.create(user, input);
  }

  @Post('manage/:id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Approve or reject a moderator advertisement proposal.' })
  @ApiOkResponse({ description: 'Advertisement decision saved.' })
  review(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: ReviewAdDto,
  ) {
    return this.adsService.review(user, id, input);
  }
}
