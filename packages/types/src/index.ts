export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface Target {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

export interface Weapon {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}
