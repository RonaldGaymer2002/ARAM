import type { DefaultSession } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

export type Rol = 'admin' | 'empresa';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      rol: Rol;
      empresaId: string | null;
    };
  }

  interface User {
    id: string;
    rol: Rol;
    empresaId: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    rol: Rol;
    empresaId: string | null;
  }
}

export type { JWT };
