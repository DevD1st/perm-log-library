import rabbit from "amqplib";
import {
  PERM_LOG_EXCHANGE,
  PermLogEventsEnum,
  QueueNameEnum,
  RabbitEmptyMessage,
  stringifyIfNot,
} from "./util";
import { PermLogError, PermLogErrorCodeEnum } from "./error";

type ListenerType = (message: rabbit.ConsumeMessage) => void;

export class EventListener {
  private static channel?: rabbit.Channel;
  static queue?: rabbit.Replies.AssertQueue; // TODO: remove later
  // private static listener?: ListenerType;
  static listener?: ListenerType; // TODO: remove later

  private constructor() {}

  /**
   * You can interract with the other functionalities provided
   * by this class as static methods (EventListener.)
   * @param rabbitConnString rabbit connection url
   * @param queueName queue name
   * @param events events to subscribe to
   * @param messageListener function to call when a message is published to the queue
   * @param cb function to call once constructor has finished initializing
   */
  static async init(
    rabbitConnString: string,
    queueName: QueueNameEnum,
    events: PermLogEventsEnum[],
    messageListener: ListenerType
  ) {
    if (EventListener.channel) return EventListener.channel;

    try {
      const conn = await rabbit.connect(rabbitConnString);
      EventListener.channel = await conn.createChannel();
      await EventListener.channel.prefetch(1);
      await EventListener.channel.assertExchange(PERM_LOG_EXCHANGE, "topic", {
        durable: true,
      });
      EventListener.queue = await EventListener.channel.assertQueue(queueName, {
        durable: true,
      });

      events.forEach(async (event) => {
        await EventListener.channel!.bindQueue(
          EventListener.queue!.queue,
          PERM_LOG_EXCHANGE,
          event
        );
        console.log(`Binded ${event} to ${EventListener.queue!.queue}`);
      });

      EventListener.listener = messageListener;
      EventListener.onMessage(); // set up subscriber

      return EventListener.channel;
    } catch (error: any) {
      console.error(error);

      throw new PermLogError({
        name: PermLogErrorCodeEnum.RabbitInit,
        message: "Unable to initialize rabbitmq",
        data: stringifyIfNot(error),
        stack: error.stack,
      });
    }
  }

  private static async onMessage() {
    console.log("Library Listener bindQueue init");

    await EventListener.channel!.consume(
      EventListener.queue!.queue,
      (message) => {
        if (message == null) {
          return EventListener.channel!.publish(
            PERM_LOG_EXCHANGE,
            PermLogEventsEnum.RabbitEmptyMessage,
            Buffer.from(
              JSON.stringify(
                new RabbitEmptyMessage({
                  queueName: EventListener.queue!.queue,
                })
              )
            ),
            {
              persistent: true,
              timestamp: Date.now(),
            }
          );
        }

        if (this.listener) this.listener(message);
      },
      {
        noAck: false,
      }
    );
  }

  static acknowledgeMessage(message: rabbit.ConsumeMessage) {
    if (!EventListener.channel)
      throw new PermLogError({
        name: PermLogErrorCodeEnum.RabbitInit,
        message: "channel is undefined, rabbitmq has not been initilaized.",
      });

    EventListener.channel.ack(message);
  }

  /**
   * this closes channel and clear all initialised variables
   */
  static clearAll() {
    if (EventListener.channel) EventListener.channel.close();
    EventListener.channel = undefined;
    EventListener.queue = undefined;
    EventListener.listener = undefined;
  }
}
