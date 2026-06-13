import { useState } from 'react';
import type { KeyboardEvent } from 'react';

export interface ComboboxOption {
  id: string;
  primary: string;
  secondary?: string;
}

interface ComboboxProps {
  id: string;
  value: string;
  onInputChange: (text: string) => void;
  onSelect: (option: ComboboxOption) => void;
  options: ComboboxOption[];
  placeholder?: string;
  /** show suggestions as soon as the input gains focus (provider field) */
  openOnFocus?: boolean;
  error?: string;
  hint?: string;
}

/**
 * WAI-ARIA combobox: ↑/↓ to move, Enter to pick, Esc to close.
 * Enter only submits the surrounding form while the listbox is closed.
 */
export function Combobox({
  id,
  value,
  onInputChange,
  onSelect,
  options,
  placeholder,
  openOnFocus = false,
  error,
  hint,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const expanded = open && options.length > 0;
  const active = expanded ? Math.min(activeIndex, options.length - 1) : -1;

  const choose = (option: ComboboxOption) => {
    onSelect(option);
    setOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!expanded) {
        setOpen(true);
        setActiveIndex(0);
        return;
      }
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((i) => (i + delta + options.length) % options.length);
    } else if (e.key === 'Enter') {
      if (expanded && active >= 0) {
        e.preventDefault();
        choose(options[active]);
      }
    } else if (e.key === 'Escape') {
      if (expanded) {
        e.preventDefault();
        setOpen(false);
      }
    }
  };

  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="combobox">
      <input
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={expanded}
        aria-controls={`${id}-listbox`}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onInputChange(e.target.value);
          setOpen(true);
          setActiveIndex(0);
        }}
        onFocus={() => {
          if (openOnFocus) setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
      />
      {expanded && (
        <ul className="combobox-listbox" role="listbox" id={`${id}-listbox`}>
          {options.map((option, i) => (
            <li
              key={option.id}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              className={`combobox-option${i === active ? ' is-active' : ''}`}
              // mousedown fires before the input's blur, so the click still lands
              onMouseDown={(e) => {
                e.preventDefault();
                choose(option);
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className="combobox-primary">{option.primary}</span>
              {option.secondary && <span className="combobox-secondary">{option.secondary}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
