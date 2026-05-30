/** Max quantity per line item in cart / checkout UI. */
export const MAX_CART_QUANTITY = 99

type StockedProduct = {
  inStock: boolean
  stockQuantity: number
}

/** Products are returned as-is with their actual stock quantities for accurate inventory display. */
export function productForSale<T extends StockedProduct>(product: T): T {
  return product
}
