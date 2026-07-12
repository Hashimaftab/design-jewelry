/**
 * Normalize Laravel UserResource / Spatie / custom role shapes for the admin console.
 */
export const isAdminRole = (u) => {
  if (!u || typeof u !== 'object') return false;
  if (u.is_admin === true) return true;

  const r = u.role;
  if (typeof r === 'string') {
    return isAdminRoleString(r);
  }
  if (r && typeof r === 'object') {
    const name = r.name ?? r.slug ?? r.key ?? r.value;
    if (name != null) return isAdminRoleString(String(name));
  }

  const alt = u.role_name ?? u.role_slug ?? u.type;
  if (alt != null) return isAdminRoleString(String(alt));

  return false;
};

function isAdminRoleString(s) {
  const key = s.toUpperCase().replace(/[\s-]/g, '_');
  return (
    key === 'ADMIN' ||
    key === 'SUPER_ADMIN' ||
    key === 'SUPERADMIN' ||
    key === 'ADMINISTRATOR'
  );
}

/** Axios/Laravel error → single message string */
export const getApiErrorMessage = (error, fallback = 'Something went wrong.') => {
  const d = error?.response?.data;
  if (!d) return error?.message || fallback;

  if (typeof d.message === 'string' && d.message.trim()) {
    return d.message;
  }

  if (Array.isArray(d.errors) && d.errors.length > 0) {
    return String(d.errors[0]);
  }

  const errors = d.errors;
  if (errors && typeof errors === 'object') {
    const firstKey = Object.keys(errors)[0];
    const first = firstKey != null ? errors[firstKey] : null;
    if (Array.isArray(first) && first[0]) return String(first[0]);
    if (typeof first === 'string') return first;
  }

  if (d.error && typeof d.error === 'string') return d.error;

  return fallback;
};
