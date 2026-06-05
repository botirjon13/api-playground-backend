import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { UserResponseDto } from './user-response.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Return the authenticated user profile.' })
  @ApiOkResponse({ description: 'Authenticated user profile.', type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT bearer token.' })
  me(@CurrentUser() user: JwtUser): Promise<UserResponseDto> {
    return this.usersService.findProfileById(user.sub);
  }
}
