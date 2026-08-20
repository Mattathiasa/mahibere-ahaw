import { useState, useEffect, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import {
  toEthiopianDate,
  toGregorianDate,
  todayISO,
  ETHIOPIAN_MONTHS,
  getEthiopianYearOptions,
  getGregorianYearOptions,
  isEthiopianLeapYear,
  EthiopianDate,
} from '@/lib/ethiopian-calendar';

interface EthiopianDatePickerProps {
  value?: string | Date;
  onChange?: (isoDate: string, ethFormatted: string, ethDateObj: EthiopianDate) => void;
  placeholder?: string;
  className?: string;
  /** If true, auto-initializes to today when value is empty (default: true) */
  defaultToToday?: boolean;
  /** If true, show a toggle to switch between Ethiopian and Gregorian calendar entry. */
  allowGregorian?: boolean;
  /** Which calendar to open in by default. Falls back to localStorage 'calendar-preference'. */
  defaultCalendar?: 'ethiopian' | 'gregorian';
}

// Amharic weekday abbreviations — week starts Sunday (እሑድ)
const ETH_WEEKDAYS_SHORT = ['እሑ', 'ሰኞ', 'ማክ', 'ረቡ', 'ሐሙ', 'ዓር', 'ቅዳ'];

/** Day-of-week (0=Sun) for the 1st of a given Ethiopian month. */
function getFirstDayOfWeek(ethYear: number, ethMonth: number): number {
  return toGregorianDate(ethYear, ethMonth, 1).getDay();
}

/** Build a stable "today" snapshot once per render. */
function todayEth(): EthiopianDate {
  return toEthiopianDate(new Date());
}

/** Convert an EthiopianDate selection to ISO date string. */
function ethToISO(y: number, m: number, d: number): string {
  const g = toGregorianDate(y, m, d);
  const yy = g.getFullYear();
  const mm = String(g.getMonth() + 1).padStart(2, '0');
  const dd = String(g.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function EthiopianDatePicker({
  value,
  onChange,
  placeholder = 'ቀን ይምረጡ',
  className = '',
  defaultToToday = true,
  allowGregorian = false,
  defaultCalendar,
}: EthiopianDatePickerProps) {
  // Resolve initial calendar mode: prop > localStorage > 'ethiopian'
  const initialCalendar = defaultCalendar
    ?? (localStorage.getItem('calendar-preference') as 'ethiopian' | 'gregorian')
    ?? 'ethiopian';
  const [open, setOpen] = useState(false);

  // Resolve the initial Ethiopian date from `value` prop, or fall back to today.
  const resolve = useCallback((): EthiopianDate => {
    if (value) {
      const eth = toEthiopianDate(value instanceof Date ? value : value.toString());
      if (eth.year > 0) return eth;
    }
    return todayEth();
  }, [value]);

  const initial = resolve();

  const [sel, setSel] = useState<{ year: number; month: number; day: number }>({
    year: initial.year,
    month: initial.month,
    day: initial.day,
  });

  // View month/year (can navigate independently of selection)
  const [view, setView] = useState<{ year: number; month: number }>({
    year: initial.year,
    month: initial.month,
  });

  // When value prop changes externally, sync state
  useEffect(() => {
    if (value) {
      const eth = toEthiopianDate(value instanceof Date ? value : value.toString());
      if (eth.year > 0) {
        setSel({ year: eth.year, month: eth.month, day: eth.day });
        setView({ year: eth.year, month: eth.month });
      }
    } else if (defaultToToday) {
      // No value → default to today and emit it upward
      const today = todayEth();
      setSel({ year: today.year, month: today.month, day: today.day });
      setView({ year: today.year, month: today.month });
      if (onChange) {
        const iso = todayISO();
        onChange(iso, today.formatted, today);
      }
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // On first mount with no value, emit today upward so parent state is populated
  useEffect(() => {
    if (!value && defaultToToday && onChange) {
      const today = todayEth();
      const iso = todayISO();
      onChange(iso, today.formatted, today);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const maxDays = view.month === 13 ? (isEthiopianLeapYear(view.year) ? 6 : 5) : 30;
  const firstDow = getFirstDayOfWeek(view.year, view.month);
  const yearOptions = getEthiopianYearOptions(1900, 5);

  // ── Gregorian calendar mode ──
  const [calMode, setCalMode] = useState<'ethiopian' | 'gregorian'>(initialCalendar);
  const [gYear, setGYear] = useState(() => {
    const d = new Date();
    return d.getFullYear();
  });
  const [gMonth, setGMonth] = useState(() => {
    const d = new Date();
    return d.getMonth() + 1;
  });
  const [gDay, setGDay] = useState(() => {
    const d = new Date();
    return d.getDate();
  });
  const gregorianYearOptions = getGregorianYearOptions(1900, 5);
  const GREG_MONTHS = [
    { id: 1, name: 'January' }, { id: 2, name: 'February' }, { id: 3, name: 'March' },
    { id: 4, name: 'April' }, { id: 5, name: 'May' }, { id: 6, name: 'June' },
    { id: 7, name: 'July' }, { id: 8, name: 'August' }, { id: 9, name: 'September' },
    { id: 10, name: 'October' }, { id: 11, name: 'November' }, { id: 12, name: 'December' },
  ];
  const gregMaxDays = new Date(gYear, gMonth, 0).getDate();
  const handleGregorianDayClick = (day: number) => {
    const yy = gYear;
    const mm = String(gMonth).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const iso = `${yy}-${mm}-${dd}`;
    const eth = toEthiopianDate(iso);
    const monthObj = ETHIOPIAN_MONTHS.find(m => m.id === eth.month) ?? ETHIOPIAN_MONTHS[0];
    const formatted = `${monthObj.name} ${eth.day}, ${eth.year} ዓ.ም.`;
    if (onChange) onChange(iso, formatted, eth);
    setOpen(false);
  };

  const handleDayClick = (day: number) => {
    const newSel = { year: view.year, month: view.month, day };
    setSel(newSel);

    const monthObj = ETHIOPIAN_MONTHS.find(m => m.id === view.month) ?? ETHIOPIAN_MONTHS[0];
    const formatted = `${monthObj.name} ${day}, ${view.year} ዓ.ም.`;
    const ethObj: EthiopianDate = {
      year: view.year,
      month: view.month,
      day,
      monthName: monthObj.name,
      formatted,
    };
    const iso = ethToISO(view.year, view.month, day);

    if (onChange) onChange(iso, formatted, ethObj);
    setOpen(false);
  };

  const prevMonth = () => {
    setView(v => v.month === 1
      ? { year: v.year - 1, month: 13 }
      : { year: v.year, month: v.month - 1 });
  };

  const nextMonth = () => {
    setView(v => v.month === 13
      ? { year: v.year + 1, month: 1 }
      : { year: v.year, month: v.month + 1 });
  };

  const viewMonthObj = ETHIOPIAN_MONTHS.find(m => m.id === view.month) ?? ETHIOPIAN_MONTHS[0];
  const selMonthObj  = ETHIOPIAN_MONTHS.find(m => m.id === sel.month)  ?? ETHIOPIAN_MONTHS[0];
  const displayLabel = `${selMonthObj.name} ${sel.day}, ${sel.year} ዓ.ም.`;

  const today = todayEth();

  const isSelected = (day: number) =>
    day === sel.day && view.month === sel.month && view.year === sel.year;

  const isToday = (day: number) =>
    day === today.day && view.month === today.month && view.year === today.year;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={`w-full justify-start text-left font-normal rounded-xl border-[#2E5E99]/30 hover:bg-[#2E5E99]/5 hover:border-[#2E5E99]/50 transition-colors ${className}`}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-[#2E5E99] shrink-0" />
          <span className="font-semibold text-[#0D2440] dark:text-white truncate">
            {displayLabel}
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[320px] p-0 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D2440] overflow-hidden"
        align="start"
        sideOffset={4}
      >
        {/* ── Blue header: month/year navigation ── */}
        <div className="bg-[#2E5E99] text-white px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2">
              {/* Month quick-selector */}
              <Select
                value={view.month.toString()}
                onValueChange={(v) => setView(prev => ({ ...prev, month: parseInt(v) }))}
              >
                <SelectTrigger className="h-7 bg-white/15 border-white/20 text-white text-xs font-bold w-28 rounded-lg px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {ETHIOPIAN_MONTHS.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()} className="text-xs font-medium">
                      {m.id}. {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Year quick-selector */}
              <Select
                value={view.year.toString()}
                onValueChange={(v) => setView(prev => ({ ...prev, year: parseInt(v) }))}
              >
                <SelectTrigger className="h-7 bg-white/15 border-white/20 text-white text-xs font-bold w-20 rounded-lg px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y.toString()} className="text-xs">
                      {y} ዓ.ም.
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <p className="text-center text-[10px] font-bold tracking-wider text-white/75 uppercase">
            የኢትዮጵያ ዘመን አቆጣጠር — {viewMonthObj.name} {view.year} ዓ.ም.
          </p>
        </div>

        {/* ── Weekday header row ── */}
        <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
          {ETH_WEEKDAYS_SHORT.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-[10px] font-black tracking-wider text-[#2E5E99] dark:text-[#7BA4D0]"
            >
              {d}
            </div>
          ))}
        </div>

        {/* ── Calendar day grid ── */}
        <div className="p-3">
          <div className="grid grid-cols-7 gap-1">
            {/* Leading blank cells to align day 1 with correct weekday */}
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`blank-${i}`} />
            ))}

            {/* Day buttons */}
            {Array.from({ length: maxDays }, (_, i) => i + 1).map((day) => {
              const selected = isSelected(day);
              const isT = isToday(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={[
                    'relative h-9 w-full rounded-lg text-xs font-bold transition-all',
                    'flex items-center justify-center',
                    selected
                      ? 'bg-[#2E5E99] text-white shadow-md scale-105'
                      : isT
                        ? 'bg-[#2E5E99]/10 text-[#2E5E99] dark:text-[#7BA4D0] ring-1 ring-[#2E5E99]/50'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800',
                  ].join(' ')}
                >
                  {day}
                  {/* Dot indicator for today (when not selected) */}
                  {isT && !selected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#2E5E99]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Gregorian mode ── */}
        {calMode === 'gregorian' && (
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Select value={gMonth.toString()} onValueChange={(v) => setGMonth(parseInt(v))}>
                <SelectTrigger className="h-8 text-xs font-bold rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {GREG_MONTHS.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()} className="text-xs">{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={gYear.toString()} onValueChange={(v) => setGYear(parseInt(v))}>
                <SelectTrigger className="h-8 text-xs font-bold rounded-lg w-24"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {gregorianYearOptions.map((y) => (
                    <SelectItem key={y} value={y.toString()} className="text-xs">{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: gregMaxDays }, (_, i) => i + 1).map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleGregorianDayClick(day)}
                  className="h-9 w-full rounded-lg text-xs font-bold flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer: show both calendars simultaneously ── */}
        <div className="px-4 pb-3 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
          {/* Ethiopian date */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#2E5E99]" />
              Ethiopian
            </span>
            <span className="font-black text-[#0D2440] dark:text-white">
              {displayLabel}
            </span>
          </div>
          {/* Gregorian date */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Gregorian
            </span>
            <span className="font-black text-[#2E5E99] dark:text-[#7BA4D0] font-mono">
              {(() => {
                const iso = ethToISO(sel.year, sel.month, sel.day);
                const d = new Date(iso);
                return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
              })()}
            </span>
          </div>
          {allowGregorian && (
            <button
              type="button"
              onClick={() => setCalMode(calMode === 'ethiopian' ? 'gregorian' : 'ethiopian')}
              className="w-full flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#2E5E99] dark:text-[#7BA4D0] hover:underline pt-1"
            >
              <Globe className="h-3 w-3" />
              {calMode === 'ethiopian' ? 'Switch to Gregorian calendar' : 'Switch to Ethiopian calendar'}
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
