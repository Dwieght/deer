import { prisma } from "../../../lib/prisma";
import AdminForm from "../admin-form";
import Modal from "../modal";
import { createProduct, updateProduct, deleteProduct } from "../actions";
import {
  applySearch,
  formatAmount,
  formatDate,
  normalizeImageUrl,
  normalizeSearch,
  paginate,
  parsePage,
  renderTableControls,
} from "../utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }) {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  const PAGE_SIZE = 8;
  const productsSearch = normalizeSearch(searchParams?.productsSearch);
  const productsPage = parsePage(searchParams?.productsPage);
  const productsFiltered = applySearch(products, productsSearch, (product) => [
    product.name,
    product.category,
    product.description,
    product.price,
  ]);
  const productsPagination = paginate(productsFiltered, productsPage, PAGE_SIZE);

  return (
    <section className="section" id="products">
      <div className="section-header">
        <div>
          <h2>Shop Products</h2>
          <p>Add new merch items and keep prices up to date.</p>
        </div>
        <Modal triggerLabel="Add Product" title="Add Product" triggerClassName="primary-button">
          <AdminForm action={createProduct} className="admin-form">
            <label htmlFor="product-name">
              Product Name
              <input id="product-name" type="text" name="name" required />
            </label>
            <div className="form-row">
              <label htmlFor="product-category">
                Category
                <input id="product-category" type="text" name="category" placeholder="Stickers" required />
              </label>
              <label htmlFor="product-price">
                Price
                <input id="product-price" type="number" name="price" min="0" step="0.01" required />
              </label>
            </div>
            <label htmlFor="product-image">
              Image URL
              <input id="product-image" type="text" name="imageUrl" placeholder="https://" required />
            </label>
            <label htmlFor="product-description">
              Description
              <textarea id="product-description" name="description" rows="3"></textarea>
            </label>
            <button className="primary-button" type="submit">
              Save Product
            </button>
          </AdminForm>
        </Modal>
      </div>

      {productsFiltered.length > 0 || productsSearch
        ? renderTableControls({
            searchParams,
            searchKey: "productsSearch",
            pageKey: "productsPage",
            searchValue: productsSearch,
            pagination: productsPagination,
            placeholder: "Search products",
            anchor: "products",
          })
        : null}

      {productsFiltered.length === 0 ? <p className="empty-state">No products yet.</p> : null}
      {productsFiltered.length > 0 ? (
        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Image</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {productsPagination.items.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{formatAmount(product.price)}</td>
                  <td>
                    <img
                      src={normalizeImageUrl(product.imageUrl)}
                      alt={product.name}
                      className="table-image"
                    />
                  </td>
                  <td className="table-cell-muted">{formatDate(product.updatedAt)}</td>
                  <td>
                    <div className="table-actions is-inline">
                      <Modal
                        triggerLabel="View"
                        title={product.name}
                        triggerClassName="secondary-button"
                      >
                        <div className="modal-stack">
                          <div>
                            <img
                              src={normalizeImageUrl(product.imageUrl)}
                              alt={product.name}
                              className="dashboard-image"
                            />
                            <p className="table-cell-muted">Category: {product.category}</p>
                            <p className="table-cell-muted">Price: {formatAmount(product.price)}</p>
                            {product.description ? <p>{product.description}</p> : null}
                          </div>
                        </div>
                      </Modal>
                      <Modal
                        triggerLabel="Edit"
                        title={`Edit ${product.name}`}
                        triggerClassName="secondary-button"
                      >
                        <AdminForm action={updateProduct} className="admin-form">
                          <input type="hidden" name="id" value={product.id} />
                          <label>
                            Product Name
                            <input type="text" name="name" defaultValue={product.name} required />
                          </label>
                          <div className="form-row">
                            <label>
                              Category
                              <input type="text" name="category" defaultValue={product.category} required />
                            </label>
                            <label>
                              Price
                              <input
                                type="number"
                                name="price"
                                min="0"
                                step="0.01"
                                defaultValue={product.price}
                                required
                              />
                            </label>
                          </div>
                          <label>
                            Image URL
                            <input type="text" name="imageUrl" defaultValue={product.imageUrl} required />
                          </label>
                          <label>
                            Description
                            <textarea name="description" rows="3" defaultValue={product.description || ""}></textarea>
                          </label>
                          <div className="action-row">
                            <button className="secondary-button" type="submit">
                              Update Product
                            </button>
                          </div>
                        </AdminForm>
                      </Modal>
                      <AdminForm action={deleteProduct} confirmMessage="Delete this product?">
                        <input type="hidden" name="id" value={product.id} />
                        <button className="ghost-button" type="submit">
                          Delete
                        </button>
                      </AdminForm>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
