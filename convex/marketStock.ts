/** Max quantity per line item in cart / checkout UI. */
export const MAX_CART_QUANTITY = 99

type StockedProduct = {
  inStock: boolean
  stockQuantity: number
}

/** Products are always sellable; stock fields are not used to block purchases. */
export function productForSale<T extends StockedProduct>(product: T): T {
  return {
    ...product,
    inStock: true,
    stockQuantity: MAX_CART_QUANTITY,
  }
}
