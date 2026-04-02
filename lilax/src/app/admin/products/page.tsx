import { prisma } from "@/lib/prisma";
import AdminFlashAlert from "../_components/admin-flash-alert";
import ProductAdminTable from "../_components/product-admin-table";
import ProductCreateModal from "../_components/product-create-modal";

export const dynamic = "force-dynamic";

type SearchParams = {
  type?: string | string[];
  text?: string | string[];
};

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const products = await prisma.product
    .findMany({
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    })
    .catch(() => []);

  const totalProducts = products.length;
  const featuredProducts = products.filter(
    (product) => product.featured,
  ).length;
  const outOfStock = products.filter((product) => product.stock === 0).length;
  const flashType = readParam(searchParams?.type);
  const flashText = readParam(searchParams?.text);

  return (
    <section className="admin-page admin-page-wide">
      <div className="page-heading">
        <div>
          <span className="kicker">Catalog</span>
          <h1>Manage products</h1>
          <p>
            Create, edit, activate, and retire products without touching Deer
            data.
          </p>
        </div>
        <div className="admin-page-actions">
          <ProductCreateModal />
        </div>
      </div>

      {flashText ? (
        <>
          <AdminFlashAlert type={flashType} text={flashText} scope="products" />
          <div
            className={`flash-message ${flashType === "error" ? "is-error" : "is-success"}`}
          >
            {flashText}
          </div>
        </>
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

      <article className="admin-panel admin-panel-wide">
        <div className="panel-headline">
          <div>
            <h2>Current products</h2>
            <p>Scan the catalog quickly, then view or edit the selected row.</p>
          </div>
        </div>

        <ProductAdminTable products={products} />
      </article>
    </section>
  );
}
