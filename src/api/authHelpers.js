/**
 * @param {User | null | undefined} user
 * @returns {string}
 */
export function getUserDisplayName(user) {
  if (!user) return '';
  const fromParts = [user.firstName, user.lastName].filter(Boolean).join(' ');
  if (fromParts) return fromParts;
  return user.name || user.email || '';
}

/**
 * @param {object} res
 * @returns {{ user: object, accessToken: string, refreshToken: string } | null}
 */
export function parseAuthResult(res) {
  const data = res?.data;
  if (!data?.user || !data?.accessToken || !data?.refreshToken) return null;
  return {
    user: data.user,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  };
}

/**
 * @param {object} res
 * @returns {object | null}
 */
export function parseMeUser(res) {
  return res?.data?.user ?? null;
}

/**
 * @param {object} res
 * @returns {{ accessToken: string, refreshToken: string } | null}
 */
export function parseTokenPair(res) {
  const data = res?.data;
  if (!data?.accessToken || !data?.refreshToken) return null;
  return { accessToken: data.accessToken, refreshToken: data.refreshToken };
}
