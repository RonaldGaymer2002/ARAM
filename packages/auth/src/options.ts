import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, perfiles, users } from '@fundares/db';
import './types';

export function createAuthOptions(): NextAuthOptions {
  return {
    secret: process.env.NEXTAUTH_SECRET,
    session: { strategy: 'jwt' },
    pages: { signIn: '/login' },
    providers: [
      CredentialsProvider({
        name: 'credentials',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
          const email = credentials?.email?.trim().toLowerCase();
          const password = credentials?.password;

          if (!email || !password) {
            return null;
          }

          const [user] = await db()
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!user) {
            return null;
          }

          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) {
            return null;
          }

          const [perfil] = await db()
            .select()
            .from(perfiles)
            .where(eq(perfiles.id, user.id))
            .limit(1);

          if (!perfil || (perfil.rol !== 'admin' && perfil.rol !== 'empresa')) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            rol: perfil.rol as 'admin' | 'empresa',
            empresaId: perfil.empresaId,
          };
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          token.rol = user.rol;
          token.empresaId = user.empresaId;
        }
        return token;
      },
      async session({ session, token }) {
        session.user.id = token.id;
        session.user.rol = token.rol;
        session.user.empresaId = token.empresaId;
        return session;
      },
    },
  };
}
