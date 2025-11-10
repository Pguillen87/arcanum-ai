// Wrapper leve do client Supabase para facilitar injeção/mocks em testes.
// Mantém dependências isoladas e prepara terreno para serviços especializados.
import { supabase } from './client'

export const supabaseService = {
  getClient: () => supabase,
  auth: {
    signInWithEmail: async (email: string, password: string) => {
      return supabase.auth.signInWithPassword({ email, password })
    },
    signOut: async () => {
      return supabase.auth.signOut()
    },
    signUpEmail: async (email: string, password: string, fullName: string) => {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined
      return supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { full_name: fullName },
        },
      })
    },
  },
}

export type { Database } from './types'

