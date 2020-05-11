import { Injectable, NotFoundException } from '@nestjs/common';
import { RedisService } from '../../shared/redis/redis.service';
import { FirebaseService } from '../../shared/firebase/firebase.service';
import { AlertService, Alert } from '../../helpers/alert.service';

@Injectable()
export class AdminService {

  constructor(
    private readonly redisService: RedisService,
    private readonly firebaseService: FirebaseService,
    private readonly alertService: AlertService
  ) { }

  reset() {
    this.redisService.flushall();
  }

  async userNotify(uid: string, title: string, body: string) {

    const token = await this.redisService.hget('pushtokens', uid) as string;

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

  async triggerAlert(alertID: string, price: number, timestamp: number) {
    let alertStr = await this.redisService.get(`alerts:${alertID}`) as string;
    let alert:Alert = JSON.parse(alertStr) as Alert;
    //console.log("TRIGGER ALERT: %j", alert);
    await this.firebaseService.writeAlert(alertID, alert);

    let payload = this.alertService.notificationPayload(alert.s, alert.t, alert.c, alert.v, price);
    await this.userNotify(alert.u, payload.title, payload.body);

    let resetTime = this.alertService.resetTime(alert.r);
    if (resetTime) {
      await this.redisService.zadd(`fired_alerts`, resetTime, alertID);
    }
    return alert;

  }

  async getAlertsForSymbol(symbol: string) {
    let priceOverAlerts = await this.redisService.zrange(`alerts_price_over:${symbol}`, 0, -1) as Array<string>;
    var response = [];
    priceOverAlerts.forEach( str => {
      response.push(JSON.parse(str));
    })
    return response;
  }

}
