"use client"

interface DualRangeSliderProps {
  min: number
  max: number
  minValue: number
  maxValue: number
  onMinChange: (value: number) => void
  onMaxChange: (value: number) => void
  minLabel: string
  maxLabel: string
}

export function DualRangeSlider({ min, max, minValue, maxValue, onMinChange, onMaxChange, minLabel, maxLabel }: DualRangeSliderProps) {
  const minPercent = ((minValue - min) / (max - min)) * 100
  const maxPercent = ((maxValue - min) / (max - min)) * 100

  return (
    <div className="relative h-2 w-full">
      {/* Track background */}
      <div className="absolute h-2 w-full rounded-full bg-[var(--rf-track)]" />

      {/* Active track */}
      <div
        className="absolute h-2 rounded-full bg-[var(--rf-red)]"
        style={{
          left: `${minPercent}%`,
          right: `${100 - maxPercent}%`,
        }}
      />

      {/* Min range input */}
      <input
        type="range"
        min={min}
        max={max}
        value={minValue}
        aria-label={minLabel}
        onChange={(e) => {
          const value = Number(e.target.value)
          if (value <= maxValue) {
            onMinChange(value)
          }
        }}
        className="pointer-events-none absolute h-2 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-[var(--rf-red)] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-solid [&::-moz-range-thumb]:border-[var(--rf-red)] [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md"
      />

      {/* Max range input */}
      <input
        type="range"
        min={min}
        max={max}
        value={maxValue}
        aria-label={maxLabel}
        onChange={(e) => {
          const value = Number(e.target.value)
          if (value >= minValue) {
            onMaxChange(value)
          }
        }}
        className="pointer-events-none absolute h-2 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-[var(--rf-red)] [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-solid [&::-moz-range-thumb]:border-[var(--rf-red)] [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md"
      />
    </div>
  )
}
