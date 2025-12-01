// Re-export types
export type { AuthUser } from './auth/types';

// Re-export server functions (only use in server components/API routes)
export { getAuthenticatedUser, requireAuth } from './auth/server';

// Re-export client functions (only use in client components)
export { getClientUser } from './auth/client';

