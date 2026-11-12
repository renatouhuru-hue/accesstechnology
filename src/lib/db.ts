import { supabase } from './supabase';

export async function listRows<T>(table: string, orderBy = 'created_at', ascending = false): Promise<T[]> {
  if (!supabase) throw new Error('Supabase não configurado');
  const { data, error } = await supabase.from(table).select('*').order(orderBy, { ascending });
  if (error) throw error;
  return (data ?? []) as T[];
}

export async function insertRow<T>(table: string, payload: Record<string, any>): Promise<T> {
  if (!supabase) throw new Error('Supabase não configurado');
  const { data, error } = await supabase.from(table).insert(payload).select('*').single();
  if (error) throw error;
  return data as T;
}

export async function updateRow<T>(table: string, id: string, payload: Record<string, any>): Promise<T> {
  if (!supabase) throw new Error('Supabase não configurado');
  const { data, error } = await supabase.from(table).update(payload).eq('id', id).select('*').single();
  if (error) throw error;
  return data as T;
}

export async function deleteRow(table: string, id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase não configurado');
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}
