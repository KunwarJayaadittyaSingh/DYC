import React from 'react'

const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  placeholder = 'Select an option',
  accentText = 'text-cyan-400',
  focusClass = 'focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(34,211,238,0.08)]',
}) => {
  return (
    <div>
      <label className="mb-3 block text-sm text-gray-300">
        {label} {required && <span className={accentText}>*</span>}
      </label>

      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full appearance-none rounded-xl border border-white/10 bg-transparent px-5 py-4 pr-12 text-white outline-none transition ${focusClass}`}
        >
          <option value="" disabled className="bg-black text-gray-500">
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt} className="bg-black text-white">
              {opt}
            </option>
          ))}
        </select>

        <svg
          className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}

export default SelectField