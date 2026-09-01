import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a12',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '20px',
        boxSizing: 'border-box',
        position: 'fixed',
        top: 0,
        left: 0,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          padding: '36px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(16px)',
          textAlign: 'center',
        }}
      >
        {/* Header */}
        <div
          style={{
            width: '54px',
            height: '54px',
            margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #7c3aed, #db2777)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 10px 20px rgba(124, 58, 237, 0.3)',
          }}
        >
          ✨
        </div>

        <h1 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: '700' }}>
          Welcome back
        </h1>
        <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#94a3b8' }}>
          Log in to continue chatting
        </p>

        {/* Error Notification */}
        {errorMsg && (
          <div
            style={{
              padding: '10px 14px',
              marginBottom: '18px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              color: '#f87171',
              fontSize: '12px',
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              padding: '13px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              boxShadow: '0 8px 20px rgba(124, 58, 237, 0.35)',
              transition: 'transform 0.1s ease',
            }}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {/* Footer */}
        <div style={{ marginTop: '24px', fontSize: '13px', color: '#94a3b8' }}>
          Don't have an account?{' '}
          <Link
            to="/signup"
            style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: '500' }}
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}