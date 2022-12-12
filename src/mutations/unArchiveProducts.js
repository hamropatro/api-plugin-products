import SimpleSchema from "simpl-schema";
import ReactionError from "@reactioncommerce/reaction-error";

const inputSchema = new SimpleSchema({
  productIds: Array,
  "productIds.$": {
    type: String,
  },
  shopId: String,
});

/**
 *  @author Sushant Babu Luitel
 *
 *
 * @method unArchiveProducts
 * @summary unArchives a product
 * @description the method unArchives products, but will also unArchive
 * child variants and options
 * @param {Object} context -  an object containing the per-request state
 * @param {Object} input - Input arguments for the bulk operation
 * @param {String} input.productIds - an array of decoded product IDs to unArchive
 * @param {String} input.shopId - shop these products belong to
 * @return {Array} array with unArchived products
 */

export default async function unArchiveProducts(context, input) {
  //validate the input schema type
  inputSchema.validate(input);

  const { collections } = context;
  const { Products } = collections;
  const { productIds, shopId } = input;

  //handle multiple permissions
  for (const productId of productIds) {
    await context.validatePermissions(
      `reaction:legacy:products:${productId}`,
      "archive",
      { shopId }
    );
  }

  // Check to make sure all products belongs to shame shop
  const count = await Products.find({
    _id: { $in: productIds },
    shopId,
  }).count();
  if (count !== productIds.length)
    throw new ReactionError("not-found", "One or more products do not exist");

  // Find all products that aren't deleted, and all their variants
  const productsWithVariants = await Products.find({
    // Don't unArchive products that are already unArchived
    isDeleted: {
      $ne: false,
    },
    $or: [
      {
        _id: {
          $in: productIds,
        },
      },
      {
        ancestors: {
          $in: productIds,
        },
      },
    ],
  }).toArray();

  //Get ID's of all product to unArchive
  const productIdsToUnArchive = productsWithVariants.map(
    (product) => product._id
  );

  const unArchivedProducts = await Promise.all(
    productIdsToUnArchive.map(async (productId) => {
      const { value: unArchivedProduct } = await Products.findOneAndUpdate(
        {
          _id: productId,
        },
        {
          $set: {
            isDeleted: false,
            isVisible: false,
          },
        },
        {
          returnOriginal: false,
        }
      );

      return unArchivedProduct;
    })
  );

  return unArchivedProducts.filter((unArchivedProduct) =>
    productIds.includes(unArchivedProduct._id)
  );
}
