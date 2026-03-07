import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Agent, Channel, Message } from "@openspawn/database";

import { EventsModule } from "../events";

import { ChannelsService } from "./channels.service";
import { DirectMessagesService } from "./direct-messages.service";
import { MessagesController } from "./messages.controller";
import { MessagesService } from "./messages.service";

@Module({
  imports: [TypeOrmModule.forFeature([Agent, Channel, Message]), EventsModule],
  controllers: [MessagesController],
  providers: [MessagesService, ChannelsService, DirectMessagesService],
  exports: [MessagesService, ChannelsService, DirectMessagesService],
})
export class MessagesModule {}
