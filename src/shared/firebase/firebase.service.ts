import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import * as firebase from 'firebase-admin';

@Injectable()
export class FirebaseService {

  constructor(@Inject('CONFIG_OPTIONS') private options) {

    firebase.initializeApp({
      credential: firebase.credential.cert(options.security_params),
      databaseURL: options.databaseURL,
      storageBucket: options.storageBucket
    });

  }

  async authenticate(token: string) {
    return firebase.auth().verifyIdToken(token);
  }

  async sendNotification(token: string, title: string, body: string) {
    return new Promise((resolve, reject) => {
      let payload = {
        "notification": {
          "title": title,
          "body": body,
          "badge": `0`
        }
      }

      const sendPushNotification = firebase.messaging().sendToDevice(token, payload);
      return sendPushNotification.then ( () => {
        return resolve(true);
      }).catch(e => {
        return reject(e);
      })
    });
  }


}
