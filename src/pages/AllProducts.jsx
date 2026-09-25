import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { listAllCatalogProducts } from '../api/catalog.api';
import { getApiErrorMessage } from '../utils/adminAuth';
import { useLanguage } from '../context/LanguageContextValue';

const PAGE_SIZE = 12;

const VARIANT_META = {
  all: {
    titleKey: 'catalog.allPieces',
    bg: '/hero_bg.png',
    descKey: 'catalog.allPiecesDescription',
  },
  new: {
    titleKey: 'catalog.newArrivals',
    bg: '/cat_newin.png',
    descKey: 'catalog.newArrivalsDescription',
  },
};

const AllProducts = ({ variant = 'all' }) => {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const result = await listAllCatalogProducts({ page, limit: PAGE_SIZE, inStockOnly });
        if (!cancelled) {
          setProducts(result.products);
          setTotalPages(result.totalPages);
        }
      } catch (e) {
        if (!cancelled) {
          setError(getApiErrorMessage(e, t('category.loadError')));
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [page, inStockOnly, t]);

  const meta = VARIANT_META[variant] ?? VARIANT_META.all;

  return (
    <div className="category-page">
      <div className="category-header" style={{ backgroundImage: `url(${meta.bg})` }}>
        <h1 className="category-title">{t(meta.titleKey)}</h1>
        <p className="category-desc">{t(meta.descKey)}</p>
      </div>

      <div className="container">
        <div className="category-filters">
          <div className="filter-group">
            <button
              type="button"
              className={`filter-btn ${!inStockOnly ? 'active' : ''}`}
              onClick={() => { setPage(1); setInStockOnly(false); }}
            >
              {t('category.all')}
            </button>
            <button
              type="button"
              className={`filter-btn ${inStockOnly ? 'active' : ''}`}
              onClick={() => { setPage(1); setInStockOnly(true); }}
            >
              {t('category.inStock')}
            </button>
          </div>
        </div>

        {error ? (
          <p className="category-error" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="empty-state">{t('category.loading')}</p>
        ) : (
          <>
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard key={`${product.category}-${product.id}`} product={product} categorySlug={product.categorySlug} />
              ))}
            </div>

            {products.length === 0 && !error ? (
              <div className="empty-state">
                <p>{t('catalog.empty')}</p>
              </div>
            ) : null}

            {totalPages > 1 ? (
              <div className="category-pager">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {t('common.previous')}
                </button>
                <span>
                  {t('common.pageOf', { page, total: totalPages })}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  {t('common.next')}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default AllProducts;
