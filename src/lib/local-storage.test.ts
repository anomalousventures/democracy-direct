import { describe, it, expect, beforeEach, vi } from "vitest";
import { getItem, setItem, removeItem, getJSON, setJSON } from "./local-storage";

describe("local-storage helpers", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("getItem", () => {
    it("returns stored value", () => {
      localStorage.setItem("test-key", "test-value");
      expect(getItem("test-key")).toBe("test-value");
    });

    it("returns null for missing key", () => {
      expect(getItem("nonexistent")).toBeNull();
    });

    it("returns null when localStorage throws", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Storage unavailable");
      });
      expect(getItem("test-key")).toBeNull();
    });
  });

  describe("setItem", () => {
    it("stores value and returns true", () => {
      const result = setItem("test-key", "test-value");
      expect(result).toBe(true);
      expect(localStorage.getItem("test-key")).toBe("test-value");
    });

    it("returns false when localStorage throws", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("Quota exceeded");
      });
      expect(setItem("test-key", "test-value")).toBe(false);
    });
  });

  describe("removeItem", () => {
    it("removes stored value and returns true", () => {
      localStorage.setItem("test-key", "test-value");
      const result = removeItem("test-key");
      expect(result).toBe(true);
      expect(localStorage.getItem("test-key")).toBeNull();
    });

    it("returns false when localStorage throws", () => {
      vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
        throw new Error("Storage unavailable");
      });
      expect(removeItem("test-key")).toBe(false);
    });
  });

  describe("getJSON", () => {
    it("parses and returns stored JSON", () => {
      localStorage.setItem("test-key", '{"name":"Alice","age":30}');
      const result = getJSON<{ name: string; age: number }>("test-key");
      expect(result).toEqual({ name: "Alice", age: 30 });
    });

    it("returns null for missing key", () => {
      expect(getJSON("nonexistent")).toBeNull();
    });

    it("returns null for invalid JSON", () => {
      localStorage.setItem("test-key", "not valid json {");
      expect(getJSON("test-key")).toBeNull();
    });

    it("returns null when localStorage throws", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Storage unavailable");
      });
      expect(getJSON("test-key")).toBeNull();
    });
  });

  describe("setJSON", () => {
    it("serializes and stores value, returns true", () => {
      const data = { name: "Bob", items: [1, 2, 3] };
      const result = setJSON("test-key", data);
      expect(result).toBe(true);
      expect(localStorage.getItem("test-key")).toBe('{"name":"Bob","items":[1,2,3]}');
    });

    it("returns false when localStorage throws", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("Quota exceeded");
      });
      expect(setJSON("test-key", { data: "value" })).toBe(false);
    });

    it("returns false when JSON.stringify throws", () => {
      const circular: { self?: unknown } = {};
      circular.self = circular;
      expect(setJSON("test-key", circular)).toBe(false);
    });
  });
});
