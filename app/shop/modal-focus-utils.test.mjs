import test from "node:test";
import assert from "node:assert/strict";

import { getNextFocusIndex } from "./modal-focus-utils.mjs";

test("cycles forward from the last focusable element back to the first", () => {
  assert.equal(getNextFocusIndex(2, 3, false), 0);
});

test("cycles backward from the first focusable element to the last", () => {
  assert.equal(getNextFocusIndex(0, 3, true), 2);
});

test("moves to the adjacent focusable element when not at a boundary", () => {
  assert.equal(getNextFocusIndex(1, 4, false), 2);
  assert.equal(getNextFocusIndex(2, 4, true), 1);
});

test("returns a sensible fallback when current focus is outside the dialog", () => {
  assert.equal(getNextFocusIndex(-1, 4, false), 0);
  assert.equal(getNextFocusIndex(-1, 4, true), 3);
});

test("returns -1 when there are no focusable elements", () => {
  assert.equal(getNextFocusIndex(0, 0, false), -1);
});
