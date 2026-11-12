import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Save, X, Printer } from 'lucide-react';
import type { Client, Order, Receipt } from '../types';
import { listRows, insertRow, deleteRow } from '../lib/db';
import { isSupabaseConfigured } from '../lib/supabase';
import { Card, PageHeader, Button, Field, TextArea, Select, Empty, ErrorBox, money } from '../components/ui';

export default function ReceiptsPage() {
  const [items, setItems] = useState<Receipt[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Receipt> | null>(null);

  const load = async () => {
    try {
      setLoading(true); setError(null);
      const [r, c, o] = await Promise.all([
        listRows<Receipt>('receipts', 'created_at', false),
        listRows<Client>('clients', 'company_name', true),
        listRows<Order>('orders', 'created_at', false),
      ]);
      setItems(r); setClients(c); setOrders(o);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar recibos');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing({
      order_id: '', client_id: '', amount: 0, description: '',
      payment_method: 'PIX', issue_date: new Date().toISOString().slice(0, 10), notes: '',
    });
  };

  const pickOrder = (orderId: string) => {
    const o = orders.find(x => x.id === orderId);
    setEditing(prev => prev ? {
      ...prev,
      order_id: orderId,
      client_id: o?.client_id || prev.client_id || '',
      description: o ? (o.title || `Orçamento #${o.number ?? ''}`) : prev.description,
    } : prev);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.client_id) return alert('Selecione o cliente');
    try {
      const payload: any = {
        order_id: editing.order_id || null,
        client_id: editing.client_id,
        issue_date: editing.issue_date || null,
        amount: Number(editing.amount || 0),
        description: editing.description || null,
        payment_method: editing.payment_method || null,
        notes: editing.notes || null,
      };
      await insertRow('receipts', payload);
      setEditing(null);
      await load();
    } catch (e: any) { alert(e?.message || 'Erro ao salvar recibo'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir este recibo?')) return;
    try { await deleteRow('receipts', id); await load(); } catch (e: any) { alert(e?.message || 'Erro ao excluir'); }
  };

  if (!isSupabaseConfigured) return <ErrorBox message="Supabase não configurado." />;

  return (
    <div className="space-y-4">
      <PageHeader title="Recibos" subtitle="Recibos de serviços e materiais." action={<Button onClick={openNew}><Plus size={18} /> Novo recibo</Button>} />
      {error && <ErrorBox message={error} />}

      {editing && (
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select label="Orçamento/OS (opcional)" value={editing.order_id || ''} onChange={pickOrder} options={[{ value: '', label: '—' }, ...orders.map(o => ({ value: o.id, label: `#${o.number ?? '-'} — ${o.title || ''}` }))]} />
            <Select label="Cliente" value={editing.client_id || ''} onChange={v => setEditing({ ...editing, client_id: v })} options={[{ value: '', label: 'Selecione…' }, ...clients.map(c => ({ value: c.id, label: c.trade_name || c.company_name }))]} />
            <Field label="Valor (R$)" type="number" step="0.01" min="0" value={String(editing.amount ?? 0)} onChange={v => setEditing({ ...editing, amount: Number(v) })} />
            <Field label="Data" type="date" value={editing.issue_date || ''} onChange={v => setEditing({ ...editing, issue_date: v })} />
            <Select label="Forma de pagamento" value={editing.payment_method || 'PIX'} onChange={v => setEditing({ ...editing, payment_method: v })} options={['PIX', 'Dinheiro', 'Transferência', 'Cartão', 'Boleto'].map(v2 => ({ value: v2, label: v2 }))} />
            <Field label="Descrição" value={editing.description || ''} onChange={v => setEditing({ ...editing, description: v })} />
            <TextArea label="Observações" value={editing.notes || ''} onChange={v => setEditing({ ...editing, notes: v })} rows={2} className="md:col-span-2" />
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
            <tr><th className="text-left p-3">#</th><th className="text-left p-3">Cliente</th><th className="text-left p-3">Descrição</th><th className="text-left p-3">Data</th><th className="text-right p-3">Valor</th><th className="p-3 w-24"></th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6}><Empty message="Carregando…" /></td></tr> : items.length === 0 ? <tr><td colSpan={6}><Empty message="Nenhum recibo emitido." /></td></tr> : items.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-3 text-slate-500">{r.number ?? '—'}</td>
                <td className="p-3 font-medium">{clients.find(c => c.id === r.client_id)?.trade_name || clients.find(c => c.id === r.client_id)?.company_name || '—'}</td>
                <td className="p-3">{r.description || '—'}</td>
                <td className="p-3 text-slate-500">{r.issue_date ? new Date(r.issue_date + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                <td className="p-3 text-right font-medium">{money(Number(r.amount))}</td>
                <td className="p-3"><div className="flex gap-1 justify-end">
                  <Link to={`/recibos/${r.id}/imprimir`} target="_blank" className="p-1.5 rounded hover:bg-slate-100"><Printer size={16} /></Link>
                  <button onClick={() => remove(r.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 size={16} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
