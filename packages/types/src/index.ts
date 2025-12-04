export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
}

export interface Profile {
  id: string
  userId: string
  bio: string | null
  avatarUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Target {
  id: string
  userId: string
  bio: string | null
  avatarUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Target {
  id: string
  name: string
  status: 'active' | 'inactive'
}

export interface Weapon {
  id: string
  name: string
  status: 'active' | 'inactive'
}
