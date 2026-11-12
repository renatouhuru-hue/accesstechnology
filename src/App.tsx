import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, FileText, CalendarDays, Receipt, Wallet, Settings, Bot, Menu
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

const nav = [
  { to: '/', label: 'Painel', icon: LayoutDashboard },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/catalogo', label: 'Catálogo', icon: Package },
  { to: '/ordens', label: 'Orçamentos/OS', icon: FileText },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/recibos', label: 'Recibos', icon: Receipt },
  { to: '/financeiro', label: 'Financeiro', icon: Wallet },
  { to: '/assistente', label: 'Assistente IA', icon: Bot },
  { to: '/config', label: 'Configurações', icon: Settings },
];

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

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-900">
      <aside className={`fixed lg:static z-20 inset-y-0 left-0 w-64 bg-slate-900 text-slate-100 flex flex-col transform transition-transform ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Accesstechnology</div>
            <div className="text-xs text-slate-400">Ordens de Serviço</div>
          </div>
          <button className="lg:hidden text-slate-400" onClick={() => setOpen(false)}>✕</button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  isActive ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {open && <div className="fixed inset-0 bg-black/30 z-10 lg:hidden" onClick={() => setOpen(false)} />}

      <main className="flex-1 min-w-0">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b">
          <button onClick={() => setOpen(true)}><Menu size={22} /></button>
          <span className="font-semibold">Accesstechnology</span>
        </div>
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
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
  );
}
