import React from 'react'
import { useEffect, useRef, useState } from 'react'

interface Props {
  options: string[]
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
}

export function SearchableSelect({ options, value, onChange, placeholder, className }: Props): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)
  const committed = useRef(value)

  useEffect(() => {
    setQuery(value)
    committed.current = value
  }, [value])

  const filtered = query
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options

  function handleSelect(opt: string): void {
    committed.current = opt
    setQuery(opt)
    onChange(opt)
    setOpen(false)
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setQuery(committed.current)
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={`searchable-select ${className ?? ''}`}>
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          setQuery('')
          setOpen(true)
        }}
      />
      {open && filtered.length > 0 && (
        <ul className="searchable-select__dropdown">
          {filtered.slice(0, 200).map((opt) => (
            <li key={opt} onMouseDown={() => handleSelect(opt)}>
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
