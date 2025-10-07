import {
  stringifyIfNot,
  ReqContextMiddleware,
  RequestContextDto,
  X_REQUEST_ID,
  extractDeviceNameAndIp,
  DeviceDto,
} from "../util";
import { Request } from "express";

jest.mock("uuid", () => ({
  v4: () => "some-random-id",
}));

describe("stringifyIfNot()", () => {
  describe("it handles falsy correctly", () => {
    it("returns a string for undefined", () => {
      const res = stringifyIfNot(undefined);

      expect(typeof res).toBe("string");
    });

    it("returns 0 as a string", () => {
      const res = stringifyIfNot(0);

      expect(res).toBe("0");
    });

    it("correctly stringifies false", () => {
      const res = stringifyIfNot(false);

      expect(res).toBe("false");
    });
  });

  describe("handles objects correctly", () => {
    it("correctly stringifies an object", () => {
      const res = stringifyIfNot({
        test: "object",
      });

      expect(typeof res).toBe("string");
    });

    it("does not mutate an object", () => {
      const obj = {
        test: "object",
      };
      const res = stringifyIfNot(obj);

      expect(res).toBe(JSON.stringify(obj));
    });
  });
});

describe("ReqContextMiddleware()", () => {
  const req = Object.assign(
    new Request("http://localhost/test", {
      method: "GET",
      headers: { "x-forwarded-for": "127.0.0.1" },
    })
  ) as Request;
  const res = {
    set: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();

  describe("valid request", () => {
    it("should successfully assign a request context and continue", async () => {
      await ReqContextMiddleware(req, res as any, next as any);

      expect(next).toHaveBeenCalled();
      expect(res.set).toHaveBeenCalledWith(X_REQUEST_ID, expect.any(String));
      expect(req.context).toBeInstanceOf(RequestContextDto);
    });
  });
});

describe("extractDeviceNameAndIp()", () => {
  const req = Object.assign(
    new Request("http://localhost/test", {
      method: "GET",
      headers: { "x-forwarded-for": "127.0.0.1" },
    })
  ) as Request;

  describe("valid request", () => {
    it("successfully returns device dto", () => {
      const deviceDto = extractDeviceNameAndIp(req);

      expect(deviceDto).toBeInstanceOf(DeviceDto);
    });
  });
});
