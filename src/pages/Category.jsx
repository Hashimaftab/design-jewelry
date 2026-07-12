import { useCallback, useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { listCatalogProducts } from '../api/catalog.api';
import { isValidCategory, getCategoryLabel } from '../constants/productCategories';
import { getApiErrorMessage } from '../utils/adminAuth';
import './Category.css';

const PAGE_SIZE = 12;

const CATEGORY_META = {
  necklaces: { title: 'Timeless Necklaces', bg: '/hero_bg.png' },
  earrings: { title: 'Brilliant Studs', bg: '/shop_look.png' },
  rings: { title: 'Signature Rings', bg: '/gift_love.png' },
  bracelets: { title: 'Refined Bracelets', bg: '/shop_look.png' },
};

const Category = () => {
  const { category } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [inStockOnly, setInStockOnly] = useState(false);

  const load = useCallback(async () => {
    if (!isValidCategory(category)) return;
    setLoading(true);
    setError('');
    try {
      const result = await listCatalogProducts(category, {
        page,
        limit: PAGE_SIZE,
        inStockOnly,
      });
      setProducts(result.products);
      setTotalPages(result.totalPages);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not load products.'));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [category, page, inStockOnly]);

  useEffect(() => {
    setPage(1);
  }, [category, inStockOnly]);

  useEffect(() => {
    load();
  }, [load]);

  if (!isValidCategory(category)) {
    return <Navigate to="/collections/necklaces" replace />;
  }

  const meta = CATEGORY_META[category] ?? { title: 'Our Collection', bg: '/necklace.png' };
  const label = getCategoryLabel(category);

  return (
    <div className="category-page">
      <div className="category-header" style={{ backgroundImage: `url(${meta.bg})` }}>
        <h1 className="category-title">{meta.title}</h1>
        <p className="category-desc">
          Explore our curated selection of fine {label.toLowerCase()}, designed to illuminate your
          everyday.
        </p>
      </div>

      <div className="container">
        <div className="category-filters">
          <div className="filter-group">
            <button
              type="button"
              className={`filter-btn ${!inStockOnly ? 'active' : ''}`}
              onClick={() => setInStockOnly(false)}
            >
              All
            </button>
            <button
              type="button"
              className={`filter-btn ${inStockOnly ? 'active' : ''}`}
              onClick={() => setInStockOnly(true)}
            >
              In stock
            </button>
          </div>
        </div>

        {error ? (
          <p className="category-error" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="empty-state">Loading collection…</p>
        ) : (
          <>
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} categorySlug={category} />
              ))}
            </div>

            {products.length === 0 && !error ? (
              <div className="empty-state">
                <p>No products found in this category.</p>
              </div>
            ) : null}

            {totalPages > 1 ? (
              <div className="category-pager">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default Category;
