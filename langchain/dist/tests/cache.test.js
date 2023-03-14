import crypto from "node:crypto";
import { test, expect, jest } from "@jest/globals";
import { InMemoryCache, RedisCache } from "../cache.js";
const sha256 = (str) => crypto.createHash("sha256").update(str).digest("hex");
test("InMemoryCache", async () => {
    const cache = new InMemoryCache();
    await cache.update("foo", "bar", [{ text: "baz" }]);
    expect(await cache.lookup("foo", "bar")).toEqual([{ text: "baz" }]);
});
test("RedisCache", async () => {
    const redis = {
        get: jest.fn(async (key) => {
            console.log(key, sha256("foo_bar_0"));
            if (key === sha256("foo_bar_0")) {
                return "baz";
            }
            return null;
        }),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cache = new RedisCache(redis);
    expect(await cache.lookup("foo", "bar")).toEqual([{ text: "baz" }]);
});
//# sourceMappingURL=cache.test.js.map