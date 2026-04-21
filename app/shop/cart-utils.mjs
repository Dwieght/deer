const DEFAULT_SIZE_TOKEN = "__default__";

function normalizeValue(value) {
  return String(value || "").trim();
}

function normalizeQuantity(value) {
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

export function getCartVariantKey(productId, size = "") {
  const normalizedProductId = normalizeValue(productId);
  const normalizedSize = normalizeValue(size);
  return `${normalizedProductId}::${normalizedSize || DEFAULT_SIZE_TOKEN}`;
}

export function addProductToCart(items, product) {
  const defaultSize =
    Array.isArray(product?.sizes) && product.sizes.length ? product.sizes[0] : "";
  const itemKey = getCartVariantKey(product?.id, defaultSize);
  const existingIndex = items.findIndex((item) => item.itemKey === itemKey);

  if (existingIndex >= 0) {
    return items.map((item, index) =>
      index === existingIndex
        ? { ...item, quantity: normalizeQuantity(item.quantity) + 1 }
        : item,
    );
  }

  return [
    ...items,
    {
      itemKey,
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      sizes: product.sizes || [],
      size: defaultSize,
      quantity: 1,
    },
  ];
}

export function updateCartItemInCart(items, itemKey, updates) {
  const currentItem = items.find((item) => item.itemKey === itemKey);
  if (!currentItem) {
    return items;
  }

  const nextItem = {
    ...currentItem,
    ...updates,
  };
  nextItem.quantity = normalizeQuantity(nextItem.quantity);
  nextItem.size = normalizeValue(nextItem.size);
  nextItem.itemKey = getCartVariantKey(nextItem.productId, nextItem.size);

  let merged = false;
  const nextItems = [];

  for (const item of items) {
    if (item.itemKey === itemKey) {
      continue;
    }

    if (item.itemKey === nextItem.itemKey) {
      nextItems.push({
        ...item,
        quantity: normalizeQuantity(item.quantity) + nextItem.quantity,
      });
      merged = true;
      continue;
    }

    nextItems.push(item);
  }

  if (!merged) {
    nextItems.push(nextItem);
  }

  return nextItems;
}

export function removeCartItemByKey(items, itemKey) {
  return items.filter((item) => item.itemKey !== itemKey);
}
