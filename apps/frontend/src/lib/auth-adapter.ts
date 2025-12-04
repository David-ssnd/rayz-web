import type { Adapter, AdapterAccount, AdapterUser, VerificationToken } from 'next-auth/adapters'

const backendBaseUrl = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL
const adapterSecret = process.env.ADAPTER_SECRET

function assertEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`${name} is not set`)
  }

  return value
}

async function adapterFetch<T>(path: string, init: RequestInit = {}) {
  const baseUrl = assertEnv(backendBaseUrl, 'BACKEND_API_URL or NEXT_PUBLIC_BACKEND_URL')
  const secret = assertEnv(adapterSecret, 'ADAPTER_SECRET')
  const headers = new Headers(init.headers)
  headers.set('x-adapter-secret', secret)
  headers.set('content-type', 'application/json')

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Adapter request failed: ${response.status}`)
  }

  return (await response.json()) as T
}

export function backendAdapter(): Adapter {
  return {
    async createUser(user: AdapterUser) {
      return adapterFetch<AdapterUser>('/api/adapter/user', {
        method: 'POST',
        body: JSON.stringify(user),
      })
    },

    async getUser(id: string) {
      if (!id) return null
      return adapterFetch<AdapterUser | null>(`/api/adapter/user/${id}`)
    },

    async getUserByEmail(email: string) {
      if (!email) return null
      const encoded = encodeURIComponent(email)
      return adapterFetch<AdapterUser | null>(`/api/adapter/user/email/${encoded}`)
    },

    async getUserByAccount({
      provider,
      providerAccountId,
    }: {
      provider?: string | null
      providerAccountId?: string | null
    }) {
      if (!provider || !providerAccountId) return null
      const params = new URLSearchParams({ provider, providerAccountId })
      return adapterFetch<AdapterUser | null>(`/api/adapter/user/account?${params.toString()}`)
    },

    async updateUser(user: Partial<AdapterUser> & { id: string }) {
      if (!user.id) {
        throw new Error('User id is required')
      }

      return adapterFetch<AdapterUser>(`/api/adapter/user/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify(user),
      })
    },

    async linkAccount(account: AdapterAccount) {
      return adapterFetch<AdapterAccount>('/api/adapter/account', {
        method: 'POST',
        body: JSON.stringify(account),
      })
    },

    async createVerificationToken(token: VerificationToken) {
      return adapterFetch<VerificationToken>('/api/adapter/verification-token', {
        method: 'POST',
        body: JSON.stringify(token),
      })
    },

    async useVerificationToken(token: VerificationToken) {
      return adapterFetch<VerificationToken | null>('/api/adapter/verification-token/use', {
        method: 'POST',
        body: JSON.stringify(token),
      })
    },
  }
}
