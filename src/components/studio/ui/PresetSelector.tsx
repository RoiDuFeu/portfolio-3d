import { ChevronDownIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useStudioStore } from '../../../store/useStudioStore'

const PRESET_GROUPS = [
  {
    label: 'Realistic',
    presets: [
      { key: 'sun-cubemap-realistic', label: 'Sun (Shader)', icon: '☀️' },
      { key: 'earth-realistic',  label: 'Earth',  icon: '🌍' },
      { key: 'moon-realistic',   label: 'Moon',   icon: '🌕' },
      { key: 'mars-realistic',   label: 'Mars',   icon: '🔴' },
      { key: 'saturn-realistic', label: 'Saturn', icon: '🪐' },
      { key: 'coruscant-realistic', label: 'Coruscant', icon: '🏙️' },
    ],
  },
  {
    label: 'Procedural',
    presets: [
      { key: 'earth',      label: 'Earth',     icon: '🌏' },
      { key: 'mars',       label: 'Mars',       icon: '🟠' },
      { key: 'venus',      label: 'Venus',      icon: '🟡' },
      { key: 'mercury',    label: 'Mercury',    icon: '⚫' },
      { key: 'saturn',     label: 'Gas Giant',  icon: '🪐' },
      { key: 'ice',        label: 'Ice World',  icon: '❄️' },
      { key: 'lava',       label: 'Lava World', icon: '🌋' },
      { key: 'sun',        label: 'Star',       icon: '⭐' },
      { key: 'red-dwarf',  label: 'Red Dwarf',  icon: '🔥' },
    ],
  },
]

export function PresetSelector() {
  const loadPreset = useStudioStore((s) => s.loadPreset)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="studio-select inline-flex items-center gap-1.5">
        Presets
        <ChevronDownIcon className="size-3 opacity-50" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="!w-auto min-w-40 p-1.5 backdrop-blur-sm"
        style={{
          background: 'rgba(8, 12, 28, 0.97)',
          border: '1px solid rgba(100, 150, 255, 0.18)',
          boxShadow: '0 8px 32px rgba(0, 5, 20, 0.8), 0 0 0 1px rgba(100, 150, 255, 0.08)',
        }}
      >
        {PRESET_GROUPS.map(({ label, presets }, i) => (
          <DropdownMenuGroup key={label}>
            <DropdownMenuLabel
              className="px-2 py-1 text-[0.6rem] font-semibold tracking-widest uppercase"
              style={{ color: 'rgba(100, 150, 255, 0.5)' }}
            >
              {label}
            </DropdownMenuLabel>

            {presets.map(({ key, label: pLabel, icon }) => (
              <DropdownMenuItem
                key={key}
                onClick={() => loadPreset(key)}
                className="flex items-center gap-2 rounded px-2 py-1 text-[0.72rem] cursor-pointer"
                style={{ color: 'rgba(200, 215, 240, 0.85)' }}
              >
                <span className="text-sm leading-none">{icon}</span>
                {pLabel}
              </DropdownMenuItem>
            ))}

            {i < PRESET_GROUPS.length - 1 && (
              <DropdownMenuSeparator
                className="my-1.5"
                style={{ background: 'rgba(100, 150, 255, 0.1)' }}
              />
            )}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
