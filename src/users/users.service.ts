import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/create-account.dto';
import { LoginAccountInput } from './dtos/login-account.dto';
import { User } from './entities/user.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { EditAccoutInput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verifications: Repository<Verification>,
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
      const user = await this.users.save(
        this.users.create({ email, password, role }),
      );
      await this.verifications.save(
        this.verifications.create({
          user,
        }),
      );
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
      const user = await this.users.findOne({
        where: { email },
        select: ['id', 'password'],
      });
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
      user.verified = false;
      await this.verifications.save(this.verifications.create({ user }));
    }
    if (password) {
      user.password = password;
    }
    return this.users.save(user);
  }

  async verifyEmail(code: string): Promise<boolean> {
    try {
      const verification = await this.verifications.findOne({
        where: { code },
        relations: ['user'],
      });
      if (verification) {
        verification.user.verified = true;
        this.users.save(verification.user);
        return true;
      }
    } catch (e) {
      console.log(e);
      return false;
    }
  }
}
