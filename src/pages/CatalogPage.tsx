import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Save, X, Search } from 'lucide-react';
import type { CatalogItem, ItemKind } from '../types';
import { listRows, insertRow, updateRow, deleteRow } from '../lib/db';
import { isSupabaseConfigured } from '../lib/supabase';
import { Card, PageHeader, Button, Field, TextArea, Select, Empty, ErrorBox, money } from '../components/ui';

const empty: Partial<CatalogItem> = {
  kind: 'material',
  name: '',
  description: '',
  unit: 'un',
  unit_price: 0,
  cost_price: null,
  active: true,
};

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<CatalogItem> | null>(null);
  const [filter, setFilter] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | ItemKind>('all');

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setItems(await listRows<CatalogItem>('catalog_items', 'name', true));
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar catálogo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.name?.trim()) return alert('Nome é obrigatório');
    try {
      const payload: any = {
        kind: editing.kind || 'material',
        name: editing.name,
        description: editing.description || null,
        unit: editing.unit || 'un',
        unit_price: Number(editing.unit_price || 0),
        cost_price: editing.cost_price === null || editing.cost_price === undefined || String(editing.cost_price) === '' ? null : Number(editing.cost_price),
        active: editing.active !== false,
      };
      if (editing.id) await updateRow('catalog_items', editing.id, payload);
      else await insertRow('catalog_items', payload);
      setEditing(null);
      await load();
    } catch (e: any) {
      alert(e?.message || 'Erro ao salvar');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir este item do catálogo?')) return;
    try { await deleteRow('catalog_items', id); await load(); } catch (e: any) { alert(e?.message || 'Erro ao excluir'); }
  };

  const filtered = items.filter(i => {
    const okKind = kindFilter === 'all' || i.kind === kindFilter;
    const q = filter.trim().toLowerCase();
    const okQ = !q || i.name.toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q);
    return okKind && okQ;
  });

  if (!isSupabaseConfigured) return <ErrorBox message="Supabase não configurado." />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Catálogo"
        subtitle="Materiais e serviços com preço de venda e custo."
        action={<Button onClick={() => setEditing({ ...empty })}><Plus size={18} /> Novo item</Button>}
      />

      {error && <ErrorBox message={error} />}

      {editing && (
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select label="Tipo" value={editing.kind || 'material'} onChange={v => setEditing({ ...editing, kind: v as ItemKind })} options={[{ value: 'material', label: 'Material' }, { value: 'service', label: 'Serviço' }]} />
            <Field label="Nome" required value={editing.name || ''} onChange={v => setEditing({ ...editing, name: v })} className="md:col-span-2" />
            <TextArea label="Descrição" value={editing.description || ''} onChange={v => setEditing({ ...editing, description: v })} className="md:col-span-3" rows={2} />
            <Field label="Unidade" value={editing.unit || 'un'} onChange={v => setEditing({ ...editing, unit: v })} />
            <Field label="Preço de venda (R$)" type="number" step="0.01" min="0" value={String(editing.unit_price ?? 0)} onChange={v => setEditing({ ...editing, unit_price: Number(v) })} />
            <Field label="Custo (R$)" type="number" step="0.01" min="0" value={editing.cost_price === null || editing.cost_price === undefined ? '' : String(editing.cost_price)} onChange={v => setEditing({ ...editing, cost_price: v === '' ? null : Number(v) })} />
          </div>
          <div className="flex gap-2">
            <Button onClick={save}><Save size={16} /> Salvar</Button>
            <Button variant="secondary" onClick={() => setEditing(null)}><X size={16} /> Cancelar</Button>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Buscar…" className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-white" />
        </div>
        <select value={kindFilter} onChange={e => setKindFilter(e.target.value as any)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
          <option value="all">Todos os tipos</option>
          <option value="material">Materiais</option>
          <option value="service">Serviços</option>
        </select>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left p-3">Tipo</th>
              <th className="text-left p-3">Nome</th>
              <th className="text-left p-3">Un.</th>
              <th className="text-right p-3">Custo</th>
              <th className="text-right p-3">Venda</th>
              <th className="p-3 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><Empty message="Carregando…" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6}><Empty message="Nenhum item cadastrado." /></td></tr>
            ) : filtered.map(i => (
              <tr key={i.id} className="border-t">
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${i.kind === 'material' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'}`}>
                    {i.kind === 'material' ? 'Material' : 'Serviço'}
                  </span>
                </td>
                <td className="p-3 font-medium">{i.name}{i.description ? <div className="text-xs text-slate-500 font-normal">{i.description}</div> : null}</td>
                <td className="p-3">{i.unit || 'un'}</td>
                <td className="p-3 text-right text-slate-500">{i.cost_price != null ? money(i.cost_price) : '—'}</td>
                <td className="p-3 text-right font-medium">{money(i.unit_price)}</td>
                <td className="p-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditing(i)} className="p-1.5 rounded hover:bg-slate-100" title="Editar"><Pencil size={16} /></button>
                    <button onClick={() => remove(i.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Excluir"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
