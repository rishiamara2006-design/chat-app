import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'
import { useTheme } from '../hooks/useTheme'

export default function Chat() {
  const [currentUser, setCurrentUser] = useState(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  const { currentTheme, themeColors, changeTheme } = useTheme()
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null)
      setLoadingUser(false)
    })

    // Listen to login/logout state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null)
      setLoadingUser(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Show a clean loader while checking authentication
  if (loadingUser) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          width: '100vw',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#07090d',
          color: '#8d98a5',
          fontSize: '14px',
          fontFamily: 'sans-serif',
        }}
      >
        Loading chat...
      </div>
    )
  }

  // If no user is logged in, show a sign-in redirect prompt
  if (!currentUser) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          width: '100vw',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#07090d',
          color: '#ffffff',
          gap: '16px',
        }}
      >
        <p style={{ margin: 0, fontSize: '16px' }}>You are not logged in.</p>
        <button
          onClick={() => (window.location.href = '/')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#62e6f5',
            color: '#061014',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '700',
            cursor: 'pointer',
          }}
        >
          Go to Sign In
        </button>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100dvh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: themeColors?.bg || '#000000',
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: isMobile ? '100%' : '340px',
          minWidth: isMobile ? '100%' : '320px',
          height: '100%',
          borderRight: isMobile ? 'none' : `1px solid ${themeColors?.border || '#27272a'}`,
          display: isMobile && selectedUser ? 'none' : 'flex',
          flexDirection: 'column',
          backgroundColor: themeColors?.sidebarBg || themeColors?.bg || '#000000',
        }}
      >
        <Sidebar
          currentUser={currentUser}
          selectedUser={selectedUser}
          onSelectUser={(u) => setSelectedUser(u)}
          currentTheme={currentTheme}
          onThemeChange={changeTheme}
          themeColors={themeColors}
        />
      </div>

      {/* Chat Window */}
      <div
        style={{
          flex: 1,
          height: '100%',
          display: isMobile && !selectedUser ? 'none' : 'flex',
          flexDirection: 'column',
          backgroundColor: themeColors?.bg || '#000000',
          width: isMobile ? '100%' : 'auto',
        }}
      >
        {selectedUser ? (
          <ChatWindow
            user={currentUser}
            otherUser={selectedUser}
            onBack={() => setSelectedUser(null)}
            themeColors={themeColors}
          />
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: themeColors?.subtext || '#a1a1aa',
              fontSize: '14px',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: `2px dashed ${themeColors?.border || '#27272a'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}
            >
              💬
            </div>
            <span>Select a conversation to start messaging</span>
          </div>
        )}
      </div>
    </div>
  )
}