import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppGateway } from './app.gateway';
import { AdminModule } from './routes/admin/admin.module';
import { UserModule } from './routes/user/user.module';
import { ReferenceModule } from './routes/ref/reference.module';
import { RedisModule } from './shared/redis/redis.module';
import { FirebaseModule } from './shared/firebase/firebase.module';
import { PolygonModule } from './shared/polygon/polygon.module';
import { IEXModule } from './shared/iex/iex.module';
import { LoggerMiddleware } from './middleware/logger/logger.middleware';

import * as serviceAccount from './service_key.json';

const firebase_security_params = {
  type: serviceAccount.type,
  projectId: serviceAccount.project_id,
  privateKeyId: serviceAccount.private_key_id,
  privateKey: serviceAccount.private_key,
  clientEmail: serviceAccount.client_email,
  clientId: serviceAccount.client_id,
  authUri: serviceAccount.auth_uri,
  tokenUri: serviceAccount.token_uri,
  authProviderX509CertUrl: serviceAccount.auth_provider_x509_cert_url,
  clientC509CertUrl: serviceAccount.client_x509_cert_url
}


@Module({
  imports: [

    RedisModule.register({
      url: "rediss://default:t6xury3q46xdy1qq@raven-redis-cluster-do-user-1543049-0.a.db.ondigitalocean.com:25061"
    }),
    FirebaseModule.register({
      security_params: firebase_security_params,
      databaseURL: "https://stock-raven.firebaseio.com/",
      storageBucket: "gs://stock-raven.appspot.com/"
    }),
    PolygonModule.register({
      apiKey: 'P4GNjFy1Uk0a21ZUhjkNF227Kxoud_57KGRTV4'
    }),
    IEXModule.register({
      apiKey: 'pk_03e4439873e34bcc9aa48865912ad73d'
    }),
    AdminModule,
    UserModule,
    ReferenceModule
  ],
  controllers: [AppController],
  providers: [AppService, AppGateway],
})
export class AppModule  implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');
  }
}
