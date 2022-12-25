import { decodeProductOpaqueId, decodeShopOpaqueId } from "../../xforms/id.js";

/**
 * @author Sushant Babu Luitel
 * 
 * @method UnArchiveProducts
 * @summary Takes an array of product IDs and unArchives products
 * @param {Object} _ - unused
 * @param {Object} args - The input arguments
 * @param {Object} args.input - mutation input object
 * @param {String} args.input.productId - an array of decoded product IDs to archive
 * @param {String} args.input.shopId - shop these products belong to
 * @param {Object} context - an object containing the per-request state
 * @return {Array} Array of unArchived Products
 */

export default async function UnArchiveProducts(_, { input }, context) {
  const { clientMutationId, productIds, shopId } = input;

  const decodedProductIds = productIds.map((productId) =>
    decodeProductOpaqueId(productId)
  );

  const unArchivedProductList = await context.mutations.unArchiveProducts(
    context,
    {
      productIds: decodedProductIds,
      shopId: decodeShopOpaqueId(shopId)
    }
  );

  return {
    clientMutationId,
    products: unArchivedProductList,
  };
}