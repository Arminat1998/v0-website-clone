"use client"

import { useEffect, useState, type ReactNode } from "react"
import { ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { ComboSelect, comboGroups } from "@/components/combo-select"
import { FilterPanel } from "@/components/filter-panel"
import { NumericInput } from "@/components/numeric-input"
import { useLanguage } from "@/contexts/language-context"
import { formatEventDate } from "@/lib/bookings/format"
import { CALENDAR_MONTHS, calendarStart, calendarYears, isPastDate, mondayOffset } from "@/lib/filter-calendar"
import { lettersOnly } from "@/lib/input-filters"
import { PRICE_MAX, PRICE_MIN, cleanDuration, styleLabel, typeLabel, type ListFilters as Filters, type ProfessionalKind } from "@/lib/list-filters"
import { ARTIST_TYPES, EVENT_TYPE_GROUPS, GENRE_GROUPS, PHOTO_VIDEO_TYPES } from "@/lib/profile-options"

interface ListFiltersProps {
  kind: ProfessionalKind
  filters: Filters
  onChange: (patch: Partial<Filters>) => void
  onClear: () => void
  /** True when filters were read from the search text. */
  fromSearch?: boolean
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

/** The filter column of the artist list and the photo & video list. */
export function ListFilters({ kind, filters, onChange, onClear, fromSearch, isMobileOpen, onMobileClose }: ListFiltersProps) {
  const { t, language } = useLanguage()
  const nl = language === "nl"
  const artist = kind === "artist"
  const types = (artist ? ARTIST_TYPES : PHOTO_VIDEO_TYPES).map((type) => ({ value: type.value, label: nl ? type.nl : type.en }))
  const [min, max] = filters.priceRange

  return (
    <FilterPanel
      title={t.filters}
      isMobileOpen={isMobileOpen}
      onMobileClose={onMobileClose}
      onReset={onClear}
      badge={
        fromSearch ? (
          <Badge variant="secondary" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" aria-hidden />
            {t.smartSuggestion}
          </Badge>
        ) : null
      }
    >
      <Section id="filter-types-label" title={artist ? t.artistTypeLabel : nl ? "Type professional" : "Type of professional"}>
        <ComboSelect
          id="filter-types"
          labelledBy="filter-types-label"
          multiple
          nl={nl}
          value={filters.categories}
          onChange={(categories) => onChange({ categories })}
          placeholder={t.selectType}
          searchPlaceholder={nl ? "Zoek een type..." : "Search a type..."}
          labelFor={(value) => typeLabel(value, nl)}
          groups={[{ options: types }]}
        />
      </Section>

      <Section title={t.availability}>
        <DateFilter value={filters.selectedDate} onChange={(selectedDate) => onChange({ selectedDate })} />
      </Section>

      <Section title={t.city}>
        <Input
          aria-label={t.city}
          autoComplete="address-level2"
          className="h-11"
          maxLength={60}
          placeholder={t.searchCity}
          value={filters.city}
          onChange={(event) => onChange({ city: lettersOnly(event.target.value) })}
        />
      </Section>

      <Section title={t.durationInHours}>
        <DraftField
          id="filter-duration"
          label={t.durationInHours}
          value={filters.duration}
          allowDecimal
          placeholder="1 - 24"
          describedBy="filter-duration-hint"
          onCommit={(text) => onChange({ duration: cleanDuration(text) })}
        />
        <p id="filter-duration-hint" className="mt-1.5 text-xs text-muted-foreground">
          {nl
            ? "Telt niet mee in de resultaten. Hiermee schatten we wat je budget per uur is."
            : "Does not change the results. We use it to estimate your budget per hour."}
        </p>
      </Section>

      <Section title={`${t.priceRange} (${nl ? "per uur, excl. btw" : "per hour, excl. VAT"})`}>
        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <label htmlFor="filter-min-price" className="text-sm text-muted-foreground">{t.minPrice}</label>
            <DraftField
              id="filter-min-price"
              value={String(min)}
              onCommit={(text) => {
                const value = Math.min(PRICE_MAX, Number(text) || PRICE_MIN)
                onChange({ priceRange: value <= max ? [value, max] : [max, value] })
              }}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="filter-max-price" className="text-sm text-muted-foreground">{t.maxPrice}</label>
            <DraftField
              id="filter-max-price"
              value={String(max)}
              onCommit={(text) => {
                const value = text === "" ? PRICE_MAX : Math.min(PRICE_MAX, Number(text))
                onChange({ priceRange: value >= min ? [min, value] : [value, min] })
              }}
            />
          </div>
        </div>
        <Slider
          aria-label={t.priceRange}
          value={[min, max]}
          onValueChange={([low, high]) => onChange({ priceRange: [low, high] })}
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={50}
          className="w-full"
        />
      </Section>

      {artist && (
        <Section id="filter-genres-label" title={t.musicGenres}>
          <ComboSelect
            id="filter-genres"
            labelledBy="filter-genres-label"
            multiple
            nl={nl}
            value={filters.genres}
            onChange={(genres) => onChange({ genres })}
            placeholder={t.selectGenres}
            searchPlaceholder={nl ? "Zoek een genre..." : "Search a genre..."}
            labelFor={(value) => styleLabel(value, nl)}
            groups={comboGroups(GENRE_GROUPS, nl)}
          />
        </Section>
      )}

      <Section id="filter-event-types-label" title={t.eventTypes}>
        <ComboSelect
          id="filter-event-types"
          labelledBy="filter-event-types-label"
          multiple
          nl={nl}
          value={filters.eventTypes}
          onChange={(eventTypes) => onChange({ eventTypes })}
          placeholder={t.selectEventTypes}
          searchPlaceholder={nl ? "Zoek een evenement type..." : "Search an event type..."}
          groups={comboGroups(EVENT_TYPE_GROUPS, nl)}
        />
      </Section>
    </FilterPanel>
  )
}

function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      <h3 id={id} className="font-medium mb-3 text-foreground">
        {title}
      </h3>
      {children}
    </div>
  )
}

/** A number field that takes over its value when you leave it or press Enter, so half-typed numbers never filter. */
function DraftField({
  id,
  label,
  value,
  allowDecimal,
  placeholder,
  describedBy,
  onCommit,
}: {
  id: string
  label?: string
  value: string
  allowDecimal?: boolean
  placeholder?: string
  describedBy?: string
  onCommit: (text: string) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const commit = () => {
    if (draft === null) return
    setDraft(null)
    onCommit(draft)
  }
  return (
    <NumericInput
      id={id}
      aria-label={label}
      aria-describedby={describedBy}
      className="h-11"
      maxLength={5}
      placeholder={placeholder}
      allowDecimal={allowDecimal}
      value={draft ?? value}
      onValueChange={setDraft}
      onBlur={commit}
      onKeyDown={(event) => event.key === "Enter" && commit()}
    />
  )
}

/** A month calendar that picks one day; past days cannot be chosen. */
function DateFilter({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const { t, language } = useLanguage()
  const nl = language === "nl"
  const locale = nl ? "nl-NL" : "en-GB"
  const [view, setView] = useState(() => calendarStart())
  const years = calendarYears()
  const monthIndex = CALENDAR_MONTHS.indexOf(view.month)
  const year = Number(view.year)

  // The calendar shows the chosen date, also when it comes from the chat or the address bar.
  useEffect(() => {
    if (!value) return
    const [y, m] = value.split("-").map(Number)
    setView({ month: CALENDAR_MONTHS[m - 1], year: String(y) })
  }, [value])

  const position = year * 12 + monthIndex
  const start = calendarStart()
  const first = Number(start.year) * 12 + CALENDAR_MONTHS.indexOf(start.month)
  const last = Number(years[years.length - 1]) * 12 + 11
  const show = (months: number) => setView({ month: CALENDAR_MONTHS[months % 12], year: String(Math.floor(months / 12)) })
  const days = new Date(year, monthIndex + 1, 0).getDate()
  // A shared link may hold a later year than the list offers.
  const yearOptions = years.includes(view.year) ? years : [...years, view.year]

  return (
    <>
      {value && (
        <div className="mb-3 flex items-center justify-between gap-2 rounded border border-red-200 bg-red-50 py-1 pl-3 pr-1 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          <span>
            {t.selectedDate} {formatEventDate(value, locale, "short")}
          </span>
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label={nl ? "Datum wissen" : "Clear date"}
            className="flex size-9 shrink-0 items-center justify-center rounded hover:bg-red-100 dark:hover:bg-red-900/40"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <Button type="button" variant="ghost" size="sm" disabled={position <= first} onClick={() => show(position - 1)} aria-label={nl ? "Vorige maand" : "Previous month"}>
          <ChevronLeft className="w-4 h-4" aria-hidden />
        </Button>
        <div className="flex gap-2">
          <Select value={view.month} onValueChange={(month) => setView({ ...view, month })}>
            <SelectTrigger className="w-24" aria-label={nl ? "Maand" : "Month"}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CALENDAR_MONTHS.map((month, index) => (
                <SelectItem key={month} value={month}>
                  {new Date(2026, index, 1).toLocaleDateString(locale, { month: "short" })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={view.year} onValueChange={(next) => setView({ ...view, year: next })}>
            <SelectTrigger className="w-[5.5rem]" aria-label={nl ? "Jaar" : "Year"}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" variant="ghost" size="sm" disabled={position >= last} onClick={() => show(position + 1)} aria-label={nl ? "Volgende maand" : "Next month"}>
          <ChevronRight className="w-4 h-4" aria-hidden />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs">
        {[t.monday, t.tuesday, t.wednesday, t.thursday, t.friday, t.saturday, t.sunday].map((day) => (
          <div key={day} className="text-center font-medium p-1 text-foreground">
            {day}
          </div>
        ))}
        {Array.from({ length: mondayOffset(monthIndex, year) }, (_, index) => (
          <div key={`empty-${index}`} className="w-8 h-8" />
        ))}
        {Array.from({ length: days }, (_, index) => {
          const iso = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`
          const selected = value === iso
          const past = isPastDate(iso)
          return (
            <button
              key={iso}
              type="button"
              disabled={past}
              aria-pressed={selected}
              aria-label={formatEventDate(iso, locale)}
              className={`w-8 h-8 text-sm rounded flex items-center justify-center transition-colors ${
                selected ? "bg-red-600 text-white" : past ? "text-foreground cursor-not-allowed opacity-40" : "text-foreground hover:bg-accent"
              }`}
              onClick={() => onChange(selected ? "" : iso)}
            >
              {index + 1}
            </button>
          )
        })}
      </div>
    </>
  )
}
