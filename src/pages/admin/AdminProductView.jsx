import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import { getProduct } from '../../api/products.api';
import { parseProductResponse } from '../../utils/productHelpers';
import { isValidCategory, getCategoryLabel } from '../../constants/productCategories';
import { getApiErrorMessage } from '../../utils/adminAuth';
import './AdminProductForm.css';

const formatMoney = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const AdminProductView = () => {
  const { id, category } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isValidCategory(category)) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getProduct(category, id);
        const p = parseProductResponse(res);
        if (cancelled) return;
        if (!p) setError('Invalid response.');
        else setProduct(p);
      } catch (e) {
        if (!cancelled) setError(getApiErrorMessage(e, 'Could not load product.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, category]);

  if (!isValidCategory(category)) {
    return <Navigate to="/admin/products/necklaces" replace />;
  }

  const label = getCategoryLabel(category);
  const listPath = `/admin/products/${category}`;

  if (loading) {
    return (
      <div className="admin-product-form">
        <p className="admin-product-list__empty">Loading…</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="admin-product-form">
        <p className="admin-product-form__error">{error || 'Product not found.'}</p>
        <button
          type="button"
          className="admin-product-form__btn admin-product-form__btn--primary"
          onClick={() => navigate(listPath)}
        >
          Back to list
        </button>
      </div>
    );
  }

  return (
    <div className="admin-product-form admin-product-view">
      <button type="button" className="admin-product-form__backlink" onClick={() => navigate(listPath)}>
        <ArrowLeft size={16} />
        Back to {label}
      </button>

      <div className="admin-product-view__head">
        <h2 className="admin-product-form__title">{product.name}</h2>
        <Link
          to={`/admin/products/${category}/${product.id}/edit`}
          className="admin-product-view__edit"
        >
          <Pencil size={16} />
          Edit
        </Link>
      </div>

      <dl className="admin-product-view__dl">
        <dt>ID</dt>
        <dd>{product.id}</dd>
        <dt>Category</dt>
        <dd>{product.category}</dd>
        <dt>Price</dt>
        <dd>{formatMoney(product.price)}</dd>
        <dt>Quantity</dt>
        <dd>{product.quantity}</dd>
        <dt>Listed</dt>
        <dd>{product.isAvailable ? 'Yes' : 'No'}</dd>
        <dt>Stock status</dt>
        <dd>{product.inStock ? 'In stock' : 'Out of stock'}</dd>
        <dt>Description</dt>
        <dd>{product.description || '—'}</dd>
        {product.createdAt ? (
          <>
            <dt>Created</dt>
            <dd>{new Date(product.createdAt).toLocaleString()}</dd>
          </>
        ) : null}
      </dl>

      {product.imageUrl ? (
        <div className="admin-product-view__hero media-frame media-frame--preview-lg">
          <img src={product.imageUrl} alt={product.name} />
        </div>
      ) : null}
    </div>
  );
};

export default AdminProductView;
