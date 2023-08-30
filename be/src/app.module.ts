import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GatewayService } from './gateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, GatewayService],
})
export class AppModule {}
