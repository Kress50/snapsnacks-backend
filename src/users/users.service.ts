import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/create-account.dto';
import { LoginAccountInput } from './dtos/login-account.dto';
import { User } from './entities/user.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { EditAccoutInput } from './dtos/edit-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
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
        token: this.jwtService.sign({ id: user.id }),
      };
    } catch (e) {
      return { ok: false, error: "Couldn't login account" };
    }
  }

  async findById(id: number): Promise<User> {
    return this.users.findOneBy({ id });
  }

  async editProfile(id: number, { email, password }: EditAccoutInput) {
    const user = await this.users.findOneBy({ id });
    if (email) {
      user.email = email;
    }
    if (password) {
      user.password = password;
    }
    return this.users.save(user);
  }
}
