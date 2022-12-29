import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver, Mutation, Context } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { AuthGuard } from 'src/auth/auth.guard';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import {
  LoginAccountInput,
  LoginAccountOutput,
} from './dtos/login-account.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly userService: UsersService) {}

  @Query(() => Boolean)
  test() {
    return true;
  }

  //see currently logged in user based on jwt
  @Query(() => User)
  @UseGuards(AuthGuard)
  me(@AuthUser() authUser: User) {
    return authUser;
  }

  @Mutation(() => CreateAccountOutput)
  async createAccount(
    @Args('input') createAccountInput: CreateAccountInput,
  ): Promise<CreateAccountOutput> {
    try {
      const error = await this.userService.createAccount(createAccountInput);
      //pulling handled error from service if it exists => errors
      if (error) {
        return {
          ok: false,
          error,
        };
      }
      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  @Mutation(() => LoginAccountOutput)
  async loginAccount(
    @Args('input') loginAccountInput: LoginAccountInput,
  ): Promise<LoginAccountOutput> {
    try {
      return await this.userService.loginAccount(loginAccountInput);
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }
}
