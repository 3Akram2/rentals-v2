import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Databases } from 'src/shared/constants';
import { BuildingAiChat, BuildingAiChatSchema } from './building-ai-chat.model';
import { BuildingAiChatRepo } from './building-ai-chat.repo';
import { BuildingAiService } from './building-ai.service';
import { BuildingAiController } from './building-ai.controller';
import { BuildingsModule } from 'src/buildings/buildings.module';
import { PropertiesModule } from 'src/properties/properties.module';
import { PaymentsModule } from 'src/payments/payments.module';
import { UsersModule } from 'src/users/users.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: BuildingAiChat.name, schema: BuildingAiChatSchema }], Databases.Primary),
        BuildingsModule,
        PropertiesModule,
        PaymentsModule,
        UsersModule,
    ],
    controllers: [BuildingAiController],
    providers: [BuildingAiChatRepo, BuildingAiService],
    exports: [BuildingAiService],
})
export class BuildingAiModule {}
