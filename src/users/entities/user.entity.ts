import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  OneToOne,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { InternalServerErrorException } from '@nestjs/common';
import { IsBoolean, IsEmail, IsEnum, IsString } from 'class-validator';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Payment } from 'src/payments/entities/payment.entity';
import { Verification } from './verification.entity';

export enum UserRole {
  Client = 'Client',
  Owner = 'Owner',
  Delivery = 'Delivery',
}

registerEnumType(UserRole, { name: 'UserRole' });

@InputType('UserInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Column({ unique: true })
  @Field(() => String)
  @IsEmail()
  email: string;
  @Column({ select: false })
  @Field(() => String)
  @IsString()
  password: string;
  @Column({ type: 'enum', enum: UserRole })
  @Field(() => UserRole)
  @IsEnum(UserRole)
  role: UserRole;
  @Column({ default: false })
  @Field(() => Boolean)
  @IsBoolean()
  verified: boolean;
  @Field(() => Verification, { nullable: true })
  @OneToOne(() => Verification, (verification) => verification.user, {
    eager: true,
  })
  verification?: Verification;
  @Field(() => [Restaurant])
  @OneToMany(() => Restaurant, (restaurant) => restaurant.owner)
  restaurants: Restaurant[];
  @Field(() => [Order])
  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];
  @Field(() => [Order])
  @OneToMany(() => Order, (order) => order.driver)
  rides: Order[];
  @Field(() => [Payment])
  @OneToMany(() => Payment, (payment) => payment.user)
  payments: Payment[];

  //hashing password
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password)
      try {
        this.password = await bcrypt.hash(this.password, 12);
      } catch (e) {
        console.log(e);
        throw new InternalServerErrorException();
      }
  }

  async checkPassword(aPassword: string): Promise<boolean> {
    try {
      const check = await bcrypt.compare(aPassword, this.password);
      return check;
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException();
    }
  }
}
