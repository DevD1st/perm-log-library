import rabbit from "amqplib";
import { EventPublisher } from "../publisher";
import { PERM_LOG_EXCHANGE, PermLogEventsEnum } from "../util";

jest.mock("amqplib", () => ({
  connect: jest.fn().mockResolvedValue({
    createChannel: jest.fn().mockResolvedValue({
      assertExchange: jest.fn(),
      publish: jest.fn().mockReturnValue(true),
      close: jest.fn(),
    } as never),
  } as never),
}));

jest.mock("uuid", () => ({
  v4: "some-random-id",
}));

describe("EventPublisher()", () => {
  beforeEach(() => {
    // Reset the static channel before each test to ensure test isolation
    EventPublisher.clearAll();
    // Clear all mocks before each test to prevent state leakage
    jest.clearAllMocks();
  });

  describe("init()", () => {
    it("initializes successfully and created a durable exchange", async () => {
      const channel = await EventPublisher.init("");

      expect(rabbit.connect).toHaveBeenCalled();
      expect(channel.assertExchange).toHaveBeenCalledWith(
        PERM_LOG_EXCHANGE,
        "topic",
        {
          durable: true,
        }
      );
    });
  });

  describe("publishMessage()", () => {
    const routingKey = PermLogEventsEnum.PermRequested;
    const content = { test: "content" };

    it("sucessfully publishes a message", async () => {
      await EventPublisher.init(""); // Initialize the channel before publishing

      const published = EventPublisher.publishMessage(
        routingKey,
        Buffer.from(JSON.stringify(content))
      );

      expect(published).toEqual(true);
    });
  });
});
