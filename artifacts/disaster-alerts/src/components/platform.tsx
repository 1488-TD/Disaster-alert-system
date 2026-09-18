import { Link, useLocation } from 'wouter';
import { AlertTriangle, BellRing, Check, ChevronRight, CircleHelp, Clock3, CloudRain, Flame, Gauge, Globe2, House, Info, LayoutDashboard, LifeBuoy, MapPin, Megaphone, Radio, RefreshCw, Send, Settings2, ShieldCheck, Siren, Waves, Wind, X } from 'lucide-react';
import type { Alert, AlertSeverity, AlertType, ChannelDelivery } from '@workspace/api-client-react';
import { useHealthCheck } from '@workspace/api-client-react';
import { useState } from 'react';

export const typeMeta: Record<AlertType, { label: string; icon: typeof Waves }> = {
  flood: { label: 'Flood', icon: Waves },
  cyclone: { label: 'Cyclone', icon: Wind },
  earthquake: { label: 'Earthquake', icon: Gauge },
  wildfire: { label: 'Wildfire', icon: Flame },
  heatwave: { label: 'Heatwave', icon: CloudRain },
  other: { label: 'Public safety', icon: AlertTriangle },
};

export const severityMeta: Record<AlertSeverity, { label: string; className: string; dot: string }> = {
  critical: { label: 'Critical', className: 'bg-[hsl(7_64%_48%)] text-white', dot: 'bg-[hsl(7_64%_48%)]' },
  warning: { label: 'Warning', className: 'bg-[hsl(38_85%_55%)] text-[hsl(205_34%_16%)]', dot: 'bg-[hsl(38_85%_55%)]' },
  advisory: { label: 'Advisory', className: 'bg-[hsl(186_52%_31%)] text-white', dot: 'bg-[hsl(186_52%_31%)]' },
};

export const channelLabels: Record<string, string> = { sms: 'SMS', push: 'Push', web: 'Web', siren: 'Siren', radio: 'Radio' };
export const timeAgo = (value?: string | null) => {
  if (!value) return '—';
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};
export const dateLabel = (value?: string | null) => value ? new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Not published';
export const compactNumber = (value = 0) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

export function AlertBadge({ severity, status }: { severity: AlertSeverity; status?: string }) {
  const meta = severityMeta[severity];
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-[.08em] ${meta.className}`} data-testid={`status-${status ?? severity}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${status === 'active' ? 'pulse-dot bg-current' : meta.dot}`} />
    {status === 'active' ? 'Live' : meta.label}
  </span>;
}

export function ChannelPills({ channels }: { channels: string[] }) {
  return <div className="flex flex-wrap gap-1.5">{channels.map((channel) => <span key={channel} className="rounded-md bg-secondary px-2 py-1 text-[10px] font-bold text-muted-foreground">{channelLabels[channel] ?? channel}</span>)}</div>;
}

export function AlertTypeIcon({ type, size = 17 }: { type: AlertType; size?: number }) {
  const Icon = typeMeta[type]?.icon ?? AlertTriangle;
  return <Icon size={size} strokeWidth={1.8} />;
}

function Mark({ active }: { active: boolean }) {
  return <div className={`relative flex h-9 w-9 items-center justify-center rounded-xl ${active ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground'}`}><ShieldCheck size={21} strokeWidth={2.2} /><span className="absolute -right-1 -top-1 h-2 w-2 rounded-full border-2 border-background bg-accent" /></div>;
}

export function AppShell({ children, authority = false }: { children: React.ReactNode; authority?: boolean }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const health = useHealthCheck({ query: { queryKey: ['/api/healthz'], refetchInterval: 30000 } });
  const links = authority ? [
    { href: '/console', label: 'Operations desk', icon: LayoutDashboard },
    { href: '/console/alerts/new', label: 'Publish alert', icon: Megaphone },
  ] : [{ href: '/', label: 'Active alerts', icon: Globe2 }];
  return <div className="noise min-h-[100dvh] bg-background">
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-5 lg:px-8">
        <div className="flex items-center gap-3">
          {authority && <button className="btn btn-ghost p-2 lg:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle navigation" data-testid="button-toggle-navigation"><Settings2 size={17} /></button>}
          <Link href="/" className="flex items-center gap-3" data-testid="link-public-home"><Mark active={location === '/'} /><span className="hidden text-[13px] font-extrabold tracking-tight sm:block">CIVIC<span className="text-accent">SIGNAL</span></span></Link>
          <span className="hidden h-5 w-px bg-border sm:block" />
          <span className="hidden font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground md:block">{authority ? 'Authority network' : 'Verified public information'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-[10px] font-bold text-muted-foreground sm:flex" data-testid="status-system-health">
            <span className={`h-1.5 w-1.5 rounded-full ${health.isError ? 'bg-accent' : 'bg-[hsl(150_48%_43%)]'} pulse-dot`} />
            {health.isError ? 'Checking network' : 'Network nominal'}
          </div>
          {authority ? <Link href="/" className="btn btn-ghost" data-testid="link-public-view"><Globe2 size={15} /> Public view</Link> : <Link href="/console" className="btn btn-primary" data-testid="link-authority-console"><Siren size={15} /> Coordinator console</Link>}
        </div>
      </div>
    </header>
    {authority && <aside className={`${mobileOpen ? 'flex' : 'hidden'} fixed inset-x-0 top-[68px] z-20 flex-col border-b border-border bg-card p-3 shadow-lg lg:sticky lg:top-[68px] lg:flex lg:h-[calc(100dvh-68px)] lg:w-[238px] lg:shrink-0 lg:border-0 lg:border-r lg:bg-background lg:p-5 lg:shadow-none`}>
      <div className="mb-8 hidden px-3 lg:block"><p className="eyebrow mb-2">Live workspace</p><p className="text-sm font-bold">North Coast<br />coordination cell</p></div>
      <nav className="flex gap-2 lg:flex-col" aria-label="Authority navigation">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-bold transition-colors ${location === href ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={16} />{label}</Link>)}</nav>
      <div className="mt-auto hidden rounded-xl border border-border bg-card p-4 lg:block"><div className="mb-2 flex items-center gap-2 text-xs font-bold"><Radio size={14} className="text-primary" /> Broadcast fabric</div><p className="font-mono text-[10px] leading-relaxed text-muted-foreground">All outbound channels are monitored continuously.</p><div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-[hsl(150_48%_43%)]"><Check size={13} /> 5 of 5 channels healthy</div></div>
    </aside>}
    <main className={authority ? 'lg:ml-[238px]' : ''}>{children}</main>
  </div>;
}

export function LoadingBlock({ label = 'Synchronizing live data' }: { label?: string }) {
  return <div className="card-surface flex min-h-[180px] items-center justify-center rounded-xl" data-testid="state-loading"><div className="flex items-center gap-3 text-xs font-bold text-muted-foreground"><span className="h-2 w-2 rounded-full bg-primary pulse-dot" />{label}</div></div>;
}
export function ErrorBlock({ onRetry }: { onRetry?: () => void }) {
  return <div className="card-surface flex min-h-[180px] flex-col items-center justify-center rounded-xl p-6 text-center" data-testid="state-error"><div className="mb-3 rounded-full bg-accent/15 p-3 text-accent"><LifeBuoy size={20} /></div><p className="font-bold">Signal interrupted</p><p className="mt-1 text-xs text-muted-foreground">We could not reach the alert network.</p>{onRetry && <button className="btn btn-ghost mt-4" onClick={onRetry} data-testid="button-retry"><RefreshCw size={14} /> Try again</button>}</div>;
}
export function EmptyBlock({ title, body }: { title: string; body: string }) {
  return <div className="card-surface flex min-h-[220px] flex-col items-center justify-center rounded-xl p-6 text-center" data-testid="state-empty"><div className="mb-3 rounded-full bg-secondary p-3 text-primary"><BellRing size={20} /></div><p className="font-bold">{title}</p><p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">{body}</p></div>;
}

export function SectionHeading({ eyebrow, title, detail, action }: { eyebrow?: string; title: string; detail?: string; action?: React.ReactNode }) {
  return <div className="mb-6 flex items-end justify-between gap-4"><div>{eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}<h1 className="display-type text-2xl font-extrabold sm:text-3xl">{title}</h1>{detail && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{detail}</p>}</div>{action}</div>;
}

export function ProgressBar({ delivered, total, status }: Pick<ChannelDelivery, 'delivered' | 'total' | 'status'>) {
  const percentage = total ? Math.min(100, Math.round((delivered / total) * 100)) : 0;
  return <div className="min-w-[100px]"><div className="mb-1 flex justify-between font-mono text-[10px] text-muted-foreground"><span>{percentage}%</span><span>{status}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${percentage}%` }} /></div></div>;
}

export function PublicAlertCard({ alert, onOpen }: { alert: Alert; onOpen: () => void }) {
  const meta = typeMeta[alert.type];
  return <button onClick={onOpen} className="group card-surface block w-full rounded-xl p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-lg" data-testid={`card-alert-${alert.id}`}>
    <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-2 text-xs font-bold text-muted-foreground"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary"><AlertTypeIcon type={alert.type} /></span>{meta.label}<span className="text-border">/</span><MapPin size={13} />{alert.location}</div><AlertBadge severity={alert.severity} status={alert.status} /></div>
    <h3 className="mt-5 text-lg font-extrabold tracking-tight group-hover:text-primary">{alert.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{alert.message}</p>
    <div className="mt-5 flex items-center justify-between border-t border-border/70 pt-4"><span className="font-mono text-[10px] uppercase tracking-[.08em] text-muted-foreground">Updated {timeAgo(alert.publishedAt ?? alert.createdAt)}</span><span className="flex items-center gap-1 text-[11px] font-extrabold text-primary">Response guidance <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" /></span></div>
  </button>;
}

export function DetailPanel({ alert, onClose }: { alert: Alert; onClose: () => void }) {
  return <div className="card-surface rise-in rounded-xl p-5 sm:p-7" data-testid={`panel-alert-detail-${alert.id}`}><div className="flex items-start justify-between gap-4"><div><div className="mb-3 flex flex-wrap items-center gap-2"><AlertBadge severity={alert.severity} status={alert.status} /><span className="font-mono text-[10px] text-muted-foreground">{alert.id}</span></div><h2 className="display-type text-2xl font-extrabold">{alert.title}</h2><p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin size={13} /> {alert.location} · issued by {alert.source}</p></div><button className="btn btn-ghost p-2" onClick={onClose} aria-label="Close alert details" data-testid="button-close-alert-detail"><X size={16} /></button></div><p className="mt-7 text-sm leading-7 text-foreground/85">{alert.message}</p><div className="mt-7 grid gap-6 border-t border-border pt-6 sm:grid-cols-2"><div><p className="eyebrow mb-3">Affected areas</p><div className="space-y-2">{alert.affectedAreas.map((area) => <div key={area} className="flex items-center gap-2 text-sm"><span className="h-1.5 w-1.5 rounded-full bg-accent" />{area}</div>)}</div></div><div><p className="eyebrow mb-3">What to do now</p><div className="space-y-3">{alert.instructions.map((instruction, index) => <div key={instruction} className="flex gap-3 text-sm leading-relaxed"><span className="font-mono text-[10px] text-primary">0{index + 1}</span><span>{instruction}</span></div>)}</div></div></div><div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.08em] text-muted-foreground">Verified distribution</p><ChannelPills channels={alert.channels} /></div><p className="font-mono text-[10px] text-muted-foreground">Expires {dateLabel(alert.expiresAt)}</p></div></div>;
}