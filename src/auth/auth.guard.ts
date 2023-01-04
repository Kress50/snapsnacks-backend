import { Injectable } from '@nestjs/common/decorators';
import { CanActivate, ExecutionContext } from '@nestjs/common/interfaces';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { AllowedRoles } from './role.decorator';
import { JwtService } from 'src/jwt/jwt.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}
  async canActivate(context: ExecutionContext) {
    //gets metadata from the resolvers
    const roles = this.reflector.get<AllowedRoles>(
      'roles',
      context.getHandler(),
    );
    //if no role provided by the resolver, function is public
    if (!roles) return true;
    //checks for valid user context (authentication and authorization)
    const gqlContext = GqlExecutionContext.create(context).getContext();
    //gets token from context
    const token = gqlContext.token;
    if (token) {
      //decodes token
      const decoded = this.jwtService.verify(token.toString());
      if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
        const { user } = await this.userService.findById(decoded['id']);
        //if context check fails and there is no user, forbids access to resolver
        if (!user) return false;
        gqlContext['user'] = user;
        //if context check doesn't fail and the resolver metadata is set to 'any' allows access to any existing user
        if (roles.includes('Any')) return true;
        //returns boolean based on whether resolver metadata includes the users role
        return roles.includes(user.role);
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
}
