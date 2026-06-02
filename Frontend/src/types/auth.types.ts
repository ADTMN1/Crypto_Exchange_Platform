export interface User {
  id: string
  email: string
  name?: string
  username?: string
  role: 'user' | 'admin'
  profile_image?: string
}

export interface UserCredentials {
  email: string
  password: string
}
