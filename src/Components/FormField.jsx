import React from 'react'

const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  textarea = false,
  rows = 5,
  accentText = 'text-cyan-400',
  focusClass = 'focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(34,211,238,0.08)]',
}) => {
  const baseClass = `w-full rounded-xl border border-white/10 bg-transparent px-5 py-4 text-white outline-none transition placeholder:text-gray-600 ${focusClass}`

  return (
    <div>
      <label className="mb-3 block text-sm text-gray-300">
        {label} {required && <span className={accentText}>*</span>}
      </label>

      {textarea ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          required={required}
          className={`${baseClass} resize-none`}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={baseClass}
        />
      )}
    </div>
  )
}

export default FormField