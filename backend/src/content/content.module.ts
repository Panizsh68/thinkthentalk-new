import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { SponsorsController } from './sponsors.controller';
import { AdminSponsorsController } from './admin-sponsors.controller';
import { SponsorsService } from './sponsors.service';
import { TeamController } from './team.controller';
import { AdminTeamController } from './admin-team.controller';
import { TeamMembersService } from './team-members.service';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { RedisModule } from '../infrastructure/cache/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [ContentService, SponsorsService, TeamMembersService],
  controllers: [ContentController, SponsorsController, AdminSponsorsController, TeamController, AdminTeamController],
})
export class ContentModule { }
