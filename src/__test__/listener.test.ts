import rabbit from "amqplib";
import { EventListener } from "../listener";
import { PERM_LOG_EXCHANGE, PermLogEventsEnum, QueueNameEnum } from "../util";

jest.mock("amqplib", () => ({
  connect: jest.fn().mockResolvedValue({
    createChannel: jest.fn().mockResolvedValue({
      prefetch: jest.fn(),
      assertExchange: jest.fn(),
      assertQueue: jest.fn().mockResolvedValue({
        queue: "test_queue",
      } as never),
      bindQueue: jest.fn(),
      consume: jest.fn(),
      close: jest.fn(),
      publish: jest.fn(),
      ack: jest.fn(),
    } as never),
  } as never),
}));

describe("EventListener()", () => {
  beforeEach(() => {
    EventListener.clearAll();
    jest.clearAllMocks();
  });

  describe("init()", () => {
    it("initializes successfully, set prefetch to 1, created a durable exchange and bind queues", async () => {
      const events = [
        PermLogEventsEnum.PermFetched,
        PermLogEventsEnum.PermCalculated,
      ];

      const channel = await EventListener.init(
        "",
        QueueNameEnum.Test,
        events,
        jest.fn()
      );

      expect(rabbit.connect).toHaveBeenCalled();
      expect(channel.assertExchange).toHaveBeenCalledWith(
        PERM_LOG_EXCHANGE,
        "topic",
        {
          durable: true,
        }
      );
      expect(channel.prefetch).toHaveBeenCalledWith(1);
      expect(channel.bindQueue).toHaveBeenCalledTimes(events.length);
    });
  });

  describe("onMessage()", () => {
    const messageListener = jest.fn();
    const mockMessage = {
      content: Buffer.from("test message"),
    } as rabbit.ConsumeMessage;
    const events = [
      PermLogEventsEnum.PermFetched,
      PermLogEventsEnum.PermCalculated,
    ];

    beforeEach(async () => {
      await EventListener.init("", QueueNameEnum.Test, events, messageListener);
    });

    it("should call the listener whenever a valid message is receivd", async () => {
      // this is a hack. We know the code compiles to es16, es16 doesn't have the concept of private attributes
      const mockedChannel = (EventListener as any).channel as rabbit.Channel;
      const onMessageCallback = (mockedChannel.consume as jest.Mock).mock
        .calls[0][1] as (message: rabbit.ConsumeMessage) => void;
      onMessageCallback(mockMessage);

      expect(messageListener).toHaveBeenCalledWith(mockMessage);
    });

    it("should publish an empty message event if the mesage is null/undefined", async () => {
      // this is a hack. We know the code compiles to es16, es16 doesn't have the concept of private attributes
      const mockedChannel = (EventListener as any).channel as rabbit.Channel;
      const onMessageCallback = (mockedChannel.consume as jest.Mock).mock
        .calls[0][1] as (message?: rabbit.ConsumeMessage) => void;
      onMessageCallback(undefined);

      expect(mockedChannel.publish).toHaveBeenCalledWith(
        PERM_LOG_EXCHANGE,
        PermLogEventsEnum.RabbitEmptyMessage,
        expect.any(Buffer),
        expect.any(Object)
      );
    });

    it("It acknowledges a message", () => {
      // this is a hack. We know the code compiles to es16, es16 doesn't have the concept of private attributes
      const mockedChannel = (EventListener as any).channel as rabbit.Channel;
      EventListener.acknowledgeMessage(mockMessage);

      expect(mockedChannel.ack).toHaveBeenCalledWith(mockMessage);
    });
  });
});
