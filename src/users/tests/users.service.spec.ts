import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Verification } from '../entities/verification.entity';
import { UsersService } from '../users.service';

//Mocking repositories and services for unit testing
const mockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  findOneOrFail: jest.fn(),
  delete: jest.fn(),
});

const mockJwt = () => ({
  sign: jest.fn(() => 'signed-token'),
  verify: jest.fn(),
});

const mockMailService = () => ({
  sendVerificationEmail: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UserService', () => {
  let service: UsersService;
  let usersRepository: MockRepository<User>;
  let verificationsRepository: MockRepository<Verification>;
  let mailService: MailService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Verification),
          useValue: mockRepository(),
        },
        {
          provide: JwtService,
          useValue: mockJwt(),
        },
        {
          provide: MailService,
          useValue: mockMailService(),
        },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
    mailService = module.get<MailService>(MailService);
    jwtService = module.get<JwtService>(JwtService);
    usersRepository = module.get(getRepositoryToken(User));
    verificationsRepository = module.get(getRepositoryToken(Verification));
  });

  //Define userService using mock services
  it('service to be defined', () => {
    expect(service).toBeDefined();
  });

  //!Create Account
  describe('createAccount', () => {
    const createAccountArgs = {
      email: '',
      password: '',
      role: 0,
    };

    //?User exists
    it('should fail if user exists', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'test@test.com',
      });
      const result = await service.createAccount(createAccountArgs);
      expect(result).toMatchObject({
        ok: false,
        error: 'This email is already registered',
      });
    });

    //?Creates new user
    it('should create a new user', async () => {
      //mocks responses
      usersRepository.findOne.mockResolvedValue(undefined);
      usersRepository.create.mockReturnValue(createAccountArgs);
      usersRepository.save.mockResolvedValue(createAccountArgs);
      verificationsRepository.create.mockReturnValue({
        user: createAccountArgs,
      });
      verificationsRepository.save.mockResolvedValue({ code: 'code' });
      const result = await service.createAccount(createAccountArgs);
      //checks for account creation
      expect(usersRepository.create).toHaveBeenCalledTimes(1);
      expect(usersRepository.create).toHaveBeenCalledWith(createAccountArgs);

      //checks for account being saved
      expect(usersRepository.save).toBeCalledTimes(1);
      expect(usersRepository.save).toBeCalledWith(createAccountArgs);

      //checks for verification being created
      expect(verificationsRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.create).toHaveBeenCalledWith({
        user: createAccountArgs,
      });

      //checks for verification being saved
      expect(verificationsRepository.save).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.save).toHaveBeenCalledWith({
        user: createAccountArgs,
      });

      //checks for mail being called with verification code
      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
      );

      //checks on return value of createUser
      expect(result).toEqual({ ok: true, error: null });
    });

    //?Fails to create new user
    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(
        new Error('MOCKED ERROR IGNORE'),
      );
      const result = await service.createAccount(createAccountArgs);
      expect(result).toEqual({
        ok: false,
        error: "Couldn't create an account",
      });
    });
  });

  //!Login account
  describe('loginAccount', () => {
    const loginArgs = {
      email: '',
      password: '',
    };

    //?Fails to login on wrong username
    it("should fail if user doesn't exist", async () => {
      usersRepository.findOne.mockResolvedValue(null);
      const result = await service.loginAccount(loginArgs);
      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toEqual({
        ok: false,
        error: "This username doesn't exist",
      });
    });

    //?Fails on wrong password
    it('should fail on wrong user password', async () => {
      const mockedUser = {
        checkPassword: jest.fn(() => Promise.resolve(false)),
      };
      usersRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.loginAccount(loginArgs);
      expect(result).toEqual({ ok: false, error: 'Wrong password' });
    });

    //?Returns token on login
    it('should return token on correct password', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)),
      };
      usersRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.loginAccount(loginArgs);
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toEqual({
        ok: true,
        token: 'signed-token',
      });
    });

    //?Fails to login
    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(
        new Error('MOCKED ERROR IGNORE'),
      );
      const result = await service.loginAccount(loginArgs);
      expect(result).toEqual({ ok: false, error: "Couldn't login account" });
    });
  });

  //!Find account by ID
  describe('findById', () => {
    const findByIdArgs = {
      id: 1,
    };

    //?Finds a user by ID
    it('should find an existing user', async () => {
      usersRepository.findOneOrFail.mockResolvedValue(findByIdArgs);
      const result = await service.findById(1);
      expect(result).toEqual({
        ok: true,
        user: findByIdArgs,
      });
    });

    //?Fails on no user found or on exception
    it('should fail if no user found', async () => {
      usersRepository.findOneOrFail.mockRejectedValue(
        new Error('MOCKED ERROR IGNORE'),
      );
      const result = await service.findById(1);
      expect(result).toEqual({
        ok: false,
        error: `User with id:${findByIdArgs.id} not found`,
      });
    });
  });

  //!Edit user
  describe('editProfile', () => {
    //?Changes email
    it('should change email', async () => {
      const oldUser = {
        email: 'old@email.com',
        verified: true,
      };
      const editProfileArgs = {
        userId: 1,
        input: { email: 'changed@email.com' },
      };
      const newVerification = {
        code: 'code',
      };
      const newUser = {
        verified: false,
        email: editProfileArgs.input.email,
      };
      usersRepository.findOne.mockResolvedValue(oldUser);
      verificationsRepository.create.mockReturnValue(newVerification);
      verificationsRepository.save.mockResolvedValue(newVerification);
      await service.editProfile(editProfileArgs.userId, editProfileArgs.input);
      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: editProfileArgs.userId },
      });
      expect(verificationsRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.create).toHaveBeenCalledWith({
        user: newUser,
      });
      expect(verificationsRepository.save).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.save).toHaveBeenCalledWith(
        newVerification,
      );
      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        newUser.email,
        newVerification.code,
      );
    });
    //?Changes password
    it('should change password', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { password: 'new' },
      };
      usersRepository.findOne.mockResolvedValue({ password: 'old' });
      const result = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );
      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(editProfileArgs.input);
      expect(result).toEqual({ ok: true, error: null });
    });
    //?Fails on exception
    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(
        new Error('MOCKED ERROR IGNORE'),
      );
      const result = await service.editProfile(1, { email: '12' });
      expect(result).toEqual({
        ok: false,
        error: "Couldn't change user's account",
      });
    });
  });

  //!Verify email
  describe('verifyEmail', () => {
    //?Verifies email
    it('should verify email', async () => {
      const mockedVerification = {
        user: {
          verified: false,
        },
        id: 1,
      };
      verificationsRepository.findOne.mockResolvedValue(mockedVerification);
      const result = await service.verifyEmail('');
      expect(verificationsRepository.findOne).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.findOne).toHaveBeenCalledWith({
        relations: ['user'],
        where: expect.any(Object),
      });
      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith({ verified: true });
      expect(verificationsRepository.delete).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.delete).toHaveBeenCalledWith(
        mockedVerification.id,
      );
      expect(result).toEqual({ ok: true, error: null });
    });
    //?Fails on verification
    it('should fail on verification not found', async () => {
      verificationsRepository.findOne.mockResolvedValue(undefined);
      const result = await service.verifyEmail('');
      expect(result).toEqual({ ok: false, error: 'Verification not found' });
    });
    //?Fails on exception
    it('should fail on exception', async () => {
      verificationsRepository.findOne.mockRejectedValue(
        new Error('MOCKED ERROR IGNORE'),
      );
      const result = await service.verifyEmail('code');
      expect(result).toEqual({
        ok: false,
        error: "Couldn't verify an account",
      });
    });
  });
});
