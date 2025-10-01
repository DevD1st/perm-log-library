import rabbit from "amqplib";
import { PERM_LOG_EXCHANGE, PermLogEventsEnum, stringifyIfNot } from "./util";
import { PermLogError, PermLogErrorCodeEnum } from "./error";

export class EventPublisher {
  private static channel?: rabbit.Channel;

  private constructor() {}

  static async init(rabbitConnString: string) {
    if (EventPublisher.channel) return EventPublisher.channel;

    try {
      const conn = await rabbit.connect(rabbitConnString);
      EventPublisher.channel = await conn.createChannel();
      await EventPublisher.channel.assertExchange(PERM_LOG_EXCHANGE, "topic", {
        durable: true,
      });

      return EventPublisher.channel;
    } catch (error: any) {
      throw new PermLogError({
        name: PermLogErrorCodeEnum.RabbitInit,
        message: "Unable to initialize rabbitmq",
        data: stringifyIfNot(error),
        stack: error.stack,
      });
    }
  }

  static publishMessage(
    routingKey: PermLogEventsEnum,
    content: Buffer,
    options?: rabbit.Options.Publish
  ) {
    if (!EventPublisher.channel)
      throw new PermLogError({
        name: PermLogErrorCodeEnum.RabbitInit,
        message: "channel is undefined, rabbitmq has not been initilaized.",
      });

    return EventPublisher.channel.publish(
      PERM_LOG_EXCHANGE,
      routingKey,
      content,
      options
    );
  }

  /**
   * this closes channel and clear all initialised variables
   */
  static clearAll() {
    if (EventPublisher.channel) EventPublisher.channel.close();
    EventPublisher.channel = undefined;
  }
}
