import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { MutationOutput } from 'src/common/dtos/output.dto';
import { User } from '../entities/user.entity';

@InputType()
export class LoginAccountInput extends PickType(User, ['email', 'password']) {}

@ObjectType()
export class LoginAccountOutput extends MutationOutput {
  @Field(() => String, { nullable: true })
  token?: string;
}
