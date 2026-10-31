import { CalendarDays, Clock3, ChevronDown } from 'lucide-react';
import React, { useState, useEffect, useRef, useId } from 'react';
import { toIsoDateValue, toIsoTimeValue } from '../spatial';

export function DateTimeField({
  kind,
  label,
  hideLabel,
  value,
  onChange,
  onFocus,
  onInputKeyDown,
  dataTableInput,
}: {
  kind: 'date' | 'time';
  label: string;
  hideLabel?: boolean;
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  onInputKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  dataTableInput?: string;
}) {
  const picker = useRef<HTMLInputElement>(null);
  const control = (
    <div className="typed-picker">
      <input
        aria-label={label}
        data-table-input={dataTableInput}
        type="text"
        value={value}
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder={kind === 'date' ? (hideLabel ? 'YYYY-MM-DD' : 'YYYY-MM-DD atau DD/MM/YYYY') : 'HH:MM:SS'}
        onFocus={onFocus}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onInputKeyDown}
      />
      <button
        type="button"
        tabIndex={hideLabel ? -1 : undefined}
        aria-label={kind === 'date' ? 'Pilih tanggal dari kalender' : 'Pilih waktu dari jam'}
        onClick={() => {
          onFocus?.();
          try {
            picker.current?.showPicker();
          } catch {
            picker.current?.focus();
          }
        }}
      >
        {kind === 'date' ? <CalendarDays size={16} /> : <Clock3 size={16} />}
      </button>
      <input
        ref={picker}
        tabIndex={-1}
        aria-label={`${label} picker`}
        type={kind}
        step={kind === 'time' ? 1 : undefined}
        value={kind === 'date' ? toIsoDateValue(value) : toIsoTimeValue(value)}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
  return hideLabel ? control : <label>{label}{control}</label>;
}

export function DayField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: Event) => {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', dismiss, true);
    document.addEventListener('focusin', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', dismiss, true);
      document.removeEventListener('focusin', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  return (
    <div ref={container} className="day-field">
      <label>
        Hari
        <div className="typed-picker">
          <input
            aria-label="Hari"
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') setOpen(false);
            }}
          />
          <button type="button" aria-label="Pilih hari" aria-expanded={open} onClick={() => setOpen(!open)}>
            <ChevronDown size={16} />
          </button>
        </div>
      </label>
      {open && (
        <div className="day-options">
          {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(day => (
            <button
              key={day}
              type="button"
              onClick={() => {
                onChange(day);
                setOpen(false);
              }}
            >
              {day}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export type { LocationOption } from '../locationSearch';
import { searchLocations, type LocationOption } from '../locationSearch';

export function LocationField({
  value,
  resolvedLabel,
  options,
  onChange,
  label = 'Lokasi',
  hideLabel,
  placeholder = 'Nama wilayah, konteks desa/kecamatan, atau ID',
  onFocus,
  onInputKeyDown,
  dataTableInput,
}: {
  value: string;
  resolvedLabel?: string;
  options: LocationOption[];
  onChange: (v: string) => void;
  label?: string;
  hideLabel?: boolean;
  placeholder?: string;
  onFocus?: () => void;
  onInputKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  dataTableInput?: string;
}) {
  const uid = useId();
  const listboxId = `location-results-${uid}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.id === value || o.id.split(':')[1] === value);
  const display = selected ? selected.target.displayLabel : (resolvedLabel || value);
  const [text, setText] = useState(display);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(-1);
  const [limit, setLimit] = useState(12);
  const [scope, setScope] = useState<LocationOption>();
  const committedRef = useRef(display);

  useEffect(() => {
    setText(display);
    committedRef.current = display;
  }, [display]);

  const result = searchLocations(text, options, scope);
  const matches = result.options.slice(0, limit);
  const isResolved = !!selected || !!resolvedLabel;

  const choose = (o: LocationOption) => {
    committedRef.current = o.target.displayLabel;
    setText(o.target.displayLabel);
    setOpen(false);
    setScope(undefined);
    setIndex(-1);
    onChange(o.id);
  };

  const inputEl = (
    <input
      role="combobox"
      aria-label={hideLabel ? label : undefined}
      aria-expanded={open}
      aria-controls={listboxId}
      aria-autocomplete="list"
      aria-activedescendant={index >= 0 ? `location-option-${uid}-${index}` : undefined}
      data-table-input={dataTableInput}
      value={text}
      placeholder={placeholder}
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      onFocus={() => {
        onFocus?.();
        if (!hideLabel || !isResolved) setOpen(true);
      }}
      onChange={e => {
        setText(e.target.value);
        setOpen(true);
        setIndex(-1);
        setLimit(12);
      }}
      onBlur={e => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
          setOpen(false);
          if (text !== committedRef.current) {
            committedRef.current = text;
            onChange(text);
          }
        }
      }}
      onKeyDown={e => {
        if (e.key === 'Tab' && !e.altKey && !e.ctrlKey && !e.metaKey) {
          if (open && index >= 0 && matches[index]) {
            choose(matches[index]);
          } else {
            setOpen(false);
            if (text !== committedRef.current) {
              committedRef.current = text;
              onChange(text);
            }
          }
          onInputKeyDown?.(e);
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setOpen(true);
          setIndex(i => Math.min(i + 1, matches.length - 1));
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setOpen(true);
          setIndex(i => Math.max(0, i - 1));
        }
        if (e.key === 'Escape') {
          setOpen(false);
        }
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
          e.preventDefault();
          if (index >= 0 && matches[index]) {
            choose(matches[index]);
          } else if (matches.length === 1 && !result.suggestion) {
            choose(matches[0]);
          } else {
            setOpen(true);
            if (matches.length > 0) setIndex(0);
          }
        }
      }}
    />
  );

  return (
    <div ref={containerRef} className="location-field">
      {scope && (
        <div className="location-scope">
          Dalam {scope.label}
          <button
            type="button"
            onClick={() => {
              setScope(undefined);
              setText('');
              setOpen(true);
            }}
          >
            Hapus filter
          </button>
        </div>
      )}
      {hideLabel ? inputEl : <label>{label}{inputEl}</label>}
      {open && (text || scope) && (
        <div id={listboxId} role="listbox" className="location-results">
          <p className="location-count">
            {result.suggestion ? 'Saran nama — pilih untuk memastikan wilayah' : `${result.options.length} wilayah ditemukan`}
          </p>
          {matches.map((o, i) => (
            <div key={o.id} className="location-result">
              <button
                type="button"
                role="option"
                aria-selected={i === index}
                id={`location-option-${uid}-${i}`}
                onMouseDown={e => e.preventDefault()}
                onClick={() => choose(o)}
              >
                {o.label}
                <small>{o.sublabel}</small>
                <small>
                  {o.level === 'sls'
                    ? `${o.children} SubSLS`
                    : o.level === 'desa'
                      ? 'Desa / kelurahan'
                      : o.level === 'kecamatan'
                        ? 'Kecamatan'
                        : 'SubSLS'}
                </small>
              </button>
              {o.children > 0 && o.level !== 'subsls' && (
                <button
                  type="button"
                  className="browse-location"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => {
                    setScope(o);
                    setText('');
                    setIndex(-1);
                    setLimit(12);
                    setOpen(true);
                  }}
                >
                  {o.level === 'sls' ? 'Lihat SubSLS' : o.level === 'desa' ? 'Lihat SLS' : 'Lihat desa / SLS'} →
                </button>
              )}
            </div>
          ))}
          {!matches.length && <p>Wilayah belum ditemukan. Periksa tingkat wilayah atau tambahkan konteks desa/kecamatan.</p>}
          {result.options.length > limit && (
            <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => setLimit(n => n + 24)}>
              Lihat hasil lainnya ({result.options.length - limit})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
