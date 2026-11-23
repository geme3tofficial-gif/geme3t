import type { Metadata } from "next";
import { getPrismaClient } from "@/lib/prisma";
import { formatNaira } from "@/lib/domain/digital-service/format";
import {
  createCategory,
  createService,
  deleteCategory,
  deleteService,
  updateCategory,
  updateService,
} from "./actions";

export const metadata: Metadata = { title: "Digital service catalog" };

export default async function ServicesPage() {
  const categories = await getPrismaClient().digitalServiceCategory.findMany({
    include: { services: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Catalog</span>
          <h1>Services & categories</h1>
          <p>Manage the shared digital-services price catalog.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <h2>Add category</h2>
          <form action={createCategory} className="admin-edit-form" style={{ marginTop: 12 }}>
            <label>
              <span>Category name</span>
              <input name="name" required />
            </label>
            <button className="button button--small" type="submit">Add category</button>
          </form>
        </section>

        <section className="dashboard-panel">
          <h2>Add service</h2>
          <form action={createService} className="admin-edit-form" style={{ marginTop: 12 }}>
            <label>
              <span>Category</span>
              <select name="categoryId" required>
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option value={category.id} key={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label><span>Service name</span><input name="name" required /></label>
            <label><span>Unit</span><input name="unit" defaultValue="unit" required /></label>
            <label><span>Price</span><input name="price" type="number" min="0" step="0.01" required /></label>
            <button className="button button--small" type="submit">Add service</button>
          </form>
        </section>
      </div>

      <section className="dashboard-panel" style={{ marginTop: 16 }}>
        <div className="workspace-panel-heading"><h2>Catalog</h2></div>
        {categories.map((category) => (
          <div key={category.id} style={{ marginTop: 16 }}>
            <form action={updateCategory} className="admin-edit-form">
              <input type="hidden" name="id" value={category.id} />
              <label><span>Category</span><input name="name" defaultValue={category.name} required /></label>
              <button className="button button--small button--light" type="submit">Rename</button>
              <button className="button button--small" formAction={deleteCategory} style={{ background: "#dc2626", color: "#fff" }} type="submit">
                Delete
              </button>
            </form>

            <div style={{ overflowX: "auto", marginTop: 8 }}>
              <table className="admin-table">
                <thead><tr><th>Service</th><th>Unit</th><th>Price</th><th>Actions</th></tr></thead>
                <tbody>
                  {category.services.map((service) => (
                    <tr key={service.id}>
                      <td>
                        <form action={updateService} className="admin-edit-form">
                          <input type="hidden" name="id" value={service.id} />
                          <input name="name" defaultValue={service.name} required />
                          <input name="unit" defaultValue={service.unit} required />
                          <input name="price" type="number" min="0" step="0.01" defaultValue={service.price.toString()} required />
                          <button className="button button--small button--light" type="submit">Save</button>
                        </form>
                      </td>
                      <td>{service.unit}</td>
                      <td>{formatNaira(service.price.toString())}</td>
                      <td>
                        <form action={deleteService}>
                          <input type="hidden" name="id" value={service.id} />
                          <button className="button button--small" style={{ background: "#dc2626", color: "#fff" }} type="submit">Delete</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {categories.length === 0 && <p>No service categories yet.</p>}
      </section>
    </>
  );
}
