import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Order } from '../entities/order.entity';

@InputType()
export class GetOrdersInput extends PickType(Order, ['id']) {}

@ObjectType()
export class GetOrdersOutput extends CoreOutput {
  @Field(() => Order, { nullable: true })
  order?: Order;
}
