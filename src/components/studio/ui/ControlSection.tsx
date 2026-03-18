import { useState } from 'react'
import type { ReactNode } from 'react'

interface ControlSectionProps {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}

export function ControlSection({ title, defaultOpen = true, children }: ControlSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="ctrl-section">
      <button
        className="ctrl-section__header"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <span className="ctrl-section__title">{title}</span>
        <span className={`ctrl-section__chevron ${open ? 'ctrl-section__chevron--open' : ''}`}>
          &#9654;
        </span>
      </button>
      {open && <div className="ctrl-section__body">{children}</div>}
    </div>
  )
}
