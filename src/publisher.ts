import rabbit from "amqplib";
import { PERM_LOG_EXCHANGE, PermLogEventsEnum } from "./util";
import { PermLogError, PermLogErrorCodeEnum } from "./error";

export class EventPublisher {
  private static channel?: rabbit.Channel;

  constructor(rabbitConnString: string, cb: (error?: Error) => any) {
    (async () => {
      const conn = await rabbit.connect(rabbitConnString);
      EventPublisher.channel = await conn.createChannel();
      await EventPublisher.channel.assertExchange(PERM_LOG_EXCHANGE, "topic", {
        durable: true,
      });
    })();
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
}
