import { Injectable } from '@nestjs/common/decorators';
import { CanActivate, ExecutionContext } from '@nestjs/common/interfaces';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { AllowedRoles } from './role.decorator';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    //gets metadata from the resolvers
    const roles = this.reflector.get<AllowedRoles>(
      'roles',
      context.getHandler(),
    );
    //if no role provided by the resolver, function is public
    if (!roles) return true;
    //checks for valid user context (authentication and authorization)
    const gqlContext = GqlExecutionContext.create(context).getContext();
    const user: User = gqlContext['user'];
    //if context check fails and there is no user, forbids access to resolver
    if (!user) return false;
    //if context check doesn't fail and the resolver metadata is set to 'any' allows access to any existing user
    if (roles.includes('Any')) return true;
    //returns boolean based on whether resolver metadata includes the users role
    return roles.includes(user.role);
  }
}
