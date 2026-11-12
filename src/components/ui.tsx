import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-24px_rgba(15,23,42,0.25)] ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {eyebrow && (
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
            {eyebrow}
          </div>
        )}
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 gap-2">{action}</div>}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  className = '',
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  type?: 'button' | 'submit';
  className?: string;
  disabled?: boolean;
}) {
  const styles = {
    primary:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20',
    secondary:
      'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-600/20',
    ghost: 'hover:bg-slate-100 text-slate-600',
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  className = '',
  required,
  step,
  min,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  step?: string;
  min?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[13px] font-medium text-slate-600">
        {label}
        {required ? <span className="text-emerald-600"> *</span> : null}
      </span>
      <input
        type={type}
        value={value}
        step={step}
        min={min}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-slate-300/90 bg-white px-3.5 py-2.5 text-sm text-slate-800 transition placeholder:text-slate-400 hover:border-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
      />
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[13px] font-medium text-slate-600">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={e => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-slate-300/90 bg-white px-3.5 py-2.5 text-sm text-slate-800 transition placeholder:text-slate-400 hover:border-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
      />
    </label>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[13px] font-medium text-slate-600">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="select-arrow mt-1.5 w-full appearance-none rounded-xl border border-slate-300/90 bg-white px-3.5 py-2.5 pr-9 text-sm text-slate-800 transition hover:border-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Empty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-10 text-center">
      <div className="text-sm font-medium text-slate-600">{message}</div>
      <div className="text-xs text-slate-400">Os registros aparecerão aqui.</div>
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </div>
  );
}

const tones = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  red: 'bg-red-50 text-red-700 ring-red-100',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100',
} as const;

export type Tone = keyof typeof tones;

export function Badge({
  children,
  tone = 'slate',
  dot,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

export function initials(name?: string | null) {
  if (!name) return '—';
  const parts = name
    .replace(/[^\p{L}\p{N} ]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const avatarTones = [
  'bg-emerald-100 text-emerald-700',
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
];

export function Avatar({
  name,
  size = 'md',
  className = '',
}: {
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sz = {
    sm: 'h-8 w-8 text-[11px]',
    md: 'h-10 w-10 text-xs',
    lg: 'h-12 w-12 text-sm',
  }[size];
  const hash = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-semibold ${sz} ${avatarTones[hash % avatarTones.length]} ${className}`}
    >
      {initials(name)}
    </span>
  );
}

export function money(v: number | null | undefined) {
  return (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
