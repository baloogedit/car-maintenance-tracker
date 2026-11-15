import {Body, Controller, Get, HttpCode, HttpStatus, Post, Query} from '@nestjs/common';
import {ApiBearerAuth, ApiGoneResponse, ApiOkResponse, ApiTags} from '@nestjs/swagger';

import {CurrentUser} from '../shared/decorators/current-user.decorator';
import type {JwtPayload} from '../shared/interfaces/jwt-payload.interface';
import {SyncPullQueryDto} from './dto/input/sync-pull-query.dto';
import {SyncPushRequestDto} from './dto/input/sync-push-request.dto';
import {SyncPullResponseDto} from './dto/output/sync-pull-response.dto';
import {SyncPushResponseDto} from './dto/output/sync-push-response.dto';
import {SyncPullService} from './pull/sync-pull.service';
import {SyncPushService} from './push/sync-push.service';

// Offline-first szinkron: egy kor mindig push-sal kezdodik es pull-lal zarul.
@ApiTags('sync')
@ApiBearerAuth()
@Controller('sync')
export class SyncController {
  constructor(
    private readonly pushService: SyncPushService,
    private readonly pullService: SyncPullService,
  ) {}

  // 200 akkor is, ha egyes mutationok elutasitva: az eredmeny mutationonkent jon.
  @Post('push')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({type: SyncPushResponseDto})
  push(@CurrentUser() user: JwtPayload, @Body() dto: SyncPushRequestDto) {
    return this.pushService.push(user, dto);
  }

  @Get('pull')
  @ApiOkResponse({type: SyncPullResponseDto})
  @ApiGoneResponse({description: 'SYNC_RESET_REQUIRED: teljes ujraszinkron kell (since=0)'})
  pull(@CurrentUser() user: JwtPayload, @Query() query: SyncPullQueryDto) {
    return this.pullService.pull(user, query);
  }
}
