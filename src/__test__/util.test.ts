import { stringifyIfNot } from "../util";

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
