import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Channel, Message } from "@openspawn/database";

import { EventsModule } from "../events";

import { ChannelsService } from "./channels.service";
import { MessagesController } from "./messages.controller";
import { MessagesService } from "./messages.service";

@Module({
  imports: [TypeOrmModule.forFeature([Channel, Message]), EventsModule],
  controllers: [MessagesController],
  providers: [MessagesService, ChannelsService],
  exports: [MessagesService, ChannelsService],
})
export class MessagesModule {}
