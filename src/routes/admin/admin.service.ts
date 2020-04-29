import { Injectable, NotFoundException } from '@nestjs/common';
import { RedisService } from '../../shared/redis/redis.service';
import { FirebaseService } from '../../shared/firebase/firebase.service';

@Injectable()
export class AdminService {

  constructor(
    private readonly redisService: RedisService,
    private readonly firebaseService: FirebaseService
  ) { }

  reset() {
    this.redisService.flushall();
  }

  async userNotify(uid: string, title: string, body: string) {

    const token = await this.redisService.hget('pushtokens', uid) as string;
    console.log(`${token} -> ${title}: ${body}`);
    if (token) {
      await this.firebaseService.sendNotification(token, title, body);
      return {
        success: true,
        status: 'sent'
      }
    } else {
      return {
        success: false,
        status: 'failed'
      }
    }



  }

}
