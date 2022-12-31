import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { DataSource, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Verification } from 'src/users/entities/verification.entity';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';

jest.mock('got', () => {
  return {
    post: jest.fn(),
  };
});

const GRAPHQL_ENDPOINT = '/graphql';
const EMAIL = 'test@test.com';
const NEW_EMAIL = 'test2@test.com';
const PASSWORD = '12345';

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let verificationsRepository: Repository<Verification>;
  let jwtToken: string; //Token data from account

  const PostgresDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: +process.env.DB_POST,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: process.env.NODE_ENV !== 'prod',
    logging: process.env.NODE_ENV !== 'prod' && process.env.NODE_ENV !== 'test',
    entities: [User, Verification],
  });

  beforeAll(async () => {
    await PostgresDataSource.initialize();
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    usersRepository = module.get(getRepositoryToken(User));
    verificationsRepository = module.get(getRepositoryToken(Verification));
    await app.init();
  });

  afterAll(async () => {
    await PostgresDataSource.dropDatabase();
    app.close();
  });

  //!Create Account
  describe('createAccount', () => {
    it('should create an account', async () => {
      const res = await request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation {
            createAccount(input: {
              email: "${EMAIL}",
              password: "${PASSWORD}",
              role: Owner
            }) {
              ok
              error
            }
          }`,
        })
        .expect(200);
      expect(res.body.data.createAccount.ok).toBe(true);
      expect(res.body.data.createAccount.error).toBe(null);
    });

    it('should fail if account exists', async () => {
      const res = await request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation {
            createAccount(input: {
              email: "${EMAIL}",
              password: "${PASSWORD}",
              role: Owner
            }) {
              ok
              error
            }
          }`,
        })
        .expect(200);
      expect(res.body.data.createAccount.ok).toBe(false);
      expect(res.body.data.createAccount.error).toBe(
        'This email is already registered',
      );
    });
  });

  //!Account login
  describe('loginAccount', () => {
    it('should login', async () => {
      const res = await request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation
          {loginAccount(input:
            {email:"${EMAIL}",
            password: "${PASSWORD}"
          }) 
          {
            ok
            error
            token
  }
}`,
        })
        .expect(200);
      expect(res.body.data.loginAccount.ok).toBe(true);
      expect(res.body.data.loginAccount.error).toBe(null);
      expect(res.body.data.loginAccount.token).toEqual(expect.any(String));
      jwtToken = res.body.data.loginAccount.token;
    });

    it('should fail to login with wrong credentials', async () => {
      const res = await request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation
          {loginAccount(input:
            {email:"23123${EMAIL}",
            password: "${PASSWORD}"
          }) 
          {
            ok
            error
            token
          }
        }`,
        })
        .expect(200);
      expect(res.body.data.loginAccount.ok).toBe(false);
      expect(res.body.data.loginAccount.error).toBe(
        "This username doesn't exist",
      );
      expect(res.body.data.loginAccount.token).toEqual(null);
    });

    it('should fail to login with wrong credentials', async () => {
      const res = await request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          mutation
          {loginAccount(input:
            {email:"${EMAIL}",
            password: "dsadasd${PASSWORD}"
          }) 
          {
            ok
            error
            token
          }
        }`,
        })
        .expect(200);
      expect(res.body.data.loginAccount.ok).toBe(false);
      expect(res.body.data.loginAccount.error).toBe('Wrong password');
      expect(res.body.data.loginAccount.token).toEqual(null);
    });
  });

  //!User Profile
  describe('userProfile', () => {
    let userId: number;
    beforeAll(async () => {
      const [user] = await usersRepository.find();
      userId = user.id;
    });
    it(`should see a user's profile`, async () => {
      const res = await request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', jwtToken)
        .send({
          query: `
          query {
          user(userId: ${userId}) {
          ok
          error
            user {
              id
          }
          }
          }
          `,
        })
        .expect(200);
      expect(res.body.data.user.ok).toBe(true);
      expect(res.body.data.user.error).toBe(null);
      expect(res.body.data.user.user.id).toBe(userId);
    });

    it(`should see a user's profile`, async () => {
      const res = await request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', jwtToken)
        .send({
          query: `
          query {
          user(userId: 2) {
          ok
          error
            user {
              id
          }
          }
          }
          `,
        })
        .expect(200);
      expect(res.body.data.user.ok).toBe(false);
      expect(res.body.data.user.error).toBe('User with id:2 not found');
      expect(res.body.data.user.user).toBe(null);
    });
  });

  //!User
  describe('me', () => {
    let userId: number;
    beforeAll(async () => {
      const [user] = await usersRepository.find();
      userId = user.id;
    });

    it('should find logged in users profile', async () => {
      const res = await request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', jwtToken)
        .send({
          query: `
          {
           me {
            id
            email
          }
        }
          `,
        })
        .expect(200);
      expect(res.body.data.me.id).toBe(userId);
      expect(res.body.data.me.email).toBe(EMAIL);
    });

    it('should fail without auth', async () => {
      const res = await request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .send({
          query: `
          {
           me {
            id
            email
          }
        }
          `,
        })
        .expect(200);
      expect(res.body.errors[0].message).toBe('Forbidden resource');
    });
  });

  //!Edit profile
  describe('editProfile', () => {
    it('should change email', async () => {
      const res = await request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', jwtToken)
        .send({
          query: `
            mutation {
            editProfile (input: {
            email: "${NEW_EMAIL}"
            }) {
            error
            ok
            }
            }
            `,
        })
        .expect(200);
      expect(res.body.data.editProfile.ok).toBe(true);
      expect(res.body.data.editProfile.error).toBe(null);
      const newEmailRes = await request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', jwtToken)
        .send({
          query: `
          {
           me {
            id
            email
          }
        }
          `,
        })
        .expect(200);
      expect(newEmailRes.body.data.me.email).toBe(NEW_EMAIL);
    });
  });

  //!Email verification
  describe('verifyEmail', () => {
    let verificationCode: string;
    beforeAll(async () => {
      const [verification] = await verificationsRepository.find();
      verificationCode = verification.code;
    });

    it('should verify email', async () => {
      const res = await request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', jwtToken)
        .send({
          query: `
                mutation {
                verifyEmail(input: { code: "${verificationCode}" }) {
                error
                ok
                }
                }
            `,
        })
        .expect(200);
      expect(res.body.data.verifyEmail.ok).toBe(true);
      expect(res.body.data.verifyEmail.error).toBe(null);
    });

    it('should fail on verification', async () => {
      const res = await request(app.getHttpServer())
        .post(GRAPHQL_ENDPOINT)
        .set('X-JWT', jwtToken)
        .send({
          query: `
                mutation {
                verifyEmail(input: { code: "test" }) {
                error
                ok
                }
                }
            `,
        })
        .expect(200);
      expect(res.body.data.verifyEmail.ok).toBe(false);
      expect(res.body.data.verifyEmail.error).toBe('Verification not found');
    });
  });
});
