import { getStr } from "../src/index";
import { assert } from "chai";

describe("test", function () {
  it("hello", function () {
    assert.equal(getStr(), "hello");
  });
});
