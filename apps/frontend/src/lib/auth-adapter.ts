import type { Adapter } from 'next-auth/adapters'

/**
 * Backend adapter for NextAuth
 * This adapter would connect to the backend API for user management
 * Currently not in use as JWT strategy is used instead
 */
export function backendAdapter(): Adapter {
  return {
    async createUser() {
      throw new Error('Not implemented')
    },
    async getUser() {
      throw new Error('Not implemented')
    },
    async getUserByEmail() {
      throw new Error('Not implemented')
    },
    async getUserByAccount() {
      throw new Error('Not implemented')
    },
    async updateUser() {
      throw new Error('Not implemented')
    },
    async deleteUser() {
      throw new Error('Not implemented')
    },
    async linkAccount() {
      throw new Error('Not implemented')
    },
    async unlinkAccount() {
      throw new Error('Not implemented')
    },
    async getSessionAndUser() {
      throw new Error('Not implemented')
    },
    async createSession() {
      throw new Error('Not implemented')
    },
    async updateSession() {
      throw new Error('Not implemented')
    },
    async deleteSession() {
      throw new Error('Not implemented')
    },
    async createVerificationToken() {
      throw new Error('Not implemented')
    },
    async useVerificationToken() {
      throw new Error('Not implemented')
    },
  }
}
