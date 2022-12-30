import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import {
  LoginAccountInput,
  LoginAccountOutput,
} from './dtos/login-account.dto';
import { User } from './entities/user.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { EditAccountInput, EditAccountOutput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { MailService } from 'src/mail/mail.service';
import { UserAccountOutput } from './dtos/user-profile.dto';
import { VerifyEmailOutput } from './dtos/verify-email.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verifications: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      // checks if user exists
      const exists = await this.users.findOne({ where: { email } });
      if (exists) {
        return { ok: false, error: 'This email is already registered' };
      }
      const user = await this.users.save(
        this.users.create({ email, password, role }),
      );
      const verification = await this.verifications.save(
        this.verifications.create({
          user,
        }),
      );
      this.mailService.sendVerificationEmail(user.email, verification.code);
      return { ok: true, error: null };
    } catch (e) {
      // console.log(e);
      return { ok: false, error: "Couldn't create an account" };
    }
  }

  async loginAccount({
    email,
    password,
  }: LoginAccountInput): Promise<LoginAccountOutput> {
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
      // console.log(e);
      return { ok: false, error: "Couldn't login account" };
    }
  }

  async findById(id: number): Promise<UserAccountOutput> {
    try {
      const user = await this.users.findOneOrFail({ where: { id } });
      return {
        ok: true,
        user: user,
      };
    } catch (e) {
      // console.log(e);
      return {
        ok: false,
        error: `User with id:${id} not found`,
      };
    }
  }

  async editProfile(
    id: number,
    { email, password }: EditAccountInput,
  ): Promise<EditAccountOutput> {
    try {
      const user = await this.users.findOne({ where: { id } });
      if (email) {
        user.email = email;
        user.verified = false;
        const verification = await this.verifications.save(
          this.verifications.create({ user }),
        );
        this.mailService.sendVerificationEmail(user.email, verification.code);
      }
      if (password) {
        user.password = password;
      }
      await this.users.save(user);
      return {
        ok: true,
        error: null,
      };
    } catch (e) {
      // console.log(e);
      return {
        ok: false,
        error: "Couldn't change user's account",
      };
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verifications.findOne({
        where: { code },
        relations: ['user'],
      });
      if (verification) {
        verification.user.verified = true;
        this.users.save(verification.user);
        this.verifications.delete(verification.id);
        return {
          ok: true,
          error: null,
        };
      }
      return { ok: false, error: 'Verification not found' };
    } catch (e) {
      // console.log(e);
      return {
        ok: false,
        error: "Couldn't verify an account",
      };
    }
  }
}
