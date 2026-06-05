import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserResponseDto } from '../users/user-response.dto';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { LoginResponseDto, RegisterResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtUser } from './interfaces/jwt-user.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new student account.' })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    description: 'User registered successfully.',
    type: RegisterResponseDto,
  })
  @ApiConflictResponse({ description: 'A user with this email already exists.' })
  register(@Body() registerDto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate a user and return a JWT access token.' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'Login successful.', type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password.' })
  login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Return the current authenticated user profile.' })
  @ApiOkResponse({ description: 'Authenticated user profile.', type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT bearer token.' })
  profile(@CurrentUser() user: JwtUser): Promise<UserResponseDto> {
    return this.usersService.findProfileById(user.sub);
  }
}
