import { Injectable, Logger } from '@nestjs/common';
import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class GatewayService implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    
  private cursorDataListener: { x: number, y: number, userId: string }[] = [];

  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('CursorGateway');

  afterInit(server: Server) {
    this.logger.log('Initialized!');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client discWebSocketServeronnected: ${client.id}`);
  }

  @SubscribeMessage('cursor')
  handleMessage(client: Socket, payload: { x: number, y: number, userId: string }): void {
    this.cursorDataListener.push(payload);
    this.server.emit('cursor-update', this.cursorDataListener.filter(x => x.userId === payload.userId).slice(-10));
    client.broadcast.emit('cursor-update', this.cursorDataListener.filter(x => x.userId === payload.userId).slice(-10));
  }
}