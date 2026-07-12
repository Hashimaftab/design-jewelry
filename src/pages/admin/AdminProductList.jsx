import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Pencil, Trash2, Plus, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { listProducts, deleteProduct } from '../../api/products.api';
import { parseListResponse } from '../../utils/productHelpers';
import { isValidCategory, getCategoryLabel } from '../../constants/productCategories';
import { getApiErrorMessage } from '../../utils/adminAuth';
import './AdminProductList.css';

const formatMoney = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const LIMIT = 10;

const AdminProductList = () => {
  const { category } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const load = useCallback(async () => {
    if (!isValidCategory(category)) return;
    setLoading(true);
    setError('');
    try {
      const res = await listProducts(category, {
        page,
        limit: LIMIT,
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      const { products, total: t, totalPages: tp } = parseListResponse(res);
      setItems(products);
      setTotal(t);
      setTotalPages(tp);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not load products.'));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [category, page, search]);

  useEffect(() => {
    setPage(1);
    setSearch('');
    setSearchInput('');
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  if (!isValidCategory(category)) {
    return <Navigate to="/admin/products/necklaces" replace />;
  }

  const label = getCategoryLabel(category);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove “${name}” from inventory?`)) return;
    try {
      await deleteProduct(category, id);
      await load();
    } catch (e) {
      alert(getApiErrorMessage(e, 'Delete failed.'));
    }
  };

  return (
    <div className="admin-product-list">
      <header className="admin-product-list__head">
        <div>
          <h2>{label}</h2>
          <p>
            Manage {label.toLowerCase()} inventory. {total > 0 ? `${total} total.` : ''}
          </p>
        </div>
        <Link to={`/admin/products/${category}/new`} className="admin-product-list__add">
          <Plus size={18} strokeWidth={2} />
          Add product
        </Link>
      </header>

      <form className="admin-product-search" onSubmit={handleSearchSubmit}>
        <input
          type="search"
          className="admin-product-search__input"
          placeholder="Search name or description…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label={`Search ${label}`}
        />
        <button type="submit" className="admin-product-search__btn">
          Search
        </button>
      </form>

      {error ? (
        <p className="admin-product-form__error" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="admin-product-list__empty">Loading…</p>
      ) : (
        <>
          <div className="admin-product-list__table-wrap">
            <table className="admin-product-list__table">
              <thead>
                <tr>
                  <th scope="col">Image</th>
                  <th scope="col">Name</th>
                  <th scope="col">Price</th>
                  <th scope="col">Qty</th>
                  <th scope="col">Listed</th>
                  <th scope="col">Stock</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="admin-product-list__thumb media-frame media-frame--thumb">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt="" loading="lazy" />
                        ) : (
                          <span className="admin-product-list__thumb-placeholder">—</span>
                        )}
                      </div>
                    </td>
                    <td className="admin-product-list__name">{p.name}</td>
                    <td>{formatMoney(p.price)}</td>
                    <td>{p.quantity}</td>
                    <td>
                      <span
                        className={
                          p.isAvailable
                            ? 'admin-product-list__pill admin-product-list__pill--on'
                            : 'admin-product-list__pill'
                        }
                      >
                        {p.isAvailable ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          p.inStock
                            ? 'admin-product-list__pill admin-product-list__pill--on'
                            : 'admin-product-list__pill'
                        }
                      >
                        {p.inStock ? 'In stock' : 'Out'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-product-list__actions">
                        <Link
                          to={`/admin/products/${category}/${p.id}/view`}
                          className="admin-product-list__action"
                          title="View"
                        >
                          <Eye size={16} strokeWidth={1.75} />
                        </Link>
                        <Link
                          to={`/admin/products/${category}/${p.id}/edit`}
                          className="admin-product-list__action"
                          title="Edit"
                        >
                          <Pencil size={16} strokeWidth={1.75} />
                        </Link>
                        <button
                          type="button"
                          className="admin-product-list__action admin-product-list__action--danger"
                          title="Delete"
                          onClick={() => handleDelete(p.id, p.name)}
                        >
                          <Trash2 size={16} strokeWidth={1.75} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {items.length === 0 && !error ? (
            <p className="admin-product-list__empty">No products found.</p>
          ) : null}

          {totalPages > 1 ? (
            <div className="admin-product-pager">
              <button
                type="button"
                className="admin-product-pager__btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={18} />
                Previous
              </button>
              <span className="admin-product-pager__meta">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="admin-product-pager__btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
                <ChevronRight size={18} />
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default AdminProductList;
