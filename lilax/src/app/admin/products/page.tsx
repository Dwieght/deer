import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { createProduct, deleteProduct, updateProduct } from "../actions";

export const dynamic = "force-dynamic";

type SearchParams = {
  type?: string | string[];
  text?: string | string[];
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminProductsPage({
  searchParams
}: {
  searchParams?: SearchParams;
}) {
  const products = await prisma.product
    .findMany({
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }]
    })
    .catch(() => []);

  const totalProducts = products.length;
  const featuredProducts = products.filter((product) => product.featured).length;
  const outOfStock = products.filter((product) => product.stock === 0).length;
  const flashType = readParam(searchParams?.type);
  const flashText = readParam(searchParams?.text);

  return (
    <section className="admin-page">
      <div className="page-heading">
        <div>
          <span className="kicker">Catalog</span>
          <h1>Manage products</h1>
          <p>Create, edit, activate, and retire products without touching Deer data.</p>
        </div>
      </div>

      {flashText ? (
        <div className={`flash-message ${flashType === "error" ? "is-error" : "is-success"}`}>
          {flashText}
        </div>
      ) : null}

      <div className="stat-grid">
        <article className="stat-card">
          <span>Total products</span>
          <strong>{totalProducts}</strong>
        </article>
        <article className="stat-card">
          <span>Featured</span>
          <strong>{featuredProducts}</strong>
        </article>
        <article className="stat-card">
          <span>Out of stock</span>
          <strong>{outOfStock}</strong>
        </article>
      </div>

      <div className="admin-grid">
        <article className="admin-panel">
          <div className="panel-headline">
            <h2>Add product</h2>
            <p>Everything here belongs only to Lilax.</p>
          </div>
          <form action={createProduct} className="admin-form">
            <label>
              Product name
              <input type="text" name="name" required />
            </label>
            <label>
              Slug
              <input type="text" name="slug" placeholder="Optional. Auto-generated if empty." />
            </label>
            <label>
              Category
              <input type="text" name="category" required />
            </label>
            <label>
              Description
              <textarea name="description" rows={5} required />
            </label>
            <label>
              Price
              <input type="number" name="price" min="0" step="0.01" required />
            </label>
            <label>
              Stock
              <input type="number" name="stock" min="0" step="1" required />
            </label>
            <label>
              Main image URL
              <input type="url" name="imageUrl" required />
            </label>
            <label>
              Gallery URLs
              <textarea
                name="gallery"
                rows={4}
                placeholder="One image URL per line"
              />
            </label>
            <label className="checkbox-line">
              <input type="checkbox" name="featured" />
              Featured product
            </label>
            <label className="checkbox-line">
              <input type="checkbox" name="isActive" defaultChecked />
              Visible in storefront
            </label>
            <button type="submit" className="primary-button">
              Save Product
            </button>
          </form>
        </article>

        <article className="admin-panel admin-panel-wide">
          <div className="panel-headline">
            <h2>Current products</h2>
            <p>Inline editing with separate status and stock control.</p>
          </div>

          <div className="admin-card-list">
            {products.map((product) => (
              <form key={product.id} action={updateProduct} className="catalog-card">
                <input type="hidden" name="id" value={product.id} />
                <div className="catalog-top">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={88}
                    height={88}
                    className="catalog-thumb"
                  />
                  <div>
                    <h3>{product.name}</h3>
                    <p className="meta-text">{product.slug}</p>
                  </div>
                </div>

                <div className="form-grid">
                  <label>
                    Name
                    <input type="text" name="name" defaultValue={product.name} required />
                  </label>
                  <label>
                    Slug
                    <input type="text" name="slug" defaultValue={product.slug} required />
                  </label>
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
                  <label>
                    Stock
                    <input
                      type="number"
                      name="stock"
                      min="0"
                      step="1"
                      defaultValue={product.stock}
                      required
                    />
                  </label>
                  <label className="span-2">
                    Main image URL
                    <input type="url" name="imageUrl" defaultValue={product.imageUrl} required />
                  </label>
                  <label className="span-2">
                    Description
                    <textarea name="description" rows={4} defaultValue={product.description} required />
                  </label>
                  <label className="span-2">
                    Gallery URLs
                    <textarea
                      name="gallery"
                      rows={4}
                      defaultValue={product.gallery.join("\n")}
                    />
                  </label>
                  <label className="checkbox-line">
                    <input type="checkbox" name="featured" defaultChecked={product.featured} />
                    Featured
                  </label>
                  <label className="checkbox-line">
                    <input type="checkbox" name="isActive" defaultChecked={product.isActive} />
                    Active
                  </label>
                </div>

                <div className="action-row">
                  <button type="submit" className="primary-button">
                    Update
                  </button>
                  <button formAction={deleteProduct} className="ghost-button" type="submit">
                    Delete
                  </button>
                </div>
              </form>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
