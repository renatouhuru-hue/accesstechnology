import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Save, ArrowLeft, Printer, Upload, Search, FileText, CheckCircle2, Wallet } from 'lucide-react';
import type { CatalogItem, Client, ItemKind, Order, OrderItem } from '../types';
import { listRows, insertRow, updateRow, deleteRow } from '../lib/db';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Tone } from '../components/ui';
import { Card, PageHeader, Button, Field, TextArea, Select, Empty, ErrorBox, money, Badge, Avatar } from '../components/ui';

const quoteLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
  cancelado: 'Cancelado',
};
const serviceLabels: Record<string, string> = {
  nao_iniciado: 'Não iniciado',
  agendado: 'Agendado',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

const quoteTones: Record<string, Tone> = {
  rascunho: 'slate',
  enviado: 'teal',
  aprovado: 'emerald',
  reprovado: 'red',
  cancelado: 'slate',
};
const serviceTones: Record<string, Tone> = {
  nao_iniciado: 'slate',
  agendado: 'amber',
  em_andamento: 'teal',
  concluido: 'emerald',
  cancelado: 'slate',
};

type DraftItem = Partial<OrderItem> & { _key: string };

function newItem(kind: ItemKind = 'material'): DraftItem {
  return {
    _key: Math.random().toString(36).slice(2),
    kind,
    description: '',
    quantity: 1,
    unit: 'un',
    unit_cost: null,
    markup_percent: null,
    unit_price: 0,
    sort_order: 0,
  };
}

export default function OrdersPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Order | null>(null);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMarkup, setImportMarkup] = useState('30');
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [o, c, cat] = await Promise.all([
        listRows<Order>('orders', 'created_at', false),
        listRows<Client>('clients', 'company_name', true),
        listRows<CatalogItem>('catalog_items', 'name', true),
      ]);
      setOrders(o);
      setClients(c);
      setCatalog(cat);

      if (supabase) {
        const { data: rows } = await supabase.from('order_items').select('order_id,total_price');
        const map: Record<string, number> = {};
        for (const r of rows || []) {
          map[r.order_id] = (map[r.order_id] || 0) + Number(r.total_price || 0);
        }
        setTotals(map);
      }
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar orçamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    const today = new Date().toISOString().slice(0, 10);
    const valid = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);
    setEditing({
      id: '',
      client_id: '',
      title: '',
      scope: '',
      quote_status: 'rascunho',
      service_status: 'nao_iniciado',
      issue_date: today,
      valid_until: valid,
      discount: 0,
      notes: '',
      payment_terms: '',
    });
    setItems([newItem('material'), newItem('service')]);
  };

  const openEdit = async (order: Order) => {
    try {
      if (!supabase) return;
      const { data, error } = await supabase.from('order_items').select('*').eq('order_id', order.id).order('sort_order');
      if (error) throw error;
      setEditing(order);
      setItems((data || []).map((it: any) => ({ ...it, _key: it.id })));
    } catch (e: any) {
      alert(e?.message || 'Erro ao abrir orçamento');
    }
  };

  const close = () => { setEditing(null); setItems([]); navigate('/ordens'); };

  const totalMaterial = items.filter(i => i.kind === 'material').reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0);
  const totalService = items.filter(i => i.kind === 'service').reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0);
  const discount = Number(editing?.discount || 0);
  const total = totalMaterial + totalService - discount;

  const updateItem = (key: string, patch: Partial<DraftItem>) => {
    setItems(prev => prev.map(it => it._key === key ? { ...it, ...patch } : it));
  };

  const applyMarkup = (key: string, pct: number) => {
    setItems(prev => prev.map(it => {
      if (it._key !== key) return it;
      const cost = Number(it.unit_cost || 0);
      const price = cost > 0 ? +(cost * (1 + pct / 100)).toFixed(2) : Number(it.unit_price || 0);
      return { ...it, markup_percent: pct, unit_price: price };
    }));
  };

  const addFromCatalog = (catalogId: string) => {
    const c = catalog.find(x => x.id === catalogId);
    if (!c) return;
    setItems(prev => [...prev, {
      _key: Math.random().toString(36).slice(2),
      catalog_item_id: c.id,
      kind: c.kind,
      description: c.name,
      quantity: 1,
      unit: c.unit || 'un',
      unit_cost: c.cost_price ?? null,
      unit_price: Number(c.unit_price || 0),
      sort_order: prev.length,
    }]);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.client_id) return alert('Selecione o cliente');
    setSaving(true);
    try {
      if (!supabase) throw new Error('Supabase não configurado');
      const orderPayload: any = {
        client_id: editing.client_id,
        title: editing.title || null,
        scope: editing.scope || null,
        quote_status: editing.quote_status,
        service_status: editing.service_status,
        issue_date: editing.issue_date || null,
        valid_until: editing.valid_until || null,
        discount: Number(editing.discount || 0),
        notes: editing.notes || null,
        payment_terms: editing.payment_terms || null,
        approved_at: editing.quote_status === 'aprovado' ? (editing.approved_at || new Date().toISOString()) : null,
        completed_at: editing.service_status === 'concluido' ? (editing.completed_at || new Date().toISOString()) : null,
      };

      let orderId = editing.id;
      if (orderId) {
        const { error: e1 } = await supabase.from('orders').update(orderPayload).eq('id', orderId);
        if (e1) throw e1;
        const { error: e2 } = await supabase.from('order_items').delete().eq('order_id', orderId);
        if (e2) throw e2;
      } else {
        const { data, error: e1 } = await supabase.from('orders').insert(orderPayload).select('id').single();
        if (e1) throw e1;
        orderId = data.id;
      }

      const cleanItems = items.filter(i => (i.description || '').trim()).map((it, idx) => ({
        order_id: orderId,
        catalog_item_id: it.catalog_item_id || null,
        kind: it.kind || 'material',
        description: it.description,
        quantity: Number(it.quantity || 1),
        unit: it.unit || 'un',
        unit_cost: it.unit_cost === null || it.unit_cost === undefined ? null : Number(it.unit_cost),
        markup_percent: it.markup_percent === null || it.markup_percent === undefined ? null : Number(it.markup_percent),
        unit_price: Number(it.unit_price || 0),
        sort_order: idx,
      }));
      if (cleanItems.length) {
        const { error: e3 } = await supabase.from('order_items').insert(cleanItems);
        if (e3) throw e3;
      }
      await load();
      close();
    } catch (e: any) {
      alert(e?.message || 'Erro ao salvar orçamento');
    } finally {
      setSaving(false);
    }
  };

  const removeOrder = async (order: Order) => {
    if (!confirm(`Excluir o orçamento #${order.number}?`)) return;
    try { await deleteRow('orders', order.id); await load(); } catch (e: any) { alert(e?.message || 'Erro ao excluir'); }
  };

  const applyImport = () => {
    const lines = importText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const pct = Number(importMarkup || 0);
    const parsed: DraftItem[] = [];
    for (const line of lines) {
      const parts = line.split(/[;\t]|,(?=\s*\d)/).map(p => p.trim()).filter(Boolean);
      if (parts.length < 2) continue;
      let description = parts[0];
      let qty = 1;
      let cost = 0;
      if (parts.length >= 3) {
        qty = Number(parts[1].replace(',', '.')) || 1;
        cost = Number(parts[2].replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
      } else {
        cost = Number(parts[1].replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
      }
      parsed.push({
        _key: Math.random().toString(36).slice(2),
        kind: 'material',
        description,
        quantity: qty,
        unit: 'un',
        unit_cost: cost,
        markup_percent: pct,
        unit_price: +(cost * (1 + pct / 100)).toFixed(2),
        sort_order: parsed.length,
      });
    }
    if (!parsed.length) return alert('Não consegui interpretar nenhuma linha. Use: descrição;qtd;valor');
    setItems(prev => [...prev, ...parsed]);
    setImportOpen(false);
    setImportText('');
  };

  const filteredOrders = orders.filter(o => {
    const cli = clients.find(c => c.id === o.client_id);
    const q = search.trim().toLowerCase();
    const matchesQuery =
      !q ||
      [o.number?.toString(), cli?.company_name, cli?.trade_name, o.title]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q));
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'aberto' && (o.quote_status === 'rascunho' || o.quote_status === 'enviado')) ||
      (statusFilter === 'aprovado' && o.quote_status === 'aprovado') ||
      (statusFilter === 'concluido' && o.service_status === 'concluido');
    return matchesQuery && matchesStatus;
  });

  const openOrders = orders.filter(o => o.quote_status === 'rascunho' || o.quote_status === 'enviado');
  const approvedOrders = orders.filter(o => o.quote_status === 'aprovado');
  const totalOpen = openOrders.reduce((s, o) => s + (totals[o.id] || 0), 0);
  const totalApproved = approvedOrders.reduce((s, o) => s + (totals[o.id] || 0), 0);
  const totalAll = orders.reduce((s, o) => s + (totals[o.id] || 0), 0);

  if (!isSupabaseConfigured) return <ErrorBox message="Supabase não configurado." />;

  if (editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={close}><ArrowLeft size={18} /></Button>
            <PageHeader title={editing.id ? `Orçamento #${editing.number ?? ''}` : 'Novo orçamento / OS'} subtitle="Materiais, serviços e status." />
          </div>
          <div className="flex gap-2">
            {editing.id && (
              <Link to={`/ordens/${editing.id}/imprimir`} target="_blank">
                <Button variant="secondary"><Printer size={16} /> Imprimir</Button>
              </Link>
            )}
            <Button onClick={save} disabled={saving}><Save size={16} /> {saving ? 'Salvando…' : 'Salvar'}</Button>
          </div>
        </div>

        <Card className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select
            label="Cliente"
            value={editing.client_id || ''}
            onChange={v => setEditing({ ...editing, client_id: v })}
            options={[{ value: '', label: 'Selecione…' }, ...clients.map(c => ({ value: c.id, label: c.trade_name || c.company_name }))]}
          />
          <Field label="Título/Objetivo" value={editing.title || ''} onChange={v => setEditing({ ...editing, title: v })} />
          <Field label="Validade" type="date" value={editing.valid_until || ''} onChange={v => setEditing({ ...editing, valid_until: v })} />
          <TextArea label="Contemplação / Escopo" value={editing.scope || ''} onChange={v => setEditing({ ...editing, scope: v })} rows={2} className="md:col-span-3" />
          <Select label="Status do orçamento" value={editing.quote_status} onChange={v => setEditing({ ...editing, quote_status: v as any })} options={Object.entries(quoteLabels).map(([value, label]) => ({ value, label }))} />
          <Select label="Status do serviço" value={editing.service_status} onChange={v => setEditing({ ...editing, service_status: v as any })} options={Object.entries(serviceLabels).map(([value, label]) => ({ value, label }))} />
          <Field label="Desconto (R$)" type="number" step="0.01" min="0" value={String(editing.discount ?? 0)} onChange={v => setEditing({ ...editing, discount: Number(v) })} />
          <TextArea label="Condições de pagamento" value={editing.payment_terms || ''} onChange={v => setEditing({ ...editing, payment_terms: v })} rows={2} />
          <TextArea label="Observações" value={editing.notes || ''} onChange={v => setEditing({ ...editing, notes: v })} rows={2} className="md:col-span-2" />
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Itens</h2>
            <div className="flex flex-wrap gap-2">
              <select onChange={e => { addFromCatalog(e.target.value); e.target.value = ''; }} className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                <option value="">Adicionar do catálogo…</option>
                {catalog.map(c => <option key={c.id} value={c.id}>{c.kind === 'material' ? '[M]' : '[S]'} {c.name} — {money(c.unit_price)}</option>)}
              </select>
              <Button variant="secondary" onClick={() => setItems(prev => [...prev, newItem('material')])}><Plus size={16} /> Material</Button>
              <Button variant="secondary" onClick={() => setItems(prev => [...prev, newItem('service')])}><Plus size={16} /> Serviço</Button>
              <Button variant="secondary" onClick={() => setImportOpen(true)}><Upload size={16} /> Importar</Button>
            </div>
          </div>

          {importOpen && (
            <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50">
              <p className="text-sm text-slate-600">Cole as linhas do orçamento do fornecedor no formato <strong>descrição;quantidade;valor unitário</strong> (uma por linha). O % será aplicado sobre o valor de custo.</p>
              <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={5} className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono" placeholder={'Cabo HDMI 2m;2;25,00\nFonte 12V;1;80,00'} />
              <div className="flex items-end gap-2">
                <Field label="% de acréscimo" type="number" step="0.01" value={importMarkup} onChange={setImportMarkup} className="w-40" />
                <Button onClick={applyImport}>Aplicar</Button>
                <Button variant="secondary" onClick={() => setImportOpen(false)}>Cancelar</Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-[12.5px]">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                  <th className="p-2 text-left font-semibold">Tipo</th>
                  <th className="p-2 text-left font-semibold">Descrição</th>
                  <th className="w-24 p-2 text-right font-semibold">Qtd</th>
                  <th className="w-20 p-2 text-left font-semibold">Un.</th>
                  <th className="w-28 p-2 text-right font-semibold">Custo</th>
                  <th className="w-24 p-2 text-right font-semibold">%</th>
                  <th className="w-32 p-2 text-right font-semibold">Valor unit.</th>
                  <th className="w-32 p-2 text-right font-semibold">Total</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={9}><Empty message="Adicione materiais ou serviços." /></td></tr>
                ) : items.map(it => (
                  <tr key={it._key} className="border-t">
                    <td className="p-2">
                      <select value={it.kind} onChange={e => updateItem(it._key, { kind: e.target.value as ItemKind })} className="rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-[11px]">
                        <option value="material">Material</option>
                        <option value="service">Serviço</option>
                      </select>
                    </td>
                    <td className="p-2"><input value={it.description || ''} onChange={e => updateItem(it._key, { description: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[12.5px] text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Descrição" /></td>
                    <td className="p-2"><input type="number" step="0.001" value={String(it.quantity ?? 1)} onChange={e => updateItem(it._key, { quantity: Number(e.target.value) })} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-[12.5px] tabular-nums text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" /></td>
                    <td className="p-2"><input value={it.unit || ''} onChange={e => updateItem(it._key, { unit: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[12.5px] text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" /></td>
                    <td className="p-2"><input type="number" step="0.01" value={it.unit_cost == null ? '' : String(it.unit_cost)} onChange={e => updateItem(it._key, { unit_cost: e.target.value === '' ? null : Number(e.target.value) })} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-[12.5px] tabular-nums text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" /></td>
                    <td className="p-2"><input type="number" step="0.01" value={it.markup_percent == null ? '' : String(it.markup_percent)} onChange={e => { const pct = Number(e.target.value); updateItem(it._key, { markup_percent: e.target.value === '' ? null : pct }); if (e.target.value !== '' && it.unit_cost != null) applyMarkup(it._key, pct); }} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-[12.5px] tabular-nums text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" /></td>
                    <td className="p-2"><input type="number" step="0.01" value={String(it.unit_price ?? 0)} onChange={e => updateItem(it._key, { unit_price: Number(e.target.value) })} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-[12.5px] tabular-nums text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" /></td>
                    <td className="p-2 text-right font-medium">{money(Number(it.quantity || 0) * Number(it.unit_price || 0))}</td>
                    <td className="p-2"><button onClick={() => setItems(prev => prev.filter(x => x._key !== it._key))} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-72 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Materiais</span><span>{money(totalMaterial)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Serviços</span><span>{money(totalService)}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Desconto</span><span>- {money(discount)}</span></div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold"><span>Total</span><span>{money(total)}</span></div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const statusFilters = [
    { value: 'all', label: 'Todos' },
    { value: 'aberto', label: 'Em aberto' },
    { value: 'aprovado', label: 'Aprovados' },
    { value: 'concluido', label: 'Concluídos' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Comercial"
        title="Orçamentos & OS"
        subtitle="Propostas, ordens de serviço e acompanhamento de cada etapa."
        action={<Button onClick={openNew}><Plus size={18} /> Novo orçamento</Button>}
      />
      {error && <ErrorBox message={error} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-24px_rgba(15,23,42,0.25)]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Em aberto</div>
              <div className="mt-1 text-[22px] font-semibold tabular-nums text-slate-900">{money(totalOpen)}</div>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900/5 text-slate-600">
              <FileText size={17} />
            </div>
          </div>
          <div className="mt-1.5 text-[11.5px] text-slate-500">{openOrders.length} propostas aguardando</div>
        </div>
        <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-teal-50/60 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-24px_rgba(15,23,42,0.25)]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-emerald-700/70">Aprovado</div>
              <div className="mt-1 text-[22px] font-semibold tabular-nums text-emerald-800">{money(totalApproved)}</div>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100/80 text-emerald-700">
              <CheckCircle2 size={17} />
            </div>
          </div>
          <div className="mt-1.5 text-[11.5px] text-emerald-700/70">{approvedOrders.length} ordens confirmadas</div>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d3260] via-[#0b2b52] to-[#071b33] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-24px_rgba(15,23,42,0.45)]">
          <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-emerald-500/20 blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-blue-200/60">Carteira total</div>
              <div className="mt-1 text-[22px] font-semibold tabular-nums text-white">{money(totalAll)}</div>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-emerald-300">
              <Wallet size={17} />
            </div>
          </div>
          <div className="relative mt-1.5 text-[11.5px] text-blue-200/50">{orders.length} documentos emitidos</div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por cliente, número ou título…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-[13px] text-slate-700 transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {statusFilters.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
                  statusFilter === f.value
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                <th className="px-4 py-3 text-left font-semibold">Nº</th>
                <th className="px-2 py-3 text-left font-semibold">Cliente</th>
                <th className="px-2 py-3 text-left font-semibold">Objetivo</th>
                <th className="px-2 py-3 text-left font-semibold">Orçamento</th>
                <th className="px-2 py-3 text-left font-semibold">Serviço</th>
                <th className="px-2 py-3 text-left font-semibold">Data</th>
                <th className="px-4 py-3 text-right font-semibold">Valor</th>
                <th className="w-28 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8}><Empty message="Carregando orçamentos…" /></td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center gap-3 p-12 text-center">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <Plus size={22} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-700">
                          {orders.length === 0 ? 'Nenhum orçamento ainda' : 'Nenhum resultado para esse filtro'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {orders.length === 0
                            ? 'Crie a primeira proposta ou ordem de serviço.'
                            : 'Ajuste a busca ou selecione outro status.'}
                        </div>
                      </div>
                      {orders.length === 0 && <Button onClick={openNew}><Plus size={16} /> Novo orçamento</Button>}
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.map(o => {
                const client = clients.find(c => c.id === o.client_id);
                const clientName = client?.trade_name || client?.company_name || '—';
                return (
                  <tr key={o.id} className="group border-b border-slate-100 transition-colors last:border-0 hover:bg-emerald-50/40">
                    <td className="px-4 py-3.5 text-[12px] font-medium tabular-nums text-slate-400">
                      #{String(o.number ?? '—').padStart(2, '0')}
                    </td>
                    <td className="px-2 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={clientName} size="sm" />
                        <div className="min-w-0">
                          <div className="max-w-[190px] truncate text-[13px] font-medium text-slate-800">{clientName}</div>
                          <div className="text-[11px] text-slate-400">{client?.cnpj || 'CNPJ não informado'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[260px] px-2 py-3.5">
                      <div className="truncate text-[13px] text-slate-600">{o.title || '—'}</div>
                      {o.scope && <div className="truncate text-[11px] text-slate-400">{o.scope}</div>}
                    </td>
                    <td className="px-2 py-3.5">
                      <Badge tone={quoteTones[o.quote_status]} dot>{quoteLabels[o.quote_status]}</Badge>
                    </td>
                    <td className="px-2 py-3.5">
                      <Badge tone={serviceTones[o.service_status]}>{serviceLabels[o.service_status]}</Badge>
                    </td>
                    <td className="px-2 py-3.5 text-[12px] tabular-nums text-slate-500">
                      {o.issue_date ? new Date(o.issue_date + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-right text-[13px] font-semibold tabular-nums text-slate-900">
                      {totals[o.id] ? money(totals[o.id]) : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                        <Link to={`/ordens/${o.id}/imprimir`} target="_blank" className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-900 hover:shadow-sm" title="Imprimir">
                          <Printer size={16} />
                        </Link>
                        <button onClick={() => openEdit(o)} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-900 hover:shadow-sm" title="Editar">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => removeOrder(o)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600" title="Excluir">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export { quoteLabels, serviceLabels };
