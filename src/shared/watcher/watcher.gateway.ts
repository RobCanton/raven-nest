import {
 SubscribeMessage,
 WebSocketGateway,
 OnGatewayInit,
 WebSocketServer,
 OnGatewayConnection,
 OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { StockMessage, StockTradeMessage, StockQuoteMessage } from './watcher.model';

@WebSocketGateway()
export class WatcherGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('WatcherGateway');

  @SubscribeMessage('msgToServer')
  handleMessage(client: Socket, payload: string): void {
    //console.log(`message: ${client.id} | ${payload}`);
    this.server.emit('msgToClient', payload);
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, payload: string): void {
    console.log(`Client: ${client.id} request to join ${payload}`);
    client.join(payload.toUpperCase());
  }

  @SubscribeMessage('leave')
  handleLeave(client: Socket, payload: string): void {
    console.log(`Client: ${client.id} request to leave ${payload}`);
    client.leave(payload.toUpperCase());
  }

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  sendStockTradeMessage(message:StockTradeMessage) {
    this.server.to(message.sym).emit(`T.${message.sym}`, message);
  }

  sendStockQuoteMessage(message:StockQuoteMessage) {
    this.server.to(message.sym).emit(`Q.${message.sym}`, message);
  }
  
}
