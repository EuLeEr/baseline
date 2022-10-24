import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommunicationModule } from './bri/communication/communication.module';
import { IdentityModule } from './bri/identity/identity.module';
import { TransactionModule } from './bri/transactions/transactions.module';
import { WorkgroupModule } from './bri/workgroup/workgroup.module';
import { LoggingModule } from './shared/logging/logging.module';
import { pojos } from '@automapper/pojos';

@Module({
  imports: [
    IdentityModule,
    WorkgroupModule,
    TransactionModule,
    CommunicationModule,
    LoggingModule,
    AutomapperModule.forRoot([
      {
        name: 'classes',
        strategyInitializer: classes(),
      },
      {
        name: 'pojos',
        strategyInitializer: pojos(),
      },
    ]),
  ],
  providers: [PrismaService],
})
export class AppModule {}
