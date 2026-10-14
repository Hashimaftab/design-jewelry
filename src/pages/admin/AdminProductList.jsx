import { formatStorePrice as formatMoney } from '../../utils/currency';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Pencil, Trash2, Plus, Eye, ChevronLeft, ChevronRight, Sparkles, RefreshCw } from 'lucide-react';
import { listProducts, deleteProduct, listAllProducts, deleteCollectionProduct, changeProductCategory } from '../../api/products.api';
import { parseListResponse, parseProductResponse } from '../../utils/productHelpers';
import { isValidCategory, getCategoryLabel, ADMIN_PRODUCT_CATEGORIES, CATEGORY_SLUG_TO_DB } from '../../constants/productCategories';
import { getApiErrorMessage } from '../../utils/adminAuth';


const LIMIT = 10;

const AdminProductList = ({ allCollections = false }) => {
  const { category } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState('');
  const requestId = useRef(0);

  const load = useCallback(async () => {
    if (!allCollections && !isValidCategory(category)) return;
    const request = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: LIMIT,
        ...(search.trim() ? { search: search.trim() } : {}),
      };
      const res = await (allCollections ? listAllProducts(params) : listProducts(category, params));
      if (request !== requestId.current) return;
      const { products, total: t, totalPages: tp } = parseListResponse(res);
      if (page > tp) { setPage(tp); return; }
      setItems(products);
      setTotal(t);
      setTotalPages(tp);
    } catch (e) {
      if (request !== requestId.current) return;
      setError(getApiErrorMessage(e, 'Could not load products.'));
      setItems([]);
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  }, [allCollections, category, page, search]);

  useEffect(() => {
    setPage(1);
    setSearch('');
    setSearchInput('');
    setNotice('');
  }, [category, allCollections]);

  useEffect(() => {
    load();
    return () => { requestId.current += 1; };
  }, [load]);

  if (!allCollections && !isValidCategory(category)) {
    return <Navigate to="/admin/products/necklaces" replace />;
  }

  const label = allCollections ? 'All Collection' : getCategoryLabel(category);
  const listPath = allCollections ? '/admin/collections' : `/admin/products/${category}`;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleDelete = async (id, name) => {
    if (busyId) return;
    if (!window.confirm(`Remove “${name}” from inventory?`)) return;
    setBusyId(id);
    setNotice('');
    setError('');
    try {
      if (allCollections) await deleteCollectionProduct(id);
      else await deleteProduct(category, id);
      setNotice(`“${name}” deleted.`);
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e, 'Delete failed.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleCategoryChange = async (product, slug) => {
    if (busyId || slug === product.categorySlug) return;
    setBusyId(product.id);
    setError('');
    setNotice('');
    try {
      const updated = parseProductResponse(await changeProductCategory(product.id, CATEGORY_SLUG_TO_DB[slug]));
      if (!updated) throw new Error('Invalid product response');
      setItems((previous) => previous.map((item) => item.id === product.id ? updated : item));
      setNotice(`“${product.name}” moved to ${getCategoryLabel(slug)}.`);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Category change failed. Please try again.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-product-list">
      <header className="admin-product-list__head">
        <div>
          <div className="admin-eyebrow"><Sparkles size={14} />Collection Management</div>
          <h2>{label}</h2>
          <p>
            {allCollections ? 'View every product and change its category using the dropdown. ' : `Manage ${label.toLowerCase()} inventory. `}
            {total > 0 ? `${total} total.` : ''}
          </p>
        </div>
        <div className="admin-header-actions">
        <button type="button" className="admin-orders__refresh-btn" disabled={loading || Boolean(busyId)} onClick={load}>
          <RefreshCw size={15} /> Refresh
        </button>
        <Link to={`${listPath}/new`} className="admin-product-list__add">
          <Plus size={18} strokeWidth={2} />
          Add product
        </Link>
        </div>
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
        <button type="submit" className="admin-product-search__btn" disabled={Boolean(busyId)}>
          Search
        </button>
      </form>

      {notice ? <p className="admin-product-list__notice" role="status">{notice}</p> : null}

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
                  {allCollections ? <th scope="col">Category</th> : null}
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
                    {allCollections ? (
                      <td>
                        <select
                          className="admin-product-list__category"
                          aria-label={`Category for ${p.name}`}
                          value={p.categorySlug}
                          disabled={Boolean(busyId)}
                          onChange={(event) => handleCategoryChange(p, event.target.value)}
                        >
                          {ADMIN_PRODUCT_CATEGORIES.map(({ slug, label: categoryLabel }) => (
                            <option key={slug} value={slug}>{categoryLabel}</option>
                          ))}
                        </select>
                        {busyId === p.id ? <small role="status">Saving…</small> : null}
                      </td>
                    ) : null}
                    <td>
                      {p.onSale ? <><del>{formatMoney(p.originalPrice)}</del><br /></> : null}
                      {formatMoney(p.onSale ? p.salePrice : p.price)}
                      {p.onSale ? ` (-${p.discountPercent}%)` : ''}
                    </td>
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
                          to={`${listPath}/${p.id}/view`}
                          className="admin-product-list__action"
                          title="View"
                        >
                          <Eye size={16} strokeWidth={1.75} />
                        </Link>
                        <Link
                          to={`${listPath}/${p.id}/edit`}
                          className="admin-product-list__action"
                          title="Edit"
                        >
                          <Pencil size={16} strokeWidth={1.75} />
                        </Link>
                        <button
                          type="button"
                          className="admin-product-list__action admin-product-list__action--danger"
                          title="Delete"
                          disabled={Boolean(busyId)}
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
                disabled={page <= 1 || Boolean(busyId)}
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
                disabled={page >= totalPages || Boolean(busyId)}
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
