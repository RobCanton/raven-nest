import { Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { Request, Response } from 'express';
import { FirebaseService } from '../../shared/firebase/firebase.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly firebaseService: FirebaseService) {}

  async use(req: Request, res: Response, next: () => void) {

    try {
      let token = req.headers.authorization;
      const decodedToken = await this.firebaseService.authenticate(token);
      console.log('\nAuthenticated: ' + decodedToken.uid);
      req['uid'] = decodedToken.uid;
      next();

    } catch (e) {
      console.log(e);
       throw new UnauthorizedException('Invalid email or password');
    }

  }
}
