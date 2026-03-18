import { Eye, ArrowLeftRight, GraduationCap, Flag, Scale } from 'lucide-react'
import type { AuditType } from '@/lib/audit'
import type { LucideIcon } from 'lucide-react'

interface AuditTypeConfig {
  id: AuditType
  label: string
  description: string
  icon: LucideIcon
}

export const AUDIT_TYPE_CONFIGS: AuditTypeConfig[] = [
  {
    id: 'principles',
    label: 'Principles Audit',
    description: 'Seamfulness · Contestability · Productive Difficulty',
    icon: Eye,
  },
  {
    id: 'handoff',
    label: 'Handoff Analysis',
    description: 'What moved from human to machine, who bears the cost',
    icon: ArrowLeftRight,
  },
  {
    id: 'competency',
    label: 'Competency Cultivation',
    description: 'Does it build AI literacy habits? (CC1–CC5)',
    icon: GraduationCap,
  },
  {
    id: 'redflags',
    label: 'Red Flags Scan',
    description: 'Deception, dependency traps, accountability gaps (RF1–RF4)',
    icon: Flag,
  },
  {
    id: 'values',
    label: 'Value Concerns',
    description: 'Accountability, autonomy, who wins / who pays',
    icon: Scale,
  },
]

interface AuditTypeSelectorProps {
  selected: AuditType
  onChange: (type: AuditType) => void
  disabled?: boolean
}

export function AuditTypeSelector({ selected, onChange, disabled }: AuditTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Audit type</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {AUDIT_TYPE_CONFIGS.map((config) => {
          const Icon = config.icon
          const isSelected = selected === config.id
          return (
            <button
              key={config.id}
              onClick={() => onChange(config.id)}
              disabled={disabled}
              className={`text-left rounded-lg border p-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isSelected
                  ? 'border-foreground bg-muted'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon
                  className={`h-3.5 w-3.5 shrink-0 ${
                    isSelected ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                />
                <span className={`text-sm font-medium leading-tight ${isSelected ? '' : 'text-muted-foreground'}`}>
                  {config.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-snug pl-5">
                {config.description}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
