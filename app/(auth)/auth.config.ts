import type { NextAuthConfig } from 'next-auth';
import { PATH_CONFIG } from '@/lib/path-config';

export const authConfig = {
  pages: {
    signIn: PATH_CONFIG.login,
    newUser: PATH_CONFIG.home,
  },
  trustHost: true,
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnChat = nextUrl.pathname.startsWith(PATH_CONFIG.home);
      const isOnRegister = nextUrl.pathname.startsWith(PATH_CONFIG.register);
      const isOnLogin = nextUrl.pathname.startsWith(PATH_CONFIG.login);

      if (isLoggedIn && (isOnLogin || isOnRegister)) {
        return Response.redirect(new URL(PATH_CONFIG.home, nextUrl as unknown as URL));
      }

      if (isOnRegister || isOnLogin) {
        return true; // Always allow access to register and login pages
      }

      if (isOnChat) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }

      if (isLoggedIn) {
        return Response.redirect(new URL(PATH_CONFIG.home, nextUrl as unknown as URL));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
