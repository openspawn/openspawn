import type { HttpClient } from '../http-client';
import type { ApiResponse, RequestOptions } from '../types';
import { MessageType, ChannelType } from '../shared-types';

/**
 * Message-related types
 */
export interface Message {
  id: string;
  channelId: string;
  authorId: string;
  body: string;
  type: MessageType;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  orgId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface SendMessageDto {
  channelId: string;
  body: string;
  type?: MessageType;
  metadata?: Record<string, unknown>;
}

/**
 * Messages Resource
 */
export class MessagesResource {
  constructor(private http: HttpClient) {}

  /**
   * Send a message to a channel
   */
  async send(
    channelId: string,
    body: string,
    type: MessageType = MessageType.TEXT,
    options?: RequestOptions
  ): Promise<Message> {
    const response = await this.http.post<ApiResponse<Message>>(
      '/messages',
      { channelId, body, type },
      options
    );
    return response.data;
  }

  /**
   * List messages in a channel
   */
  async list(
    channelId: string,
    limit = 50,
    options?: RequestOptions
  ): Promise<Message[]> {
    const response = await this.http.get<ApiResponse<Message[]>>(
      `/messages?channelId=${channelId}&limit=${limit}`,
      options
    );
    return response.data;
  }

  /**
   * List all channels
   */
  async listChannels(options?: RequestOptions): Promise<Channel[]> {
    const response = await this.http.get<ApiResponse<Channel[]>>(
      '/channels',
      options
    );
    return response.data;
  }

  /**
   * Get a specific channel by ID
   */
  async getChannel(id: string, options?: RequestOptions): Promise<Channel> {
    const response = await this.http.get<ApiResponse<Channel>>(
      `/channels/${id}`,
      options
    );
    return response.data;
  }

  /**
   * Create a new channel
   */
  async createChannel(
    name: string,
    type: ChannelType,
    metadata?: Record<string, unknown>,
    options?: RequestOptions
  ): Promise<Channel> {
    const response = await this.http.post<ApiResponse<Channel>>(
      '/channels',
      { name, type, metadata },
      options
    );
    return response.data;
  }

  /**
   * Send a direct message to an agent
   */
  async sendDM(
    toAgentId: string,
    body: string,
    options?: RequestOptions
  ): Promise<Message> {
    // In most systems, DMs are just messages in special channels
    // This is a convenience method that might need adjustment based on API
    const response = await this.http.post<ApiResponse<Message>>(
      '/messages/dm',
      { toAgentId, body },
      options
    );
    return response.data;
  }
}
