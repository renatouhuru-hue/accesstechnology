import { useEffect, useState } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import type { Order, Payment } from '../types';
import { listRows, insertRow, updateRow, deleteRow } from '../lib/db';
import { isSupabaseConfigured } from '../lib/supabase';
import { Card, PageHeader, Button, Field, Select, Empty, ErrorBox, money } from '../components/ui';

const statusLabels: Record<string, string> = { pendente: 'Pendente', pago: 'Pago', cancelado: 'Cancelado' };
const statusColors: Record<string, string> = {
  pendente: 'bg-amber-50 text-amber-700',
  pago: 'bg-emerald-50 text-emerald-700',
  cancelado: 'bg-slate-200 text-slate-500',
};

export default function FinancePage() {
  const [items, setItems] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Payment> | null>(null);

  const load = async () => {
    try {
      setLoading(true); setError(null);
      const [p, o] = await Promise.all([
        listRows<Payment>('payments', 'created_at', false),
        listRows<Order>('orders', 'created_at', false),
      ]);
      setItems(p); setOrders(o);
    } catch (e: any) { setError(e?.message || 'Erro ao carregar financeiro'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    try {
      const payload: any = {
        order_id: editing.order_id || null,
        kind: editing.kind || 'receita',
        description: editing.description || null,
        amount: Number(editing.amount || 0),
        due_date: editing.due_date || null,
        paid_at: editing.paid_at || null,
        status: editing.status || 'pendente',
        method: editing.method || null,
      };
      if (editing.id) await updateRow('payments', editing.id, payload);
      else await insertRow('payments', payload);
      setEditing(null);
      await load();
    } catch (e: any) { alert(e?.message || 'Erro ao salvar'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir este lançamento?')) return;
    try { await deleteRow('payments', id); await load(); } catch (e: any) { alert(e?.message || 'Erro ao excluir'); }
  };

  if (!isSupabaseConfigured) return <ErrorBox message="Supabase não configurado." />;

  const receitas = items.filter(i => i.kind === 'receita' && i.status !== 'cancelado');
  const despesas = items.filter(i => i.kind === 'despesa' && i.status !== 'cancelado');
  const totalReceitas = receitas.reduce((s, i) => s + Number(i.amount), 0);
  const totalDespesas = despesas.reduce((s, i) => s + Number(i.amount), 0);
  const totalPago = items.filter(i => i.status === 'pago' && i.kind === 'receita').reduce((s, i) => s + Number(i.amount), 0);
  const totalPendente = items.filter(i => i.status === 'pendente' && i.kind === 'receita').reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="space-y-4">
      <PageHeader title="Financeiro" eyebrow="Financeiro" subtitle="Receitas, despesas e recebimentos." action={<Button onClick={() => setEditing({ kind: 'receita', amount: 0, status: 'pendente', description: '', due_date: new Date().toISOString().slice(0, 10) })}><Plus size={18} /> Novo lançamento</Button>} />
      {error && <ErrorBox message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="p-4"><div className="text-xs text-slate-500">Receitas</div><div className="text-xl font-semibold text-emerald-700">{money(totalReceitas)}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500">Despesas</div><div className="text-xl font-semibold text-red-600">{money(totalDespesas)}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500">Recebido</div><div className="text-xl font-semibold">{money(totalPago)}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500">A receber</div><div className="text-xl font-semibold text-amber-700">{money(totalPendente)}</div></Card>
      </div>

      {editing && (
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select label="Tipo" value={editing.kind || 'receita'} onChange={v => setEditing({ ...editing, kind: v as any })} options={[{ value: 'receita', label: 'Receita' }, { value: 'despesa', label: 'Despesa' }]} />
            <Field label="Valor (R$)" type="number" step="0.01" value={String(editing.amount ?? 0)} onChange={v => setEditing({ ...editing, amount: Number(v) })} />
            <Select label="Status" value={editing.status || 'pendente'} onChange={v => setEditing({ ...editing, status: v as any })} options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))} />
            <Field label="Descrição" value={editing.description || ''} onChange={v => setEditing({ ...editing, description: v })} className="md:col-span-2" />
            <Select label="Orçamento/OS" value={editing.order_id || ''} onChange={v => setEditing({ ...editing, order_id: v })} options={[{ value: '', label: '—' }, ...orders.map(o => ({ value: o.id, label: `#${o.number ?? '-'} — ${o.title || ''}` }))]} />
            <Field label="Vencimento" type="date" value={editing.due_date || ''} onChange={v => setEditing({ ...editing, due_date: v })} />
            <Field label="Pago em" type="date" value={editing.paid_at || ''} onChange={v => setEditing({ ...editing, paid_at: v })} />
            <Field label="Forma" value={editing.method || ''} onChange={v => setEditing({ ...editing, method: v })} />
          </div>
          <div className="flex gap-2">
            <Button onClick={save}><Save size={16} /> Salvar</Button>
            <Button variant="secondary" onClick={() => setEditing(null)}><X size={16} /> Cancelar</Button>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr><th className="text-left p-3">Tipo</th><th className="text-left p-3">Descrição</th><th className="text-left p-3">Vencimento</th><th className="text-left p-3">Status</th><th className="text-right p-3">Valor</th><th className="p-3 w-20"></th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6}><Empty message="Carregando…" /></td></tr> : items.length === 0 ? <tr><td colSpan={6}><Empty message="Nenhum lançamento." /></td></tr> : items.map(p => (
              <tr key={p.id} className="border-t">
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${p.kind === 'receita' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{p.kind === 'receita' ? 'Receita' : 'Despesa'}</span></td>
                <td className="p-3">{p.description || '—'}</td>
                <td className="p-3 text-slate-500">{p.due_date ? new Date(p.due_date + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[p.status]}`}>{statusLabels[p.status]}</span></td>
                <td className="p-3 text-right font-medium">{money(Number(p.amount))}</td>
                <td className="p-3"><div className="flex gap-1 justify-end">
                  <button onClick={() => setEditing(p)} className="p-1.5 rounded hover:bg-slate-100 text-xs">Editar</button>
                  <button onClick={() => remove(p.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 size={16} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
