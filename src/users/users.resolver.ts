import { UseGuards } from '@nestjs/common';
import { Args, Query, Resolver, Mutation } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { AuthGuard } from 'src/auth/auth.guard';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { EditAccountOutput, EditAccoutInput } from './dtos/edit-profile.dto';
import {
  LoginAccountInput,
  LoginAccountOutput,
} from './dtos/login-account.dto';
import { UserAccountInput, UserAccountOutput } from './dtos/user-profile.dto';
import { VerifyEmailInput, VerifyEmailOutput } from './dtos/verify-email.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly userService: UsersService) {}

  //see currently logged in user based on jwt
  @UseGuards(AuthGuard)
  @Query(() => User)
  me(@AuthUser() authUser: User) {
    return authUser;
  }

  //check user based on id
  @UseGuards(AuthGuard)
  @Query(() => UserAccountOutput)
  async user(
    @Args() userAccountInput: UserAccountInput,
  ): Promise<UserAccountOutput> {
    try {
      const user = await this.userService.findById(userAccountInput.userId);
      if (!user) {
        throw Error();
      }
      return {
        ok: Boolean(user),
        user,
      };
    } catch (e) {
      return {
        error: 'User not found',
        ok: false,
      };
    }
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

  @UseGuards(AuthGuard)
  @Mutation(() => EditAccountOutput)
  async editProfile(
    @AuthUser() authUser: User,
    @Args('input') editAccoutInput: EditAccoutInput,
  ): Promise<EditAccountOutput> {
    try {
      await this.userService.editProfile(authUser.id, editAccoutInput);
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

  @Mutation(() => VerifyEmailOutput)
  async verifyEmail(
    @Args('input') verifyEmailInput: VerifyEmailInput,
  ): Promise<VerifyEmailOutput> {
    try {
      await this.userService.verifyEmail(verifyEmailInput.code);
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
}
