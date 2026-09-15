import { formatStorePrice as formatCurrency } from '../../utils/currency';
import { useCallback, useEffect, useState } from 'react';
import {
  ShoppingBag,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  Euro,
  Search,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Calendar,
  MapPin,
  User,
  CreditCard,
  FileText,
  Sparkles,
} from 'lucide-react';
import { ordersApi } from '../../api/ordersApiClient';
import { getOrderLabel, getOrderCustomerName, formatOrderAmount } from '../../utils/adminOrderHelpers';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];



const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [statistics, setStatistics] = useState({
    total_orders: 0,
    pending_orders: 0,
    delivered_orders: 0,
    shipped_orders: 0,
    processing_orders: 0,
    cancelled_orders: 0,
    total_revenue: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 15;

  // Selected Order for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Updating statuses state (id -> boolean)
  const [updatingId, setUpdatingId] = useState(null);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const fetchOrders = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      try {
        const params = {
          page,
          limit,
          ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
          ...(search.trim() ? { search: search.trim() } : {}),
        };

        const res = await ordersApi.getAdminOrders(params);
        const data = res?.data || {};

        setOrders(data.orders || []);
        if (data.statistics) {
          setStatistics({
            total_orders: Number(data.statistics.total_orders) || 0,
            pending_orders: Number(data.statistics.pending_orders) || 0,
            delivered_orders: Number(data.statistics.delivered_orders) || 0,
            shipped_orders: Number(data.statistics.shipped_orders) || 0,
            processing_orders: Number(data.statistics.processing_orders) || 0,
            cancelled_orders: Number(data.statistics.cancelled_orders) || 0,
            total_revenue: Number(data.statistics.total_revenue) || 0,
          });
        }
        setTotalPages(data.total_pages || 1);
        setTotalItems(data.total_items ?? data.orders?.length ?? 0);
        if (data.current_page) setPage(data.current_page);
      } catch (err) {
        setError(err.message || 'Could not retrieve orders from the server.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, statusFilter, search],
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleUpdateShippingStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    const targetOrder = orders.find((o) => o.id === orderId);
    const orderNum = getOrderLabel(targetOrder || { id: orderId });

    try {
      const res = await ordersApi.updateShippingStatus(orderId, newStatus);
      const updatedOrder = res?.data || { ...targetOrder, shippingStatus: newStatus };

      // Update in orders list
      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, ...updatedOrder, shippingStatus: newStatus } : ord)),
      );

      // Update modal if open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, ...updatedOrder, shippingStatus: newStatus }));
      }

      // Update statistics locally
      setStatistics((prev) => {
        const next = { ...prev };
        if (targetOrder?.shippingStatus && next[`${targetOrder.shippingStatus}_orders`] > 0) {
          next[`${targetOrder.shippingStatus}_orders`] -= 1;
        }
        if (next[`${newStatus}_orders`] !== undefined) {
          next[`${newStatus}_orders`] += 1;
        }
        return next;
      });

      const readableStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      showToast(`Order ${orderNum} status updated to ${readableStatus}`, 'success');
      await fetchOrders(true);
    } catch (err) {
      showToast(err.message || `Failed to update status for ${orderNum}`, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdatePaymentStatus = async (orderId, newPaymentStatus) => {
    setUpdatingId(orderId);
    const targetOrder = orders.find((o) => o.id === orderId);
    const orderNum = getOrderLabel(targetOrder || { id: orderId });

    try {
      const res = await ordersApi.updatePaymentStatus(orderId, newPaymentStatus);
      const updatedOrder = res?.data || { ...targetOrder, paymentStatus: newPaymentStatus };

      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === orderId ? { ...ord, ...updatedOrder, paymentStatus: newPaymentStatus } : ord,
        ),
      );

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({
          ...prev,
          ...updatedOrder,
          paymentStatus: newPaymentStatus,
        }));
      }

      const readable = newPaymentStatus.charAt(0).toUpperCase() + newPaymentStatus.slice(1);
      showToast(`Order ${orderNum} payment marked as ${readable}`, 'success');
      await fetchOrders(true);
    } catch (err) {
      showToast(err.message || `Failed to update payment status for ${orderNum}`, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
  };

  const getShippingBadgeClass = (status) => {
    switch (status) {
      case 'delivered':
        return 'status-badge status-badge--delivered';
      case 'shipped':
        return 'status-badge status-badge--shipped';
      case 'processing':
        return 'status-badge status-badge--processing';
      case 'cancelled':
      case 'refunded':
        return 'status-badge status-badge--cancelled';
      case 'pending':
      default:
        return 'status-badge status-badge--pending';
    }
  };

  const getPaymentBadgeClass = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid':
        return 'payment-badge payment-badge--paid';
      case 'refunded':
        return 'payment-badge payment-badge--refunded';
      case 'unpaid':
      default:
        return 'payment-badge payment-badge--unpaid';
    }
  };

  return (
    <div className="admin-orders-page">
      {/* Toast Alert */}
      {toast ? (
        <aside
          className={`orders-toast orders-toast--${toast.type}`}
          role="status"
          aria-live="polite"
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} className="orders-toast__icon" />
          ) : (
            <AlertCircle size={18} className="orders-toast__icon" />
          )}
          <span className="orders-toast__msg">{toast.message}</span>
          <button
            type="button"
            className="orders-toast__close"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </aside>
      ) : null}

      {/* Header Section */}
      <header className="admin-orders__head">
        <div className="admin-orders__head-text">
          <div className="admin-orders__eyebrow">
            <Sparkles size={14} className="gold-sparkle-icon" />
            <span>Atelier Fulfillment Ledger</span>
          </div>
          <h2>Orders & Shipping Management</h2>
          <p>Monitor customer purchases, fulfill luxury shipments, and inspect itemized orders.</p>
        </div>

        <div className="admin-orders__head-actions">
          <button
            type="button"
            className={`admin-orders__refresh-btn ${refreshing ? 'is-spinning' : ''}`}
            onClick={() => fetchOrders(true)}
            disabled={loading || refreshing}
            title="Refresh order history"
          >
            <RefreshCw size={15} />
            <span>{refreshing ? 'Syncing…' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      {/* Summary Metrics Cards */}
      <section className="orders-summary-cards" aria-label="Order statistics">
        <button
          type="button"
          className={`summary-card-btn ${statusFilter === 'all' ? 'is-active' : ''}`}
          onClick={() => handleStatusFilterChange('all')}
        >
          <div className="summary-card-btn__icon summary-card-btn__icon--gold">
            <ShoppingBag size={20} />
          </div>
          <div className="summary-card-btn__content">
            <span className="summary-card-btn__label">Total Orders</span>
            <strong className="summary-card-btn__value">{statistics.total_orders}</strong>
          </div>
        </button>

        <button
          type="button"
          className={`summary-card-btn ${statusFilter === 'pending' ? 'is-active' : ''}`}
          onClick={() => handleStatusFilterChange('pending')}
        >
          <div className="summary-card-btn__icon summary-card-btn__icon--amber">
            <Clock size={20} />
          </div>
          <div className="summary-card-btn__content">
            <span className="summary-card-btn__label">Pending Shipping</span>
            <strong className="summary-card-btn__value text-amber">
              {statistics.pending_orders}
            </strong>
          </div>
        </button>

        <button
          type="button"
          className={`summary-card-btn ${statusFilter === 'delivered' ? 'is-active' : ''}`}
          onClick={() => handleStatusFilterChange('delivered')}
        >
          <div className="summary-card-btn__icon summary-card-btn__icon--emerald">
            <CheckCircle2 size={20} />
          </div>
          <div className="summary-card-btn__content">
            <span className="summary-card-btn__label">Delivered</span>
            <strong className="summary-card-btn__value text-emerald">
              {statistics.delivered_orders}
            </strong>
          </div>
        </button>

        <div className="summary-card-btn summary-card-btn--static">
          <div className="summary-card-btn__icon summary-card-btn__icon--revenue">
            <Euro size={20} />
          </div>
          <div className="summary-card-btn__content">
            <span className="summary-card-btn__label">Paid Revenue</span>
            <strong className="summary-card-btn__value text-gold">
              {formatCurrency(statistics.total_revenue)}
            </strong>
          </div>
        </div>
      </section>

      {/* Status Filter Tabs & Search Bar */}
      <section className="orders-toolbar">
        <nav className="status-tabs" aria-label="Filter orders by status">
          {STATUS_OPTIONS.map(({ value, label }) => {
            const count =
              value === 'all'
                ? statistics.total_orders
                : statistics[`${value}_orders`] ?? null;

            return (
              <button
                key={value}
                type="button"
                className={`status-tab ${statusFilter === value ? 'status-tab--active' : ''}`}
                onClick={() => handleStatusFilterChange(value)}
              >
                <span>{label}</span>
                {count !== null && count !== undefined ? (
                  <span className="status-tab__count">{count}</span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <form className="orders-search-form" onSubmit={handleSearchSubmit}>
          <div className="orders-search-input-wrap">
            <Search size={16} className="orders-search-icon" />
            <input
              type="search"
              className="orders-search-input"
              placeholder="Search order #, customer, email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search orders"
            />
            {searchInput ? (
              <button
                type="button"
                className="orders-search-clear"
                onClick={handleClearSearch}
                aria-label="Clear search input"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>
          <button type="submit" className="orders-search-submit">
            Search
          </button>
        </form>
      </section>

      {/* Error Message */}
      {error ? (
        <div className="orders-error-banner" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => fetchOrders()}>
            Retry
          </button>
        </div>
      ) : null}

      {/* Main Table Content */}
      <div className="orders-table-wrapper">
        <table className="orders-table">
          <thead>
            <tr>
              <th scope="col">Order #</th>
              <th scope="col">Customer</th>
              <th scope="col">Date</th>
              <th scope="col">Items</th>
              <th scope="col">Total</th>
              <th scope="col">Payment</th>
              <th scope="col">Shipping Status</th>
              <th scope="col">Quick Action</th>
              <th scope="col" className="text-right">
                View
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="orders-table__loading-cell">
                  <div className="orders-table__spinner" />
                  <span>Loading orders ledger…</span>
                </td>
              </tr>
            ) : error ? (
              <tr><td colSpan={9} className="orders-table__empty-cell">Orders could not be loaded. Please retry above.</td></tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={9} className="orders-table__empty-cell">
                  <div className="orders-empty-state">
                    <ShoppingBag size={36} strokeWidth={1.2} />
                    <h4>No Orders Found</h4>
                    <p>
                      {search || statusFilter !== 'all'
                        ? 'No orders match your current filters. Try resetting search or switching status tabs.'
                        : 'No orders have been recorded in the database yet.'}
                    </p>
                    {(search || statusFilter !== 'all') && (
                      <button
                        type="button"
                        className="orders-reset-btn"
                        onClick={() => {
                          setStatusFilter('all');
                          handleClearSearch();
                        }}
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const customerName = getOrderCustomerName(order);
                const customerEmail = order.customer?.email || '—';
                const itemsCount = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
                const isUpdating = updatingId === order.id;

                return (
                  <tr key={order.id} className="orders-table__row">
                    {/* Order Number */}
                    <td>
                      <button
                        type="button"
                        className="order-number-link"
                        onClick={() => handleOpenDetails(order)}
                        title={`View order ${order.id}`}
                      >
                        {getOrderLabel(order)}
                      </button>
                      <span className="order-lifecycle-status">{order.status?.replace(/_/g, ' ') || '—'}</span>
                    </td>

                    {/* Customer */}
                    <td>
                      <div className="customer-info">
                        <span className="customer-info__name">{customerName}</span>
                        <span className="customer-info__email" title={customerEmail}>
                          {customerEmail}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="orders-table__date">{formatDate(order.createdAt)}</td>

                    {/* Items Count */}
                    <td>
                      <span className="items-count-badge">
                        <Package size={13} />
                        <span>
                          {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                        </span>
                      </span>
                    </td>

                    {/* Total Amount */}
                    <td className="orders-table__total">
                      {formatOrderAmount(order.grandTotalAmount ?? order.totalAmount, order.currencyCode)}
                    </td>

                    {/* Payment Status */}
                    <td>
                      <span className={getPaymentBadgeClass(order.paymentStatus)}>
                        {order.paymentStatus?.replace(/_/g, ' ') || 'Unknown'}
                      </span>
                    </td>

                    {/* Shipping Status */}
                    <td>
                      <span className={getShippingBadgeClass(order.shippingStatus)}>
                        {order.shippingStatus === 'delivered' ? (
                          <CheckCircle2 size={12} />
                        ) : order.shippingStatus === 'shipped' ? (
                          <Truck size={12} />
                        ) : (
                          <Clock size={12} />
                        )}
                        <span>{order.shippingStatus || 'pending'}</span>
                      </span>
                    </td>

                    {/* Quick Status Dropdown / Action */}
                    <td>
                      <div className="quick-status-wrap">
                        <select
                          className="quick-status-select"
                          value={order.shippingStatus || 'pending'}
                          disabled={isUpdating}
                          onChange={(e) => handleUpdateShippingStatus(order.id, e.target.value)}
                          aria-label={`Change shipping status for order ${getOrderLabel(order)}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>

                    {/* View Details Button */}
                    <td className="text-right">
                      <button
                        type="button"
                        className="order-action-btn"
                        onClick={() => handleOpenDetails(order)}
                        title="View complete order details"
                      >
                        <Eye size={16} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 ? (
        <footer className="orders-pagination">
          <div className="orders-pagination__meta">
            Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> (
            <strong>{totalItems}</strong> total orders)
          </div>
          <div className="orders-pagination__controls">
            <button
              type="button"
              className="orders-pagination__btn"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <button
              type="button"
              className="orders-pagination__btn"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      ) : null}

      {/* Order Details Modal / Drawer */}
      {selectedOrder ? (
        <div
          className="order-modal-backdrop"
          onClick={() => setSelectedOrder(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-modal-title"
        >
          <div className="order-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <header className="order-modal__header">
              <div>
                <div className="order-modal__subtitle">
                  <span>Order Inspection</span>
                  <span className="order-modal__dot">•</span>
                  <span className="order-modal__date">
                    <Calendar size={13} />
                    {formatDate(selectedOrder.createdAt)}
                  </span>
                </div>
                <h3 id="order-modal-title" className="order-modal__title">
                  {getOrderLabel(selectedOrder)}
                </h3>
                <p className="order-full-id">Order ID: {selectedOrder.id}</p>
              </div>

              <div className="order-modal__head-right">
                <span className={getShippingBadgeClass(selectedOrder.shippingStatus)}>
                  {selectedOrder.shippingStatus || 'pending'}
                </span>
                <span className={getPaymentBadgeClass(selectedOrder.paymentStatus)}>
                  {selectedOrder.paymentStatus?.replace(/_/g, ' ') || 'Unknown'}
                </span>
                <button
                  type="button"
                  className="order-modal__close-btn"
                  onClick={() => setSelectedOrder(null)}
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>
            </header>

            {/* Quick Status Control Bar inside Modal */}
            <section className="order-modal__status-bar">
              <div className="modal-status-group">
                <label htmlFor="modal-shipping-status">Shipping Fulfillment:</label>
                <select
                  id="modal-shipping-status"
                  className="modal-select"
                  value={selectedOrder.shippingStatus || 'pending'}
                  disabled={updatingId === selectedOrder.id}
                  onChange={(e) =>
                    handleUpdateShippingStatus(selectedOrder.id, e.target.value)
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="modal-status-group">
                <label htmlFor="modal-payment-status">Payment State:</label>
                <select
                  id="modal-payment-status"
                  className="modal-select"
                  value={selectedOrder.paymentStatus || ''}
                  disabled={updatingId === selectedOrder.id}
                  onChange={(e) =>
                    handleUpdatePaymentStatus(selectedOrder.id, e.target.value)
                  }
                >
                  <option value="" disabled>Unknown</option>
                  <option value="pending">Pending</option>
                  <option value="requires_payment">Requires payment</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </section>

            {/* Modal Body: 2 Columns */}
            <div className="order-modal__body">
              {/* Left Column: Client & Address Details */}
              <div className="order-modal__col">
                {/* Customer Details */}
                <article className="order-modal__card">
                  <h4 className="card-title">
                    <User size={16} />
                    <span>Client Information</span>
                  </h4>
                  <div className="client-details-grid">
                    <div>
                      <span className="detail-label">Name</span>
                      <strong className="detail-value">
                        {getOrderCustomerName(selectedOrder)}
                      </strong>
                    </div>
                    <div>
                      <span className="detail-label">Email</span>
                      <span className="detail-value">
                        {selectedOrder.customer?.email ||
                          selectedOrder.shipping_address?.email ||
                          '—'}
                      </span>
                    </div>
                    <div>
                      <span className="detail-label">Phone</span>
                      <span className="detail-value">
                        {selectedOrder.customer?.phone ||
                          selectedOrder.shipping_address?.phone ||
                          '—'}
                      </span>
                    </div>
                    <div>
                      <span className="detail-label">Payment Method</span>
                      <span className="detail-value capitalize">
                        {selectedOrder.paymentMethod?.replace(/_/g, ' ') || 'Not provided'}
                      </span>
                    </div>
                  </div>
                </article>

                {/* Shipping Destination */}
                <article className="order-modal__card">
                  <h4 className="card-title">
                    <MapPin size={16} />
                    <span>Shipping Destination</span>
                  </h4>
                  {selectedOrder.shipping_address ? (
                    <address className="address-block">
                      <p className="address-recipient">
                        {selectedOrder.shipping_address.full_name}
                      </p>
                      <p>{selectedOrder.shipping_address.address_line1}</p>
                      {selectedOrder.shipping_address.address_line2 ? (
                        <p>{selectedOrder.shipping_address.address_line2}</p>
                      ) : null}
                      <p>
                        {[
                          selectedOrder.shipping_address.city,
                          selectedOrder.shipping_address.state,
                          selectedOrder.shipping_address.postal_code,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      {selectedOrder.shipping_address.country ? (
                        <p className="address-country">
                          {selectedOrder.shipping_address.country}
                        </p>
                      ) : null}
                    </address>
                  ) : (
                    <p className="empty-text">No shipping address recorded.</p>
                  )}
                </article>

                {/* Customer Notes */}
                {selectedOrder.notes ? (
                  <article className="order-modal__card order-modal__card--notes">
                    <h4 className="card-title">
                      <FileText size={16} />
                      <span>Client Instructions</span>
                    </h4>
                    <blockquote className="customer-notes-quote">
                      "{selectedOrder.notes}"
                    </blockquote>
                  </article>
                ) : null}
              </div>

              {/* Right Column: Itemized Products & Financial Breakdown */}
              <div className="order-modal__col">
                <article className="order-modal__card">
                  <h4 className="card-title">
                    <Package size={16} />
                    <span>Itemized Atelier Pieces</span>
                  </h4>

                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    <ul className="modal-item-list">
                      {selectedOrder.items.map((item, idx) => {
                        const snap = item.product_snapshot || {};
                        const title =
                          item.productName || snap.name || item.product?.name || `Product #${item.productId}`;
                        const sku = snap.sku || item.product?.sku;
                        const image =
                          snap.images?.[0] || item.product?.images?.[0] || null;
                        const ringSize = snap.ring_size || item.ring_size;

                        return (
                          <li key={item.id || idx} className="modal-item-row">
                            <div className="modal-item-thumb">
                              {image ? (
                                <img src={image} alt={title} />
                              ) : (
                                <Sparkles size={16} className="modal-thumb-icon" />
                              )}
                            </div>
                            <div className="modal-item-body">
                              <h5 className="modal-item-name">{title}</h5>
                              <div className="modal-item-meta">
                                {sku ? <span className="modal-item-sku">SKU: {sku}</span> : null}
                                {item.productCategory ? <span>{item.productCategory}</span> : null}
                                {ringSize ? (
                                  <span className="modal-item-size">
                                    Ring Size: {ringSize}
                                  </span>
                                ) : null}
                              </div>
                              <span className="modal-item-price-calc">
                                {formatOrderAmount(item.unitPrice, selectedOrder.currencyCode)} × {item.quantity}
                              </span>
                            </div>
                            <div className="modal-item-total">
                              {formatOrderAmount(item.lineTotal ?? item.unitPrice * item.quantity, selectedOrder.currencyCode)}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="empty-text">No itemized products available.</p>
                  )}

                  {/* Financial Summary */}
                  <div className="modal-financial-summary">
                    <div className="fin-row">
                      <span>Subtotal</span>
                      <span>{formatOrderAmount(selectedOrder.subtotalAmount, selectedOrder.currencyCode)}</span>
                    </div>
                    <div className="fin-row">
                      <span>Shipping</span>
                      <span className="text-emerald">
                        {formatOrderAmount(selectedOrder.shippingAmount, selectedOrder.currencyCode)}
                      </span>
                    </div>
                    {Number(selectedOrder.vatAmount) > 0 ? (
                      <div className="fin-row">
                        <span>VAT</span>
                        <span>{formatOrderAmount(selectedOrder.vatAmount, selectedOrder.currencyCode)}</span>
                      </div>
                    ) : null}
                    <div className="fin-row fin-row--grand-total">
                      <span>Grand Total</span>
                      <strong className="text-gold">
                        {formatOrderAmount(selectedOrder.grandTotalAmount ?? selectedOrder.totalAmount, selectedOrder.currencyCode)}
                      </strong>
                    </div>
                  </div>
                </article>
              </div>
            </div>

            {/* Modal Footer */}
            <footer className="order-modal__footer">
              <button
                type="button"
                className="modal-btn-close"
                onClick={() => setSelectedOrder(null)}
              >
                Close Inspector
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminOrders;
