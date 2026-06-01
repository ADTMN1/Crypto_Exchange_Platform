export interface User {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
}

export interface UserCredentials {
  email: string
  password: string
}
