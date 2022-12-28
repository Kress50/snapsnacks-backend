import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Field } from '@nestjs/graphql';

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
