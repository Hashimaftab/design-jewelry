import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import {
  buildProductFormData,
  createProduct,
  updateProduct,
  getProduct,
} from '../../api/products.api';
import { parseProductResponse } from '../../utils/productHelpers';
import { isValidCategory, getCategoryLabel } from '../../constants/productCategories';
import { getApiErrorMessage } from '../../utils/adminAuth';

const MAX_IMAGES = 4;

const AdminProductForm = () => {
  const { category, id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const isEdit = id != null && id !== 'new';
  const isCreate = !isEdit;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [isAvailable, setIsAvailable] = useState(true);
  const [images, setImages] = useState([]); // Array of { id, url, file, isServer }
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    return () => {
      images.forEach((item) => {
        if (item.url?.startsWith('blob:')) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, [images]);

  useEffect(() => {
    if (!isValidCategory(category)) return;

    if (!isEdit) {
      setName('');
      setDescription('');
      setPrice('');
      setQuantity('0');
      setIsAvailable(true);
      setImages([]);
      setError('');
      setNotFound(false);
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
        if (!p) {
          setNotFound(true);
          return;
        }
        setNotFound(false);
        setName(p.name);
        setDescription(p.description);
        setPrice(String(p.price));
        setQuantity(String(p.quantity));
        setIsAvailable(p.isAvailable);

        const loadedImages = Array.isArray(p.images) && p.images.length > 0
          ? p.images
          : p.imageUrl ? [p.imageUrl] : [];

        setImages(
          loadedImages.map((url, idx) => ({
            id: `server-${idx}-${Date.now()}`,
            url,
            file: null,
            isServer: true,
          })),
        );
      } catch (e) {
        if (!cancelled) {
          if (e?.response?.status === 404) setNotFound(true);
          else setError(getApiErrorMessage(e, 'Could not load product.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [category, id, isEdit]);

  const handleImageFilesAdd = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    e.target.value = '';
    if (selectedFiles.length === 0) return;

    setError('');
    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      setError(`You have already uploaded the maximum of ${MAX_IMAGES} images.`);
      return;
    }

    if (selectedFiles.length > remainingSlots) {
      setError(
        `Only ${remainingSlots} more image(s) could be added (maximum ${MAX_IMAGES} total).`,
      );
    }

    const filesToAdd = selectedFiles.slice(0, remainingSlots);
    const newItems = [];

    for (const file of filesToAdd) {
      if (!file.type.startsWith('image/')) {
        setError('Only JPEG, PNG, or WebP images are allowed.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`"${file.name}" exceeds the 5MB file size limit.`);
        return;
      }

      newItems.push({
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        url: URL.createObjectURL(file),
        file,
        isServer: false,
      });
    }

    setImages((prev) => [...prev, ...newItems].slice(0, MAX_IMAGES));
  };

  const handleRemoveImage = (idToRemove) => {
    setError('');
    setImages((prev) => {
      const target = prev.find((it) => it.id === idToRemove);
      if (target?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((it) => it.id !== idToRemove);
    });
  };

  const handleMoveImage = (currentIndex, direction) => {
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    setImages((prev) => {
      const next = [...prev];
      const temp = next[currentIndex];
      next[currentIndex] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const priceNum = parseFloat(price);
    const qtyNum = parseInt(quantity, 10);

    if (Number.isNaN(priceNum) || priceNum <= 0) {
      setError('Enter a valid price greater than 0.');
      return;
    }
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }
    if (Number.isNaN(qtyNum) || qtyNum < 0) {
      setError('Quantity must be 0 or greater.');
      return;
    }
    if (images.length === 0) {
      setError('At least one product image is required.');
      return;
    }
    if (images.length > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed per product.`);
      return;
    }

    setSaving(true);
    try {
      const existingImages = images.filter((it) => it.isServer).map((it) => it.url);
      const newFiles = images.filter((it) => it.file instanceof File).map((it) => it.file);

      const fields = {
        name: name.trim(),
        description: description.trim(),
        price: priceNum,
        quantity: qtyNum,
        isAvailable,
        images: newFiles,
        existingImages,
      };

      const form = buildProductFormData(fields);

      if (isCreate) {
        await createProduct(category, form);
      } else {
        await updateProduct(category, id, form);
      }
      navigate(`/admin/products/${category}`, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Save failed.'));
    } finally {
      setSaving(false);
    }
  };

  if (!isValidCategory(category)) {
    return <Navigate to="/admin/products/necklaces" replace />;
  }

  const label = getCategoryLabel(category);
  const listPath = `/admin/products/${category}`;

  if (notFound) {
    return (
      <div className="admin-product-form">
        <p className="admin-product-form__error">Product not found.</p>
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

  if (loading) {
    return (
      <div className="admin-product-form">
        <p className="admin-product-list__empty">Loading…</p>
      </div>
    );
  }

  return (
    <div className="admin-product-form">
      <button type="button" className="admin-product-form__backlink" onClick={() => navigate(listPath)}>
        <ArrowLeft size={16} />
        Back to {label}
      </button>

      <div className="admin-eyebrow"><Sparkles size={14} />Collection Studio</div>
      <h2 className="admin-product-form__title">
        {isCreate ? `Add ${label.toLowerCase().slice(0, -1)}` : 'Edit product'}
      </h2>

      {error ? (
        <p className="admin-product-form__error" role="alert">
          {error}
        </p>
      ) : null}

      <form className="admin-product-form__form" onSubmit={handleSubmit}>
        <div className="admin-product-form__field">
          <label htmlFor="p-cat">Collection</label>
          <input
            id="p-cat"
            type="text"
            value={label}
            disabled
            className="admin-product-form__input admin-product-form__input--disabled"
          />
        </div>

        <div className="admin-product-form__field">
          <label htmlFor="p-name">Name</label>
          <input
            id="p-name"
            className="admin-product-form__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="admin-product-form__field">
          <label htmlFor="p-desc">Description</label>
          <textarea
            id="p-desc"
            className="admin-product-form__textarea"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="admin-product-form__row">
          <div className="admin-product-form__field">
            <label htmlFor="p-price">Price (EUR)</label>
            <input
              id="p-price"
              type="number"
              min="0.01"
              step="0.01"
              className="admin-product-form__input"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <div className="admin-product-form__field">
            <label htmlFor="p-qty">Quantity</label>
            <input
              id="p-qty"
              type="number"
              min="0"
              step="1"
              className="admin-product-form__input"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="admin-product-form__field admin-product-form__field--check">
          <label htmlFor="p-available">
            <input
              id="p-available"
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
            />
            Listed on storefront (isAvailable)
          </label>
        </div>

        {/* Up to 4 Images Multi-Upload Section */}
        <div className="admin-product-form__field product-upload-section">
          <div className="product-upload-section__header">
            <span className="product-upload-section__label">
              Product Images ({images.length}/{MAX_IMAGES})
            </span>
            <span className="product-upload-section__hint-badge">
              Max {MAX_IMAGES} photos
            </span>
          </div>

          <p className="admin-product-form__hint">
            <strong>Slot 1</strong> is the primary cover image. <strong>Slot 2</strong> is revealed smoothly when customers hover over the product in the storefront. Slots 3 &amp; 4 appear in the product gallery.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="product-upload-section__input"
            onChange={handleImageFilesAdd}
            aria-label="Choose product images"
          />

          <div className="product-upload-grid">
            {images.map((item, index) => (
              <div
                key={item.id}
                className={`product-upload-tile ${
                  index === 0
                    ? 'product-upload-tile--primary'
                    : index === 1
                    ? 'product-upload-tile--hover'
                    : ''
                }`}
              >
                <div className="product-upload-tile__thumb media-frame media-frame--preview">
                  <img src={item.url} alt={`Upload slot ${index + 1}`} />
                  <button
                    type="button"
                    className="product-upload-tile__remove"
                    onClick={() => handleRemoveImage(item.id)}
                    title="Remove image"
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="product-upload-tile__footer">
                  <span className="product-upload-tile__role">
                    {index === 0
                      ? '1 • Primary'
                      : index === 1
                      ? '2 • Hover'
                      : `${index + 1} • Gallery`}
                  </span>

                  <div className="product-upload-tile__nav">
                    <button
                      type="button"
                      className="product-upload-tile__nav-btn"
                      disabled={index === 0}
                      onClick={() => handleMoveImage(index, -1)}
                      title="Move left"
                      aria-label={`Move image ${index + 1} left`}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      type="button"
                      className="product-upload-tile__nav-btn"
                      disabled={index === images.length - 1}
                      onClick={() => handleMoveImage(index, 1)}
                      title="Move right"
                      aria-label={`Move image ${index + 1} right`}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {images.length < MAX_IMAGES && (
              <button
                type="button"
                className="product-upload-add-tile"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={22} strokeWidth={1.75} />
                <span className="product-upload-add-tile__text">Add Image</span>
                <span className="product-upload-add-tile__count">
                  ({images.length}/{MAX_IMAGES})
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="admin-product-form__actions">
          <button
            type="button"
            className="admin-product-form__btn admin-product-form__btn--ghost"
            onClick={() => navigate(listPath)}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="admin-product-form__btn admin-product-form__btn--primary"
            disabled={saving}
          >
            {saving ? 'Saving…' : isCreate ? 'Create product' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm;
