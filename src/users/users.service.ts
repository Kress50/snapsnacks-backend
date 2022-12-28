import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/create-account.dto';
import { LoginAccountInput } from './dtos/login-account.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<string | undefined> {
    try {
      // checks if user exists
      const exists = await this.users.findOneBy({ email });
      if (exists) {
        return 'This email is already registered';
      }
      await this.users.save(this.users.create({ email, password, role }));
    } catch (e) {
      return "Couldn't create account";
    }
  }

  async loginAccount({ email, password }: LoginAccountInput): Promise<{
    ok: boolean;
    error?: string;
    token?: string;
  }> {
    try {
      //checks if user exists
      const user = await this.users.findOneBy({ email });
      if (!user) {
        return {
          ok: false,
          error: "This username doesn't exist",
        };
      }

      //checks for validity of password
      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) {
        return { ok: false, error: 'Wrong password' };
      }
      return {
        ok: true,
        token: 'test1111',
      };
    } catch (e) {
      return { ok: false, error: "Couldn't login account" };
    }
  }
}
