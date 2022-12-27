import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity } from 'typeorm';
import { PrimaryColumn } from 'typeorm/decorator/columns/PrimaryColumn';

@ObjectType()
@Entity()
export class Restaurant {
  @Field(() => Number)
  @PrimaryColumn()
  id: number;
  @Field(() => String)
  @Column()
  name: string;
  @Field(() => Boolean)
  @Column()
  isVegan?: boolean;
  @Field(() => String)
  @Column()
  address?: string;
  @Field(() => String)
  @Column()
  ownersName?: string;
}
