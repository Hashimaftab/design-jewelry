export function getOrderLabel(order) {
  return order.orderNumber || `#${String(order.id).slice(0, 8).toUpperCase()}`;
}

export function getOrderCustomerName(order) {
  return [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(' ').trim()
    || order.customer?.name || 'Guest Customer';
}

export function formatOrderAmount(amount, currencyCode = 'eur') {
  if (amount == null || !Number.isFinite(Number(amount))) return '—';
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: currencyCode.toUpperCase(),
  }).format(Number(amount));
}

// The admin API returns the full list without pagination or statistics.
export function getAdminOrdersPage(orders, params = {}) {
  const statistics = {
    total_orders: orders.length,
    pending_orders: 0,
    processing_orders: 0,
    shipped_orders: 0,
    delivered_orders: 0,
    cancelled_orders: 0,
    total_revenue: 0,
  };
  for (const order of orders) {
    const key = `${order.shippingStatus}_orders`;
    if (Object.hasOwn(statistics, key)) statistics[key] += 1;
    if (order.paymentStatus === 'paid') {
      statistics.total_revenue += Number(order.grandTotalAmount ?? order.totalAmount ?? 0);
    }
  }
  statistics.total_revenue = Math.round(statistics.total_revenue * 100) / 100;

  const search = String(params.search || '').trim().toLowerCase();
  const filtered = orders.filter((order) => {
    if (params.status && params.status !== 'all' && order.shippingStatus !== params.status) return false;
    if (params.payment_status && order.paymentStatus !== params.payment_status) return false;
    return !search || [order.id, getOrderLabel(order), getOrderCustomerName(order), order.customer?.email]
      .some((value) => String(value || '').toLowerCase().includes(search));
  });
  const limit = Math.max(1, Math.floor(Number(params.limit) || 15));
  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const page = Math.min(totalPages, Math.max(1, Math.floor(Number(params.page) || 1)));
  return {
    orders: filtered.slice((page - 1) * limit, page * limit),
    statistics,
    total_items: filtered.length,
    total_pages: totalPages,
    current_page: page,
    per_page: limit,
  };
}
