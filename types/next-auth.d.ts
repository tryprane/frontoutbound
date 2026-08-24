import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      platformRole?: 'SUPER_ADMIN' | 'USER'
      activeOrganizationId?: string | null
      activeOrganizationName?: string | null
      activeOrganizationRole?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    platformRole?: 'SUPER_ADMIN' | 'USER'
    activeOrganizationId?: string | null
  }
}
