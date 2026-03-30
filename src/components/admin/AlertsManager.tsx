'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Info, Zap, CheckCheck, Plus, X, Bell } from 'lucide-react'
import { Alert, AlertSeverity, markAlertRead, markAllRead, createBroadcast } from '@/app/admin/alerts/actions'

type FilterTab = 'all' | 'unread' | 'critical' | 'warning' | 'info'

const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; color: string; border: string; bg: string; Icon: React.ElementType }> = {
    critical: {
        label: 'Critical',
        color: 'text-red-600',
        border: 'border-l-red-500',
        bg: 'bg-red-50',
        Icon: Zap,
    },
    warning: {
        label: 'Warning',
        color: 'text-amber-600',
        border: 'border-l-amber-400',
        bg: 'bg-amber-50',
        Icon: AlertTriangle,
    },
    info: {
        label: 'Info',
        color: 'text-blue-600',
        border: 'border-l-blue-400',
        bg: 'bg-blue-50',
        Icon: Info,
    },
}

function formatTime(ts: string) {
    return new Date(ts).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    })
}

interface BroadcastFormProps {
    onClose: () => void
    onSubmit: (title: string, message: string, severity: AlertSeverity) => void
    isPending: boolean
}

function BroadcastForm({ onClose, onSubmit, isPending }: BroadcastFormProps) {
    const [title, setTitle] = useState('')
    const [message, setMessage] = useState('')
    const [severity, setSeverity] = useState<AlertSeverity>('info')

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!title.trim() || !message.trim()) return
        onSubmit(title.trim(), message.trim(), severity)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-[var(--color-dark-slate)]">Create Broadcast Alert</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--color-app-bg)] transition-colors">
                        <X className="w-4 h-4 text-[var(--color-subtle-text)]" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-[var(--color-subtle-text)] uppercase tracking-wider mb-1.5">
                            Severity
                        </label>
                        <div className="flex gap-2">
                            {(['info', 'warning', 'critical'] as AlertSeverity[]).map(s => {
                                const cfg = SEVERITY_CONFIG[s]
                                return (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setSeverity(s)}
                                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border-2 transition-all ${
                                            severity === s
                                                ? `${cfg.bg} ${cfg.color} border-current`
                                                : 'border-[var(--color-border-mute)] text-[var(--color-subtle-text)] hover:border-gray-300'
                                        }`}
                                    >
                                        {cfg.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[var(--color-subtle-text)] uppercase tracking-wider mb-1.5">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Alert title"
                            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-mute)] bg-[var(--color-app-bg)] text-sm font-medium text-[var(--color-dark-slate)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-solid)]/30 focus:border-[var(--color-primary-solid)]"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[var(--color-subtle-text)] uppercase tracking-wider mb-1.5">
                            Message <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="Alert message body"
                            rows={4}
                            className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-mute)] bg-[var(--color-app-bg)] text-sm text-[var(--color-dark-slate)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-solid)]/30 focus:border-[var(--color-primary-solid)] resize-none"
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-[var(--color-border-mute)] text-sm font-bold text-[var(--color-subtle-text)] hover:bg-[var(--color-app-bg)] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || !title.trim() || !message.trim()}
                            className="flex-1 py-2.5 rounded-xl bg-[var(--color-primary-solid)] text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                        >
                            {isPending ? 'Sending…' : 'Send Broadcast'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

interface AlertsManagerProps {
    alerts: Alert[]
}

export default function AlertsManager({ alerts: initialAlerts }: AlertsManagerProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [activeTab, setActiveTab] = useState<FilterTab>('all')
    const [showBroadcast, setShowBroadcast] = useState(false)
    const [optimisticRead, setOptimisticRead] = useState<Set<string>>(new Set())
    const [allMarkedRead, setAllMarkedRead] = useState(false)

    const alerts = useMemo(() => {
        return initialAlerts.map(a => ({
            ...a,
            is_read: allMarkedRead ? true : (optimisticRead.has(a.id) ? true : a.is_read),
        }))
    }, [initialAlerts, optimisticRead, allMarkedRead])

    const unreadCount = alerts.filter(a => !a.is_read).length
    const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.is_read).length
    const warningCount = alerts.filter(a => a.severity === 'warning' && !a.is_read).length
    const infoCount = alerts.filter(a => a.severity === 'info' && !a.is_read).length

    const filtered = useMemo(() => {
        if (activeTab === 'unread') return alerts.filter(a => !a.is_read)
        if (activeTab === 'critical') return alerts.filter(a => a.severity === 'critical')
        if (activeTab === 'warning') return alerts.filter(a => a.severity === 'warning')
        if (activeTab === 'info') return alerts.filter(a => a.severity === 'info')
        return alerts
    }, [alerts, activeTab])

    function handleMarkRead(id: string) {
        if (optimisticRead.has(id) || allMarkedRead) return
        setOptimisticRead(prev => new Set(prev).add(id))
        startTransition(async () => {
            await markAlertRead(id)
            router.refresh()
        })
    }

    function handleMarkAllRead() {
        setAllMarkedRead(true)
        startTransition(async () => {
            await markAllRead()
            router.refresh()
        })
    }

    function handleBroadcast(title: string, message: string, severity: AlertSeverity) {
        startTransition(async () => {
            await createBroadcast(title, message, severity)
            setShowBroadcast(false)
            router.refresh()
        })
    }

    const tabs: { key: FilterTab; label: string; count?: number }[] = [
        { key: 'all', label: 'All', count: alerts.length },
        { key: 'unread', label: 'Unread', count: unreadCount },
        { key: 'critical', label: 'Critical', count: criticalCount },
        { key: 'warning', label: 'Warning', count: warningCount },
        { key: 'info', label: 'Info', count: infoCount },
    ]

    return (
        <div className="p-8 space-y-6">
            {showBroadcast && (
                <BroadcastForm
                    onClose={() => setShowBroadcast(false)}
                    onSubmit={handleBroadcast}
                    isPending={isPending}
                />
            )}

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-black text-[var(--color-dark-slate)] tracking-tight">Alerts</h1>
                    <p className="text-sm text-[var(--color-subtle-text)] mt-1">
                        System and broadcast alerts for admin roles
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            disabled={isPending}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-border-mute)] text-sm font-bold text-[var(--color-subtle-text)] hover:bg-[var(--color-app-bg)] transition-colors disabled:opacity-50"
                        >
                            <CheckCheck className="w-4 h-4" />
                            Mark all read
                        </button>
                    )}
                    <button
                        onClick={() => setShowBroadcast(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-primary-solid)] text-white text-sm font-bold hover:opacity-90 transition-opacity"
                    >
                        <Plus className="w-4 h-4" />
                        Create Broadcast
                    </button>
                </div>
            </div>

            {/* Summary bar */}
            <div className="grid grid-cols-3 gap-4">
                {(['critical', 'warning', 'info'] as AlertSeverity[]).map(s => {
                    const cfg = SEVERITY_CONFIG[s]
                    const count = s === 'critical' ? criticalCount : s === 'warning' ? warningCount : infoCount
                    const SevIcon = cfg.Icon
                    return (
                        <button
                            key={s}
                            onClick={() => setActiveTab(s)}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                                activeTab === s
                                    ? `${cfg.bg} border-current ${cfg.color}`
                                    : 'bg-[var(--color-card-bg)] border-[var(--color-border-mute)] hover:border-gray-300'
                            }`}
                        >
                            <div className={`p-2 rounded-lg ${cfg.bg}`}>
                                <SevIcon className={`w-5 h-5 ${cfg.color}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-[var(--color-dark-slate)]">{count}</p>
                                <p className="text-xs font-bold text-[var(--color-subtle-text)] uppercase tracking-wider">
                                    Unread {cfg.label}
                                </p>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 border-b border-[var(--color-border-mute)]">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 transition-all -mb-px ${
                            activeTab === tab.key
                                ? 'border-[var(--color-primary-solid)] text-[var(--color-dark-slate)]'
                                : 'border-transparent text-[var(--color-subtle-text)] hover:text-[var(--color-dark-slate)]'
                        }`}
                    >
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                                activeTab === tab.key
                                    ? 'bg-[var(--color-primary-solid)] text-white'
                                    : 'bg-[var(--color-app-bg)] text-[var(--color-subtle-text)]'
                            }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Alert list */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--color-app-bg)] flex items-center justify-center mb-4">
                        <Bell className="w-8 h-8 text-[var(--color-placeholder)]" />
                    </div>
                    <p className="text-base font-bold text-[var(--color-dark-slate)]">No alerts</p>
                    <p className="text-sm text-[var(--color-subtle-text)] mt-1">
                        {activeTab === 'unread' ? 'All caught up — no unread alerts.' : 'No alerts match this filter.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(alert => {
                        const cfg = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.info
                        const SevIcon = cfg.Icon
                        const isRead = alert.is_read

                        return (
                            <div
                                key={alert.id}
                                onClick={() => !isRead && handleMarkRead(alert.id)}
                                className={`flex gap-4 p-4 rounded-xl border-l-4 border border-[var(--color-border-mute)] ${cfg.border} transition-all ${
                                    isRead
                                        ? 'bg-[var(--color-card-bg)] opacity-60'
                                        : 'bg-white cursor-pointer hover:shadow-sm hover:border-[var(--color-border-mute)]'
                                }`}
                            >
                                <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${cfg.bg}`}>
                                    <SevIcon className={`w-4 h-4 ${cfg.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <p className={`text-sm font-bold ${isRead ? 'text-[var(--color-subtle-text)]' : 'text-[var(--color-dark-slate)]'}`}>
                                            {alert.title}
                                        </p>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {!isRead && (
                                                <span className="w-2 h-2 rounded-full bg-[var(--color-primary-solid)] shrink-0" />
                                            )}
                                            <span className="text-[10px] font-bold text-[var(--color-placeholder)] uppercase tracking-wider whitespace-nowrap">
                                                {alert.alert_type.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-[var(--color-subtle-text)] mt-1 leading-relaxed">
                                        {alert.message}
                                    </p>
                                    <p className="text-[11px] text-[var(--color-placeholder)] mt-2 font-medium">
                                        {formatTime(alert.created_at)}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
