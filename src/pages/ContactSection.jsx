import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const ContactPage = () => {
  const [status, setStatus] = useState('idle')
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('sending')

    try {
      window.location.href = `mailto:contact@dyc.org?subject=Message from ${encodeURIComponent(
        form.name
      )}&body=${encodeURIComponent(form.message)}%0A%0AFrom: ${encodeURIComponent(form.email)}`
      setStatus('sent')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  return (
    <section className="w-full min-h-screen bg-black flex flex-col items-center justify-center px-4 text-center py-24">
      <Link
        to="/"
        className="fixed top-6 left-6 z-50 text-white/70 hover:text-white text-sm uppercase tracking-widest transition-colors"
      >
        ← Back
      </Link>

      <p className="text-red-600 uppercase tracking-widest text-sm mb-6">
        Get In Touch
      </p>

      <h1 className="font-[font7] text-white uppercase text-[9vw] md:text-[5vw] leading-none mb-10">
        Contact Us
      </h1>

      <p className="text-gray-300 max-w-xl mb-12 text-base md:text-lg leading-relaxed">
        Have a question, partnership idea, or just want to say hello?
        Send us a message and our team will get back to you soon.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-4 text-left">
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Your Name"
          required
          className="bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
        />
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Your Email"
          required
          className="bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
        />
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          placeholder="Your Message"
          rows={4}
          required
          className="bg-transparent border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 resize-none"
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          className="bg-red-600 text-white font-bold uppercase text-sm px-8 py-4 rounded-full hover:bg-red-500 transition-colors mt-2 disabled:opacity-60"
        >
          {status === 'sending' ? 'Sending...' : 'Send Message'}
        </button>

        {status === 'sent' && (
          <p className="text-green-400 text-sm text-center">Your mail app should have opened — send it from there!</p>
        )}
        {status === 'error' && (
          <p className="text-red-400 text-sm text-center">Something went wrong. Please try again.</p>
        )}
      </form>
    </section>
  )
}

export default ContactPage