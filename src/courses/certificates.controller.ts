import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { CoursesService } from './courses.service';

@ApiTags('Certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List certificates issued to the authenticated learner.' })
  @ApiOkResponse({ description: 'Learner certificates loaded.' })
  findMine(@CurrentUser() user: JwtUser) {
    return this.coursesService.findCertificates(user.sub);
  }

  @Get('verify/:code')
  @ApiOperation({ summary: 'Verify a certificate code.' })
  @ApiOkResponse({ description: 'Certificate verified.' })
  @ApiNotFoundResponse({ description: 'Certificate code was not found.' })
  verify(@Param('code') code: string) {
    return this.coursesService.verifyCertificate(code);
  }
}
