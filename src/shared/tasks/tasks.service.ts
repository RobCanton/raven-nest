import { Injectable, Logger } from '@nestjs/common';
import { Cron, Interval } from '@nestjs/schedule';
import { RedisService } from '../redis/redis.service';
import { AlertService } from '../../helpers/alert.service';


@Injectable()
export class TasksService {

  private readonly logger = new Logger('TasksService');

  constructor(
    private readonly redisService: RedisService,
    private readonly alertService: AlertService
  ) { }

  // Called every 10 seconds
  async resetAlert(alertID: string) {
    let alertStr = await this.redisService.get(`alerts:${alertID}`) as string;
    if (!alertStr) {
      await this.redisService.zrem(`fired_alerts`, alertID);
      return {}
    }

    this.logger.log(`Reset alert: ${alertID}`);

    let alert = JSON.parse(alertStr);
    let alertSuffix = this.alertService.alertSuffix(alert.t, alert.c);

    if (!alertSuffix) {
      return {
        success: false
      }
    }

    await this.redisService.zadd(`alerts_${alertSuffix}:${alert.s}`, alert.v, alertID);
    await this.redisService.zrem(`fired_alerts`, alertID);

    return {}

  }
  @Interval(10000)
  async alertsResetter() {
    let alertsForReset = await this.redisService.zrangebyscore(`fired_alerts`, 0, Date.now()) as Array<string>;

    var promises = [];
    alertsForReset.forEach( alertID => {
      promises.push(this.resetAlert(alertID));
    })

    return Promise.all(promises);

  }
}
