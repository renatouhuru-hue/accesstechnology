import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Save, X, Search, Users, Mail, Phone, MapPin } from 'lucide-react';
import type { Client } from '../types';
import { listRows, insertRow, updateRow, deleteRow } from '../lib/db';
import { isSupabaseConfigured } from '../lib/supabase';
import { Avatar, Button, Card, ErrorBox, Field, PageHeader } from '../components/ui';

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
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir este cliente?')) return;
    try { await deleteRow('clients', id); await load(); } catch (e: any) { alert(e?.message || 'Erro ao excluir'); }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(c =>
      [c.company_name, c.trade_name, c.cnpj, c.contact_name, c.city, c.email]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q)),
    );
  }, [items, search]);

  if (!isSupabaseConfigured) {
    return <ErrorBox message="Supabase não configurado." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Relacionamento"
        title="Clientes"
        subtitle={`${items.length} empresas cadastradas com dados fiscais, contato e endereço.`}
        action={<Button onClick={() => setEditing({ ...empty })}><Plus size={18} /> Novo cliente</Button>}
      />

      {error && <ErrorBox message={error} />}

      {editing && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">
                {editing.id ? 'Editar cliente' : 'Novo cliente'}
              </h2>
              <p className="text-[11.5px] text-slate-400">Dados usados nos orçamentos, OS e recibos.</p>
            </div>
            <button onClick={() => setEditing(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
            <Field label="Razão social" required value={editing.company_name || ''} onChange={v => setEditing({ ...editing, company_name: v })} className="md:col-span-2" />
            <Field label="Nome fantasia" value={editing.trade_name || ''} onChange={v => setEditing({ ...editing, trade_name: v })} />
            <Field label="CNPJ" value={editing.cnpj || ''} onChange={v => setEditing({ ...editing, cnpj: v })} />
            <Field label="Telefone" value={editing.phone || ''} onChange={v => setEditing({ ...editing, phone: v })} />
            <Field label="E-mail" value={editing.email || ''} onChange={v => setEditing({ ...editing, email: v })} />
            <Field label="Contato" value={editing.contact_name || ''} onChange={v => setEditing({ ...editing, contact_name: v })} />
            <Field label="Endereço" value={editing.address || ''} onChange={v => setEditing({ ...editing, address: v })} className="md:col-span-2" />
            <Field label="Cidade" value={editing.city || ''} onChange={v => setEditing({ ...editing, city: v })} />
            <Field label="UF" value={editing.state || ''} onChange={v => setEditing({ ...editing, state: v })} />
            <Field label="CEP" value={editing.zip || ''} onChange={v => setEditing({ ...editing, zip: v })} />
            <Field label="Observações" value={editing.notes || ''} onChange={v => setEditing({ ...editing, notes: v })} className="md:col-span-3" />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5">
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}><Save size={16} /> {saving ? 'Salvando…' : 'Salvar cliente'}</Button>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome, CNPJ, contato ou cidade…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-[13px] text-slate-700 transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>
          <div className="flex items-center gap-2 text-[11.5px] text-slate-400">
            <Users size={14} /> {filtered.length} de {items.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                <th className="px-4 py-3 text-left font-semibold">Cliente</th>
                <th className="px-2 py-3 text-left font-semibold">CNPJ</th>
                <th className="px-2 py-3 text-left font-semibold">Contato</th>
                <th className="px-2 py-3 text-left font-semibold">Cidade/UF</th>
                <th className="w-28 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-sm text-slate-400">Carregando clientes…</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center gap-2 p-12 text-center">
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><Users size={20} /></div>
                      <div className="text-sm font-medium text-slate-700">
                        {items.length === 0 ? 'Nenhum cliente cadastrado' : 'Nenhum cliente encontrado'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {items.length === 0 ? 'Cadastre a primeira empresa para emitir orçamentos.' : 'Tente outro termo de busca.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.trade_name || c.company_name} />
                      <div className="min-w-0">
                        <div className="max-w-[280px] truncate text-[13px] font-medium text-slate-800">{c.company_name}</div>
                        {c.trade_name && <div className="truncate text-[11px] text-slate-400">{c.trade_name}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3.5 text-[12px] tabular-nums text-slate-500">{c.cnpj || '—'}</td>
                  <td className="px-2 py-3.5">
                    <div className="flex flex-col gap-0.5 text-[12px] text-slate-600">
                      <span>{c.contact_name || <span className="text-slate-300">Sem contato</span>}</span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Phone size={10} /> {c.phone || '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-3.5">
                    <div className="flex items-center gap-1 text-[12px] text-slate-600">
                      <MapPin size={12} className="text-slate-300" />
                      {[c.city, c.state].filter(Boolean).join('/') || '—'}
                    </div>
                    {c.email && (
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                        <Mail size={10} /> {c.email}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                      <button onClick={() => setEditing(c)} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-900 hover:shadow-sm" title="Editar">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => remove(c.id)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600" title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
