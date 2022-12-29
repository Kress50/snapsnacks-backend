import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { UsersService } from 'src/users/users.service';
import { JwtService } from './jwt.service';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}

  // finds the user based on jwt token to put onto req
  async use(req: Request, res: Response, next: NextFunction) {
    if ('x-jwt' in req.headers) {
      //gets token from header
      const token = req.headers['x-jwt'];
      //decodes token
      try {
        const decoded = this.jwtService.verify(token.toString());
        //if token has an id, tries to find the user in db
        if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
          const user = await this.userService.findById(decoded['id']);
          req['user'] = user;
        }
      } catch (e) {
        //throws 500 if token is wrong
      }
    }
    next();
  }
}
