import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import type { Client } from '../types';
import { listRows, insertRow, updateRow, deleteRow } from '../lib/db';
import { isSupabaseConfigured } from '../lib/supabase';

const empty: Partial<Client> = {
  company_name: '',
  trade_name: '',
  cnpj: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  phone: '',
  contact_name: '',
  email: '',
  notes: '',
};

export default function ClientsPage() {
  const [items, setItems] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Client> | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listRows<Client>('clients');
      setItems(data);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.company_name?.trim()) return alert('Razão social é obrigatória');
    try {
      const payload = { ...editing };
      delete (payload as any).id;
      delete (payload as any).created_at;
      delete (payload as any).updated_at;
      if (editing.id) await updateRow<Client>('clients', editing.id, payload);
      else await insertRow<Client>('clients', payload);
      setEditing(null);
      await load();
    } catch (e: any) {
      alert(e?.message || 'Erro ao salvar');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir este cliente?')) return;
    try { await deleteRow('clients', id); await load(); } catch (e: any) { alert(e?.message || 'Erro ao excluir'); }
  };

  if (!isSupabaseConfigured) {
    return <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl">Supabase não configurado.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-slate-600">Razão social, CNPJ, endereço, telefone e contato.</p>
        </div>
        <button onClick={() => setEditing({ ...empty })} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg">
          <Plus size={18} /> Novo cliente
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">{error}</div>}

      {editing && (
        <div className="bg-white rounded-xl p-4 shadow-sm border space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Razão social *" value={editing.company_name || ''} onChange={v => setEditing({ ...editing, company_name: v })} />
            <Field label="Nome fantasia" value={editing.trade_name || ''} onChange={v => setEditing({ ...editing, trade_name: v })} />
            <Field label="CNPJ" value={editing.cnpj || ''} onChange={v => setEditing({ ...editing, cnpj: v })} />
            <Field label="Telefone" value={editing.phone || ''} onChange={v => setEditing({ ...editing, phone: v })} />
            <Field label="Contato" value={editing.contact_name || ''} onChange={v => setEditing({ ...editing, contact_name: v })} />
            <Field label="E-mail" value={editing.email || ''} onChange={v => setEditing({ ...editing, email: v })} />
            <Field label="Endereço" value={editing.address || ''} onChange={v => setEditing({ ...editing, address: v })} className="md:col-span-2" />
            <Field label="Cidade" value={editing.city || ''} onChange={v => setEditing({ ...editing, city: v })} />
            <Field label="UF" value={editing.state || ''} onChange={v => setEditing({ ...editing, state: v })} />
            <Field label="CEP" value={editing.zip || ''} onChange={v => setEditing({ ...editing, zip: v })} />
            <Field label="Observações" value={editing.notes || ''} onChange={v => setEditing({ ...editing, notes: v })} className="md:col-span-2" />
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg"><Save size={16}/> Salvar</button>
            <button onClick={() => setEditing(null)} className="inline-flex items-center gap-2 bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded-lg"><X size={16}/> Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left p-3">Razão social</th>
              <th className="text-left p-3">Contato</th>
              <th className="text-left p-3">Telefone</th>
              <th className="text-left p-3">Cidade/UF</th>
              <th className="p-3 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4 text-slate-500" colSpan={5}>Carregando…</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="p-4 text-slate-500" colSpan={5}>Nenhum cliente cadastrado.</td></tr>
            ) : items.map(c => (
              <tr key={c.id} className="border-t">
                <td className="p-3 font-medium">{c.company_name}{c.trade_name ? <span className="text-slate-500 font-normal"> — {c.trade_name}</span> : null}</td>
                <td className="p-3">{c.contact_name || '—'}</td>
                <td className="p-3">{c.phone || '—'}</td>
                <td className="p-3">{[c.city, c.state].filter(Boolean).join('/') || '—'}</td>
                <td className="p-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditing(c)} className="p-1.5 rounded hover:bg-slate-100" title="Editar"><Pencil size={16}/></button>
                    <button onClick={() => remove(c.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Excluir"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, className = '' }: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm text-slate-600">{label}</span>
      <input value={value} onChange={e => onChange(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
    </label>
  );
}
