/**
 * @typedef {'customer' | 'admin'} UserRole
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} firstName
 * @property {string} lastName
 * @property {UserRole} role
 * @property {boolean} isActive
 * @property {boolean} emailVerified
 */

/**
 * @typedef {Object} AuthTokens
 * @property {string} accessToken
 * @property {string} refreshToken
 */

/**
 * @typedef {Object} AuthResult
 * @property {User} user
 * @property {string} accessToken
 * @property {string} refreshToken
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {string} message
 * @property {AuthResult|{ user: User }|AuthTokens} [data]
 */

export const UserRole = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
};

export default {};
