export function getNextFocusIndex(currentIndex, totalItems, shiftKey = false) {
  if (!Number.isFinite(totalItems) || totalItems <= 0) {
    return -1;
  }

  if (!Number.isFinite(currentIndex) || currentIndex < 0 || currentIndex >= totalItems) {
    return shiftKey ? totalItems - 1 : 0;
  }

  if (shiftKey) {
    return currentIndex === 0 ? totalItems - 1 : currentIndex - 1;
  }

  return currentIndex === totalItems - 1 ? 0 : currentIndex + 1;
}
