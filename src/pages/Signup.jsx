import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTheme } from '../hooks/useTheme'
import ThemeToggle from '../components/ThemeToggle'

export default function Signup() {
  const navigate = useNavigate()
  const [dark, setDark] = useTheme()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    if (!username.trim()) return 'Username is required.'
    if (username.trim().length < 3) return 'Username must be at least 3 characters.'
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Enter a valid email address.'
    if (!password) return 'Password is required.'
    if (password.length < 6) return 'Password must be at least 6 characters.'
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) {
      setError(err)
      return
    }
    setError('')
    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { username: username.trim() },
      },
    })
    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    // If email confirmation is disabled, take the user straight to chat.
    if (data?.session) {
      navigate('/')
      return
    }

    // Email confirmation enabled: create profile is handled by trigger, show message.
    setError(
      'Account created! Please check your email to confirm your account, then log in.',
    )
  }

  const input =
    'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 transition-colors dark:bg-gray-950">
      <div className="absolute right-4 top-4">
        <ThemeToggle dark={dark} toggle={() => setDark(!dark)} />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-lg transition-all dark:border-gray-800 dark:bg-gray-900">
        <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Create your account
        </h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Join and start chatting in seconds.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="rahul"
              className={input}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={input}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className={input}
            />
          </div>

          {error && (
            <p
              className={`rounded-lg px-3 py-2 text-sm ${
                error.startsWith('Account created')
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
              }`}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
