import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CoreEntity {
  @PrimaryGeneratedColumn()
  @Field(() => Number)
  id: number;
  @CreateDateColumn()
  @Field(() => Number)
  createdAt: Date;
  @UpdateDateColumn()
  @Field(() => Number)
  updatedAt: Date;
}
