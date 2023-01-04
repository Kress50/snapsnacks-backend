import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule/dist';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { LessThan, Repository } from 'typeorm';
import {
  CreatePaymentInput,
  CreatePaymentOutput,
} from './dtos/create-payment.dto';
import { GetPaymentOutput } from './dtos/get-payment.dto';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
  ) {}

  async createPayment(
    owner,
    { transactionId, restaurantId }: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: {
          id: restaurantId,
        },
      });
      if (!restaurant)
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      if (restaurant.ownerId !== owner.id)
        return {
          ok: false,
          error: 'You cannot create a payment for this restaurant',
        };
      await this.payments.save(
        this.payments.create({
          transactionId,
          user: owner,
          restaurant,
        }),
      );
      //Promotions logic
      restaurant.isPromoted = true;
      const date = new Date();
      //Gets time in ms till promotion ends
      date.setDate(date.getDate() + 7);
      restaurant.promotedUntil = date;
      this.restaurants.save(restaurant);
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: 'Could not create payment',
      };
    }
  }

  async getPayments(user: User): Promise<GetPaymentOutput> {
    try {
      const payments = await this.payments.find({
        where: { user: user.payments },
        relations: ['user', 'restaurant'],
      });
      return { ok: true, payments };
    } catch {
      return {
        ok: false,
        error: 'Could not get payment',
      };
    }
  }

  @Cron('0 0 * * * *')
  async checkPromotedRestaurants() {
    const restaurants = await this.restaurants.find({
      where: {
        isPromoted: true,
        promotedUntil: LessThan(new Date()),
      },
    });
    restaurants.forEach(async (restaurant) => {
      restaurant.isPromoted = false;
      restaurant.promotedUntil = null;
      await this.restaurants.save(restaurant);
    });
  }
}
