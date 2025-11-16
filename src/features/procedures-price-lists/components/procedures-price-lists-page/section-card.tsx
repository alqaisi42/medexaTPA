import React from 'react'

interface SectionCardProps {
    title: string
    description?: string
    actions?: React.ReactNode
    children: React.ReactNode
}

export function SectionCard({title, description, actions, children}: SectionCardProps) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <header className="flex flex-col gap-2 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                    {description ? <p className="text-sm text-slate-500">{description}</p> : null}
                </div>
                {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
            </header>
            <div className="px-6 py-5">{children}</div>
        </section>
    )
}
