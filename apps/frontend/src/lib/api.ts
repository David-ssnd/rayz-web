/**
 * API Configuration
 * Base URL for backend API calls
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * API Client helper functions
 */
export const api = {
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, options)
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    return response.json()
  },

  async post<T>(endpoint: string, data: unknown, options?: RequestInit): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    return response.json()
  },

  async put<T>(endpoint: string, data: unknown, options?: RequestInit): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    return response.json()
  },

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    return response.json()
  },
}
