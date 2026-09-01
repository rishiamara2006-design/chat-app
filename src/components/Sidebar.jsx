import { useEffect, useState, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabase'

const DEFAULT_THEME_COLORS = {
  bg: '#000000',
  border: '#27272a',
  cardBg: '#18181b',
  text: '#ffffff',
  subtext: '#a1a1aa',
  bubbleMine: 'linear-gradient(135deg, #7000ff, #bd00ff)',
  bubbleOther: '#1f1f23',
  accent: '#0095f6',
  avatar: 'https://i.postimg.cc/CK5WqKJS/download-(1).jpg',
}

const THEME_OPTIONS = [
  { id: 'black', label: 'Black', color: '#18181b', border: '#3f3f46' },
  { id: 'white', label: 'White', color: '#ffffff', border: '#e4e4e7' },
  { id: 'pink', label: 'Pink', color: '#fda4af', border: '#f43f5e' },
  { id: 'emerald', label: 'Emerald', color: '#10b981', border: '#059669' },
]

export default function Sidebar({
  currentUser,
  selectedUser,
  onSelectUser,
  currentTheme = 'black',
  onThemeChange = () => {},
  themeColors = DEFAULT_THEME_COLORS,
}) {
  const [users, setUsers] = useState([])
  const [conversations, setConversations] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const menuRef = useRef(null)

  // Safe theme fallback
  const colors = { ...DEFAULT_THEME_COLORS, ...(themeColors || {}) }
  const currentUserId = currentUser?.id

  // Close popup menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowThemeMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const formatSnippetTime = (isoString) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    const now = new Date()

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()

    if (isToday) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
    }

    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()

    if (isYesterday) return 'Yesterday'

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  // 1. Fetch users
  useEffect(() => {
    if (!currentUserId) return

    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', currentUserId)

      if (!error && data) {
        setUsers(data)
      }
    }

    fetchUsers()
  }, [currentUserId])

  // 2. Fetch latest messages & unread counts
  useEffect(() => {
    if (!currentUserId) return

    const fetchMetadata = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('created_at', { ascending: true })

      if (!error && data) {
        const convoMap = {}

        data.forEach((msg) => {
          const partnerId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id
          if (!convoMap[partnerId]) {
            convoMap[partnerId] = {
              lastMessage: '',
              lastMessageTime: '',
              unreadCount: 0,
            }
          }

          convoMap[partnerId].lastMessage = msg.message || (msg.media_url ? '📷 Attachment' : '')
          convoMap[partnerId].lastMessageTime = msg.created_at

          if (msg.receiver_id === currentUserId && !msg.is_read) {
            convoMap[partnerId].unreadCount += 1
          }
        })

        setConversations(convoMap)
      }
    }

    fetchMetadata()

    // 3. Realtime subscription
    const channel = supabase
      .channel('sidebar-messages-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new
          if (!msg) return

          const partnerId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id

          setConversations((prev) => {
            const currentConvo = prev[partnerId] || { unreadCount: 0 }
            const isIncomingUnread = msg.receiver_id === currentUserId && !msg.is_read

            return {
              ...prev,
              [partnerId]: {
                lastMessage: msg.message || (msg.media_url ? '📷 Attachment' : ''),
                lastMessageTime: msg.created_at,
                unreadCount: isIncomingUnread
                  ? currentConvo.unreadCount + 1
                  : (selectedUser?.id === partnerId ? 0 : currentConvo.unreadCount),
              },
            }
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, selectedUser])

  const handleSelectUser = (userItem) => {
    setConversations((prev) => ({
      ...prev,
      [userItem.id]: {
        ...(prev[userItem.id] || {}),
        unreadCount: 0,
      },
    }))
    onSelectUser(userItem)
  }

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const name = (u.username || u.email || '').toLowerCase()
      return name.includes(searchQuery.toLowerCase().trim())
    })
  }, [users, searchQuery])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: colors.sidebarBg || colors.bg,
        color: colors.text,
        userSelect: 'none',
      }}
    >
      {/* Sidebar Header */}
      <div style={{ padding: '20px 20px 12px 20px' }}>
        <h1
          style={{
            margin: '0 0 16px 0',
            fontSize: '22px',
            fontWeight: '700',
            color: colors.text,
            letterSpacing: '-0.4px',
          }}
        >
          Messages
        </h1>

        {/* Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '8px 12px',
            gap: '8px',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: colors.subtext }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search user..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: colors.text,
              fontSize: '13.5px',
              outline: 'none',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'none',
                border: 'none',
                color: colors.subtext,
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Users / Conversation List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {filteredUsers.length === 0 ? (
          <div
            style={{
              padding: '24px 12px',
              textAlign: 'center',
              color: colors.subtext,
              fontSize: '13px',
            }}
          >
            {searchQuery ? 'No users found' : 'No conversations yet'}
          </div>
        ) : (
          filteredUsers.map((u) => {
            const isSelected = selectedUser?.id === u.id
            const displayName = u.username || u.email.split('@')[0]
            const convoData = conversations[u.id] || {}
            const lastMsg = convoData.lastMessage
            const lastTime = formatSnippetTime(convoData.lastMessageTime)
            const unreads = convoData.unreadCount || 0

            return (
              <div
                key={u.id}
                onClick={() => handleSelectUser(u)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? colors.cardBg : 'transparent',
                  border: isSelected ? `1px solid ${colors.border}` : '1px solid transparent',
                  boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
                  transition: 'background-color 0.15s ease, border-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(128,128,128,0.06)'
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'linear-gradient(45deg, #f09433, #dc2743, #bc1888)',
                    padding: '2px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      backgroundColor: colors.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '15px',
                      fontWeight: '700',
                      color: colors.text,
                    }}
                  >
                    {displayName[0].toUpperCase()}
                  </div>
                </div>

                {/* Conversation Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: '2px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '14.5px',
                        fontWeight: unreads > 0 ? '700' : '600',
                        color: colors.text,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {displayName}
                    </span>
                    {lastTime && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: unreads > 0 ? colors.accent : colors.subtext,
                          fontWeight: unreads > 0 ? '600' : '400',
                          marginLeft: '6px',
                          flexShrink: 0,
                        }}
                      >
                        {lastTime}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '12.5px',
                        color: unreads > 0 ? colors.text : colors.subtext,
                        fontWeight: unreads > 0 ? '600' : '400',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {lastMsg || 'Tap to chat'}
                    </span>

                    {unreads > 0 && (
                      <span
                        style={{
                          backgroundColor: colors.accent,
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: '700',
                          borderRadius: '12px',
                          minWidth: '18px',
                          height: '18px',
                          padding: '0 5px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginLeft: '6px',
                          flexShrink: 0,
                        }}
                      >
                        {unreads}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Bottom Bar: Themes & Sign Out */}
      <div
        ref={menuRef}
        style={{
          padding: '12px 18px',
          borderTop: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          backgroundColor: colors.cardBg,
        }}
      >
        {/* Themes Button */}
        <button
          onClick={() => setShowThemeMenu((prev) => !prev)}
          style={{
            background: 'none',
            border: 'none',
            color: colors.text,
            cursor: 'pointer',
            fontSize: '13.5px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 8px',
            borderRadius: '8px',
          }}
        >
          <span>⚙️</span> Themes
        </button>

        {/* Direct Logout Button */}
        <button
          onClick={handleSignOut}
          style={{
            background: 'none',
            border: 'none',
            color: '#ef4444',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 8px',
            borderRadius: '8px',
          }}
          title="Sign out of your account"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>

        {/* Enhanced Theme Dropdown Menu */}
        {showThemeMenu && (
          <div
            style={{
              position: 'absolute',
              bottom: '56px',
              left: '16px',
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              borderRadius: '16px',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              minWidth: '160px',
              boxShadow: '0 10px 28px rgba(0,0,0,0.18)',
              zIndex: 100,
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: '700',
                color: colors.subtext,
                padding: '4px 8px 6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Select Theme
            </div>

            {THEME_OPTIONS.map((theme) => {
              const isCurrent = currentTheme === theme.id

              return (
                <button
                  key={theme.id}
                  onClick={() => {
                    onThemeChange(theme.id)
                    setShowThemeMenu(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isCurrent ? 'rgba(128,128,128,0.12)' : 'transparent',
                    border: 'none',
                    color: colors.text,
                    padding: '8px 10px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    fontWeight: isCurrent ? '600' : '400',
                    transition: 'background-color 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) e.currentTarget.style.backgroundColor = 'rgba(128,128,128,0.06)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        backgroundColor: theme.color,
                        border: `2px solid ${theme.border}`,
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    />
                    <span>{theme.label}</span>
                  </div>

                  {isCurrent && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}