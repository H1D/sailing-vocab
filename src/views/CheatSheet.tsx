import type { Category, Term } from '../types/index'

interface Props {
  terms: Term[]
}

const SHEET_CATEGORIES: Category[] = ['commands', 'winch-work', 'mooring']

const CATEGORY_LABELS: Record<string, string> = {
  commands: 'Commands',
  'winch-work': 'Winch Work',
  mooring: 'Mooring',
}

const ROLE_LABELS: Record<string, string> = {
  helm: 'H',
  crew: 'C',
  both: 'B',
}

function rolePill(role: string) {
  const cfg: Record<string, { label: string; cls: string }> = {
    helm: { label: 'H', cls: 'text-blue-300' },
    crew: { label: 'C', cls: 'text-green-300' },
    both: { label: 'B', cls: 'text-purple-300' },
  }
  const c = cfg[role] ?? { label: ROLE_LABELS[role] ?? role, cls: 'text-slate-400' }
  return (
    <span className={`font-bold text-xs ${c.cls}`} title={role.toUpperCase()}>
      [{c.label}]
    </span>
  )
}

export default function CheatSheet({ terms }: Props) {
  const relevantTerms = terms.filter(t => SHEET_CATEGORIES.includes(t.category as Category))

  const handlePrint = () => window.print()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 dark:border-slate-800 no-print">
        <h2 className="text-lg font-bold text-white dark:text-red-300">⚓ Cheat Sheet</h2>
        <button
          onClick={handlePrint}
          className="print-button bg-slate-700 hover:bg-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          🖨️ Print
        </button>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 flex gap-4 text-xs text-slate-500 dark:text-slate-600 no-print border-b border-slate-700 dark:border-slate-800">
        <span className="text-blue-400">[H] = Helm</span>
        <span className="text-green-400">[C] = Crew</span>
        <span className="text-purple-400">[B] = Both</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 cheat-sheet-content">
        {relevantTerms.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <div className="text-5xl mb-4">📋</div>
            <div>No commands or winch/mooring terms loaded</div>
          </div>
        ) : (
          SHEET_CATEGORIES.map(cat => {
            const catTerms = relevantTerms.filter(t => t.category === cat)
            if (catTerms.length === 0) return null
            return (
              <div key={cat} className="mb-5 break-inside-avoid">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 border-b border-slate-700 dark:border-slate-800 pb-1">
                  {CATEGORY_LABELS[cat] ?? cat}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5">
                  {catTerms.map(term => (
                    <div
                      key={term.id}
                      className="flex items-baseline gap-1.5 py-1 border-b border-slate-800 dark:border-slate-900 last:border-0 text-sm leading-snug"
                    >
                      <span className="font-semibold text-white dark:text-red-300 whitespace-nowrap flex-shrink-0">
                        {term.term}
                      </span>
                      {term.role && rolePill(term.role)}
                      <span className="text-slate-500 dark:text-slate-600 flex-shrink-0">→</span>
                      <span className="text-slate-300 dark:text-red-200 min-w-0">
                        {term.definition}
                        <span className="text-slate-500 dark:text-slate-600 ml-1 text-xs">
                          ({term.ru})
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
