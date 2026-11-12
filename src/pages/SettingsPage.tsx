import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import type { CompanySettings } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Card, PageHeader, Button, Field, TextArea, ErrorBox } from '../components/ui';

const empty: CompanySettings = {
  id: 1,
  trade_name: '',
  company_name: '',
  cnpj: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  phone: '',
  email: '',
  bank_info: '',
  logo_url: '',
  default_quote_validity_days: 15,
};

export default function SettingsPage() {
  const [data, setData] = useState<CompanySettings>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (!supabase) return;
        const { data: row, error } = await supabase.from('company_settings').select('*').eq('id', 1).maybeSingle();
        if (error) throw error;
        if (row) setData({ ...empty, ...row });
      } catch (e: any) {
        setError(e?.message || 'Erro ao carregar configurações');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    try {
      setError(null);
      setSaved(false);
      if (!supabase) throw new Error('Supabase não configurado');
      const payload: any = { ...data, id: 1, default_quote_validity_days: Number(data.default_quote_validity_days || 15) };
      const { error } = await supabase.from('company_settings').upsert(payload, { onConflict: 'id' });
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e?.message || 'Erro ao salvar');
    }
  };

  if (!isSupabaseConfigured) return <ErrorBox message="Supabase não configurado." />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Configurações"
        eyebrow="Sistema"
        subtitle="Dados que aparecem no orçamento, OS e recibo."
        action={<Button onClick={save}><Save size={16} /> Salvar</Button>}
      />
      {error && <ErrorBox message={error} />}
      {saved && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg text-sm">Configurações salvas.</div>}

      {loading ? (
        <Card className="p-4 text-slate-500">Carregando…</Card>
      ) : (
        <Card className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Nome fantasia" value={data.trade_name || ''} onChange={v => setData({ ...data, trade_name: v })} />
          <Field label="Razão social" value={data.company_name || ''} onChange={v => setData({ ...data, company_name: v })} />
          <Field label="CNPJ" value={data.cnpj || ''} onChange={v => setData({ ...data, cnpj: v })} />
          <Field label="Telefone" value={data.phone || ''} onChange={v => setData({ ...data, phone: v })} />
          <Field label="E-mail" value={data.email || ''} onChange={v => setData({ ...data, email: v })} />
          <Field label="Validade padrão (dias)" type="number" value={String(data.default_quote_validity_days ?? 15)} onChange={v => setData({ ...data, default_quote_validity_days: Number(v) })} />
          <Field label="Endereço" value={data.address || ''} onChange={v => setData({ ...data, address: v })} className="md:col-span-2" />
          <Field label="Cidade" value={data.city || ''} onChange={v => setData({ ...data, city: v })} />
          <Field label="UF" value={data.state || ''} onChange={v => setData({ ...data, state: v })} />
          <Field label="CEP" value={data.zip || ''} onChange={v => setData({ ...data, zip: v })} />
          <Field label="Logo (URL)" value={data.logo_url || ''} onChange={v => setData({ ...data, logo_url: v })} />
          <TextArea label="Dados bancários / PIX" value={data.bank_info || ''} onChange={v => setData({ ...data, bank_info: v })} className="md:col-span-2" rows={2} />
        </Card>
      )}
    </div>
  );
}
