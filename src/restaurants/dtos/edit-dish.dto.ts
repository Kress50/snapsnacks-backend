import {
  Field,
  InputType,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { IsNumber } from 'class-validator';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { CreateDishInput } from './create-dish.dto';

@InputType()
export class EditDishInput extends PickType(PartialType(CreateDishInput), [
  'name',
  'description',
  'options',
  'price',
]) {
  @Field(() => Number)
  @IsNumber()
  dishId: number;
}

@ObjectType()
export class EditDishOutput extends CoreOutput {}
