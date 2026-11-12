import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, FileText, CalendarDays, Receipt, Wallet, Settings, Bot, Menu, Search, X,
} from 'lucide-react';
import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import ClientsPage from './pages/ClientsPage';
import CatalogPage from './pages/CatalogPage';
import OrdersPage from './pages/OrdersPage';
import OrderPrintPage from './pages/OrderPrintPage';
import CalendarPage from './pages/CalendarPage';
import ReceiptsPage from './pages/ReceiptsPage';
import FinancePage from './pages/FinancePage';
import SettingsPage from './pages/SettingsPage';
import AssistantPage from './pages/AssistantPage';
import ReceiptPrintPage from './pages/ReceiptPrintPage';

const navGroups = [
  {
    label: 'Operação',
    items: [
      { to: '/', label: 'Painel', icon: LayoutDashboard },
      { to: '/clientes', label: 'Clientes', icon: Users },
      { to: '/catalogo', label: 'Catálogo', icon: Package },
      { to: '/ordens', label: 'Orçamentos / OS', icon: FileText },
      { to: '/agenda', label: 'Agenda', icon: CalendarDays },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { to: '/recibos', label: 'Recibos', icon: Receipt },
      { to: '/financeiro', label: 'Financeiro', icon: Wallet },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/assistente', label: 'Assistente IA', icon: Bot, tag: 'IA' },
      { to: '/config', label: 'Configurações', icon: Settings },
    ],
  },
];

const pageTitles: Record<string, string> = {
  '/': 'Painel',
  '/clientes': 'Clientes',
  '/catalogo': 'Catálogo',
  '/ordens': 'Orçamentos / OS',
  '/agenda': 'Agenda',
  '/recibos': 'Recibos',
  '/financeiro': 'Financeiro',
  '/assistente': 'Assistente IA',
  '/config': 'Configurações',
};

function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dim = size === 'md' ? 'h-10 w-10 text-[15px]' : 'h-9 w-9 text-[13px]';
  return (
    <div
      className={`grid ${dim} shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 font-extrabold tracking-tight text-white shadow-lg shadow-emerald-900/30`}
    >
      AT
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (/^\/ordens\/[^/]+\/imprimir$/.test(location.pathname) || /^\/recibos\/[^/]+\/imprimir$/.test(location.pathname)) {
    return (
      <Routes>
        <Route path="/ordens/:id/imprimir" element={<OrderPrintPage />} />
        <Route path="/recibos/:id/imprimir" element={<ReceiptPrintPage />} />
      </Routes>
    );
  }

  const currentTitle = pageTitles[location.pathname] ?? 'Painel';
  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900">
      <div className="flex">
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex h-screen w-[272px] flex-col bg-gradient-to-b from-[#0d3260] via-[#0a2547] to-[#071a30] text-slate-100 shadow-2xl shadow-blue-950/30 transition-transform lg:sticky lg:top-0 lg:z-30 lg:translate-x-0 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center gap-3 px-5 pb-5 pt-6">
            <BrandMark />
            <div className="min-w-0">
              <div className="truncate text-[15px] font-semibold tracking-tight">Accesstechnology</div>
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-400/80">
                Orçamentos &amp; OS
              </div>
            </div>
            <button className="ml-auto text-blue-200/60 hover:text-white lg:hidden" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
            {navGroups.map(group => (
              <div key={group.label}>
                <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-200/40">
                  {group.label}
                </div>
                <div className="space-y-1">
                  {group.items.map(({ to, label, icon: Icon, tag }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={to === '/'}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                          isActive
                            ? 'bg-gradient-to-r from-emerald-400/15 via-emerald-400/5 to-transparent text-white before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-r-full before:bg-emerald-400'
                            : 'text-blue-100/60 hover:bg-white/5 hover:text-slate-100'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon size={18} className={isActive ? 'text-emerald-300' : 'text-blue-200/40 group-hover:text-blue-100'} />
                          <span className="flex-1">{label}</span>
                          {tag && (
                            <span className="rounded-md bg-emerald-400/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-emerald-300">
                              {tag}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-white/5 p-4">
            <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] px-3 py-2.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <div className="min-w-0 leading-tight">
                <div className="text-[11px] font-medium text-slate-200">Dados sincronizados</div>
                <div className="text-[10px] text-blue-200/50">Supabase · nuvem</div>
              </div>
            </div>
            <div className="mt-3 px-1 text-[10px] text-blue-200/30">Accesstechnology · v1.0</div>
          </div>
        </aside>

        {open && <div className="fixed inset-0 z-30 bg-blue-950/50 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}

        <main className="min-w-0 flex-1 surface-grid">
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-[1400px] items-center gap-3 px-4 py-3 lg:px-8">
              <button className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)}>
                <Menu size={20} />
              </button>
              <div className="hidden items-center gap-2 text-[13px] text-slate-400 sm:flex">
                <span>Accesstechnology</span>
                <span className="text-slate-300">/</span>
                <span className="font-medium text-slate-700">{currentTitle}</span>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <div className="relative hidden xl:block">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    disabled
                    placeholder="Busca rápida em breve"
                    className="w-56 cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-3 text-[12.5px] text-slate-400"
                  />
                </div>
                <div className="hidden text-right text-[11px] leading-tight text-slate-500 md:block">
                  <div className="font-medium text-slate-600">Hoje</div>
                  <div className="capitalize">{today}</div>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 shadow-sm">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[#0c2d57] text-[10px] font-bold text-white">
                    RA
                  </span>
                  <span className="hidden text-[12px] font-medium text-slate-700 sm:block">Renato</span>
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-8 lg:py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/clientes" element={<ClientsPage />} />
              <Route path="/catalogo" element={<CatalogPage />} />
              <Route path="/ordens" element={<OrdersPage />} />
              <Route path="/agenda" element={<CalendarPage />} />
              <Route path="/recibos" element={<ReceiptsPage />} />
              <Route path="/financeiro" element={<FinancePage />} />
              <Route path="/assistente" element={<AssistantPage />} />
              <Route path="/config" element={<SettingsPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
