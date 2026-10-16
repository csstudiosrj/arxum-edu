'use server'

import { getMarcaPorEmail, type MarcaEscola } from '@/lib/auth/marca'

export async function buscarMarcaPorEmail(email: string): Promise<MarcaEscola | null> {
  if (!email || !email.includes('@')) return null
  return await getMarcaPorEmail(email)
}