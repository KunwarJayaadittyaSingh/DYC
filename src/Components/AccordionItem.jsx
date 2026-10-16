import React, { useState } from 'react'

const AccordionItem = ({
  question,
  answer,
  accentClass = 'text-cyan-400',
  borderHover = 'hover:border-cyan-400/40',
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-black/60 backdrop-blur-sm transition-all duration-300 ${borderHover}`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="text-base font-medium text-white md:text-lg">{question}</span>
        <svg
          className={`h-5 w-5 shrink-0 transition-transform duration-300 ${accentClass} ${
            open ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? '480px' : '0px' }}
      >
        <p className="px-6 pb-6 leading-relaxed text-gray-400">{answer}</p>
      </div>
    </div>
  )
}

export default AccordionItem