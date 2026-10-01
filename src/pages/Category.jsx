import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Navigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { listCatalogProducts } from '../api/catalog.api';
import { isValidCategory } from '../constants/productCategories';
import { getApiErrorMessage } from '../utils/adminAuth';
import { useLanguage } from '../context/LanguageContextValue';

const PAGE_SIZE = 12;

const CATEGORY_META = {
  necklaces: { titleKey: 'category.necklacesTitle', video: '/gemini_generated_video_5028b0fc.mp4' },
  earrings: { titleKey: 'category.earringsTitle', video: '/gemini_generated_video_1d5bf7e3.mp4' },
  rings: { titleKey: 'category.ringsTitle', video: '/gemini_generated_video_1c4ccc39.mp4' },
  bracelets: { titleKey: 'category.braceletsTitle', video: '/gemini_generated_video_eb1eec95.mp4' },
  gifts: { titleKey: 'category.giftsTitle', video: '/gemini_generated_video_5529b9fe.mp4' },
};

const CategoryCollection = ({ category, search }) => {
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
      if (!isValidCategory(category)) return;
      setLoading(true);
      setError('');
      try {
        const result = await listCatalogProducts(category, {
          page,
          limit: PAGE_SIZE,
          inStockOnly,
          search,
        });
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
  }, [category, page, inStockOnly, search, t]);

  if (!isValidCategory(category)) {
    return <Navigate to="/collections/necklaces" replace />;
  }

  const meta = CATEGORY_META[category] ?? { titleKey: 'category.ourCollection', bg: '/necklace.png' };
  const label = t(`category.${category}`);

  return (
    <div className="category-page">
      <div className="category-header" style={meta.bg ? { backgroundImage: `url(${meta.bg})` } : undefined}>
        {meta.video && (
          <video
            src={meta.video}
            autoPlay
            loop
            muted
            playsInline
            className="category-header__video"
          />
        )}
        <h1 className="category-title">{t(meta.titleKey)}</h1>
        <p className="category-desc">{t('category.description', { category: label.toLowerCase() })}</p>
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
        {search && <p className="search-summary">{t('category.results', { search, category: label.toLowerCase() })}</p>}

        {loading ? (
          <p className="empty-state">{t('category.loading')}</p>
        ) : (
          <>
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} categorySlug={category} />
              ))}
            </div>

            {products.length === 0 && !error ? (
              <div className="empty-state">
                <p>{t('category.empty')}</p>
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

export default function Category() {
  const { category } = useParams();
  const [params] = useSearchParams();
  const search = params.get('search') || '';
  return <CategoryCollection key={`${category}-${search}`} category={category} search={search} />;
}
