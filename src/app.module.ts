import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EncodingModule } from './encoding/encoding.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    EncodingModule,
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.ATLAS_MONGO_CONNECTION_STRING, {
      dbName: 'encoding',
    }),
  ],
})
export class AppModule {}
