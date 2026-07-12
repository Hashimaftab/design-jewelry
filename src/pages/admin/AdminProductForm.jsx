import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, Upload, X } from 'lucide-react';
import {
  buildProductFormData,
  createProduct,
  updateProduct,
  getProduct,
} from '../../api/products.api';
import { parseProductResponse } from '../../utils/productHelpers';
import { isValidCategory, getCategoryLabel } from '../../constants/productCategories';
import { getApiErrorMessage } from '../../utils/adminAuth';
import './AdminProductForm.css';

const AdminProductForm = () => {
  const { category, id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const serverImageUrlRef = useRef('');

  const isEdit = id != null && id !== 'new';
  const isCreate = !isEdit;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [isAvailable, setIsAvailable] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    if (!isValidCategory(category)) return;

    if (!isEdit) {
      setName('');
      setDescription('');
      setPrice('');
      setQuantity('0');
      setIsAvailable(true);
      setImageFile(null);
      setImagePreview('');
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
        serverImageUrlRef.current = p.imageUrl || '';
        setImagePreview(p.imageUrl || '');
        setImageFile(null);
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

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Only JPEG, PNG, or WebP images are allowed.');
      return;
    }
    setError('');
    setImageFile(file);
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearNewImage = () => {
    setImageFile(null);
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImagePreview(isEdit ? serverImageUrlRef.current : '');
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
    if (isCreate && !imageFile) {
      setError('Product image is required.');
      return;
    }

    setSaving(true);
    try {
      const fields = {
        name: name.trim(),
        description: description.trim(),
        price: priceNum,
        quantity: qtyNum,
        isAvailable,
      };
      if (imageFile) fields.image = imageFile;

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
            <label htmlFor="p-price">Price (USD)</label>
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

        <div className="admin-product-form__field product-upload-section">
          <span className="product-upload-section__label">
            Image {isCreate ? '(required)' : '(optional — leave unchanged to keep current)'}
          </span>
          <p className="admin-product-form__hint">JPEG, PNG, or WebP. Max 5 MB.</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="product-upload-section__input"
            onChange={handleImageChange}
            aria-label="Choose product image"
          />
          <button
            type="button"
            className="product-upload-section__choose"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={18} strokeWidth={2} />
            Choose image
          </button>

          {imagePreview ? (
            <div className="product-upload-section__preview media-frame media-frame--preview-lg">
              <img src={imagePreview} alt="Preview" />
              {imageFile ? (
                <button
                  type="button"
                  className="product-upload-section__remove"
                  onClick={clearNewImage}
                  aria-label="Remove new image"
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>
          ) : null}
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
