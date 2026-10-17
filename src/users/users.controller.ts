import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { AdminOverviewDto } from './admin-overview.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto } from './user-response.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('admin/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Return user statistics for administrators.' })
  @ApiOkResponse({ description: 'Admin overview loaded.', type: AdminOverviewDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT bearer token.' })
  @ApiForbiddenResponse({ description: 'Only ADMIN users can view this overview.' })
  adminOverview(): Promise<AdminOverviewDto> {
    return this.usersService.getAdminOverview();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Return the authenticated user profile.' })
  @ApiOkResponse({ description: 'Authenticated user profile.', type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT bearer token.' })
  me(@CurrentUser() user: JwtUser): Promise<UserResponseDto> {
    return this.usersService.findProfileById(user.sub);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update the authenticated user profile.' })
  @ApiOkResponse({ description: 'Authenticated user profile updated.', type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT bearer token.' })
  updateMe(
    @CurrentUser() user: JwtUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateProfile(user.sub, updateProfileDto);
  }
}
