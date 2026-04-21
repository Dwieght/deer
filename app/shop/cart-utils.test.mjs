import test from "node:test";
import assert from "node:assert/strict";

import {
  addProductToCart,
  getCartVariantKey,
  updateCartItemInCart,
} from "./cart-utils.mjs";

test("getCartVariantKey normalizes product ids and empty sizes", () => {
  assert.equal(getCartVariantKey(" product-1 ", ""), "product-1::__default__");
  assert.equal(getCartVariantKey("product-1", "XL"), "product-1::XL");
});

test("addProductToCart increments an existing matching variant", () => {
  const product = {
    id: "tee-01",
    name: "Tee",
    price: 100,
    imageUrl: "/tee.png",
    sizes: ["M", "L"],
  };

  const cart = addProductToCart([], product);
  const updated = addProductToCart(cart, product);

  assert.equal(updated.length, 1);
  assert.equal(updated[0].itemKey, "tee-01::M");
  assert.equal(updated[0].quantity, 2);
});

test("updateCartItemInCart changes variant key when size changes", () => {
  const initial = [
    {
      itemKey: "tee-01::M",
      productId: "tee-01",
      size: "M",
      quantity: 1,
    },
  ];

  const updated = updateCartItemInCart(initial, "tee-01::M", { size: "L" });

  assert.equal(updated.length, 1);
  assert.equal(updated[0].itemKey, "tee-01::L");
  assert.equal(updated[0].size, "L");
});

test("updateCartItemInCart merges into an existing target variant", () => {
  const initial = [
    {
      itemKey: "tee-01::M",
      productId: "tee-01",
      size: "M",
      quantity: 1,
    },
    {
      itemKey: "tee-01::L",
      productId: "tee-01",
      size: "L",
      quantity: 2,
    },
  ];

  const updated = updateCartItemInCart(initial, "tee-01::M", { size: "L" });

  assert.equal(updated.length, 1);
  assert.equal(updated[0].itemKey, "tee-01::L");
  assert.equal(updated[0].quantity, 3);
});
