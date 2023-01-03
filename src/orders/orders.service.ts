import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Dish, DishOptions } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { OrderItem } from './entities/order-item.dto';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
  ) {}

  async createOrder(
    customer: User,
    { restaurantId, items }: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    try {
      //finding restaurant
      const restaurant = await this.restaurants.findOne({
        where: { id: restaurantId },
      });
      if (!restaurant)
        return {
          ok: false,
          error: 'No restaurant found',
        };
      //final price of entire order
      let orderFinalPrice = 0;
      //initializing empty array to push items into for final order
      const orderItems: OrderItem[] = [];
      //iterating through each order item
      for (const item of items) {
        const dish = await this.dishes.findOne({
          where: {
            id: item.dishId,
          },
        });
        if (!dish)
          return {
            ok: false,
            error: 'Dish not found',
          };
        //calculating final price of order item, starting with base-price of the item
        let dishFinalPrice = dish.price;
        //iterating through each option in the order item
        for (const itemOption of item.options) {
          //Checking the db for dish option with the same name as the item option
          const dishOption = dish.options.find(
            (dishOption) => dishOption.name === itemOption.name,
          );
          if (dishOption) {
            //if dishOption has extra, calculate the end price with it, otherwise look for extra in choices
            if (dishOption.extra) {
              dishFinalPrice = dishFinalPrice + dishOption.extra;
            } else {
              //Checking the db for dish option choice with the same name as the item option choice
              const dishOptionChoice = dishOption.choices.find(
                (optionChoice) => optionChoice.name === itemOption.choice,
              );
              //if choice exists
              if (dishOptionChoice) {
                //if extra exists on that choice
                if (dishOptionChoice.extra) {
                  dishFinalPrice = dishFinalPrice + dishOptionChoice.extra;
                }
              }
            }
          }
        }
        //add final order item price to entire order price
        orderFinalPrice = orderFinalPrice + dishFinalPrice;
        const orderItem = await this.orderItems.save(
          this.orderItems.create({
            dish,
            options: item.options,
          }),
        );
        orderItems.push(orderItem);
      }
      await this.orders.save(
        this.orders.create({
          customer,
          restaurant,
          total: orderFinalPrice,
          items: orderItems,
        }),
      );
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: 'Could not create order',
      };
    }
  }
}
