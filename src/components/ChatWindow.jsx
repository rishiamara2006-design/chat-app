import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import CallModal from './CallModal'

function StatusCheckmarks({ isRead, accentColor, subtextColor }) {
  if (isRead) {
    return (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke={accentColor}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0 }}
      >
        <path d="M18 6L7 17l-5-5" />
        <path d="M22 10l-7.5 7.5-1.5-1.5" />
      </svg>
    )
  }

  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke={subtextColor}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function MessageItem({
  message,
  isMine,
  themeColors,
  formatTime,
  isFirstInGroup,
  isLastInGroup,
  otherUser,
}) {
  const [isHovered, setIsHovered] = useState(false)
  const time = formatTime(message.created_at)
  const otherInitial = (otherUser?.username || otherUser?.email || '?')[0].toUpperCase()

  const getBorderRadius = () => {
    if (isMine) {
      return `${isFirstInGroup ? '20px' : '6px'} 20px ${isLastInGroup ? '4px' : '6px'} 20px`
    }
    return `20px ${isFirstInGroup ? '20px' : '6px'} 20px ${isLastInGroup ? '4px' : '6px'}`
  }

  const isImage =
    message.media_type?.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|gif)$/i.test(message.media_url || '')

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: isMine ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
        gap: '8px',
        width: '100%',
        marginTop: isFirstInGroup ? '8px' : '2px',
        position: 'relative',
        zIndex: 2,
      }}
    >
      {!isMine && (
        <div style={{ width: '28px', height: '28px', flexShrink: 0 }}>
          {isLastInGroup && (
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #f09433, #dc2743, #bc1888)',
                padding: '1.5px',
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
                  backgroundColor: themeColors.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: themeColors.text,
                }}
              >
                {otherInitial}
              </div>
            </div>
          )}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isMine ? 'flex-end' : 'flex-start',
          maxWidth: '68%',
        }}
      >
        <div
          style={{
            padding: message.media_url ? '6px' : '10px 16px',
            borderRadius: getBorderRadius(),
            background: isMine ? themeColors.bubbleMine : themeColors.bubbleOther,
            color: isMine ? '#ffffff' : themeColors.text,
            fontSize: '14.5px',
            lineHeight: '1.45',
            wordBreak: 'break-word',
            border: isMine ? '1px solid rgba(255,255,255,0.15)' : `1px solid ${themeColors.border}`,
            boxShadow: isMine
              ? '0 4px 12px rgba(0,0,0,0.12)'
              : '0 2px 8px rgba(0,0,0,0.04)',
            cursor: 'default',
            transition: 'transform 0.1s ease',
          }}
        >
          {message.media_url && (
            <div style={{ marginBottom: message.message ? '6px' : '0' }}>
              {isImage ? (
                <img
                  src={message.media_url}
                  alt="Attachment"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '280px',
                    borderRadius: '16px',
                    objectFit: 'cover',
                    display: 'block',
                    cursor: 'pointer',
                  }}
                  onClick={() => window.open(message.media_url, '_blank')}
                />
              ) : (
                <a
                  href={message.media_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(0,0,0,0.12)',
                    borderRadius: '12px',
                    color: isMine ? '#ffffff' : themeColors.text,
                    textDecoration: 'none',
                    fontSize: '13px',
                  }}
                >
                  📎 <span>Download Attachment</span>
                </a>
              )}
            </div>
          )}

          {message.message && (
            <div style={{ padding: message.media_url ? '4px 8px 4px' : '0' }}>
              {message.message}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '3px',
            padding: '0 6px',
            opacity: isHovered ? 0.9 : 0,
            maxHeight: isHovered ? '16px' : '0px',
            transition: 'opacity 0.2s ease, max-height 0.2s ease',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              fontWeight: '500',
              color: themeColors.subtext,
            }}
          >
            {time}
          </span>

          {isMine && (
            <StatusCheckmarks
              isRead={message.is_read}
              accentColor={themeColors.accent}
              subtextColor={themeColors.subtext}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default function ChatWindow({
  user,
  otherUser,
  onBack,
  themeColors = {
    bg: '#000000',
    border: '#27272a',
    cardBg: '#18181b',
    text: '#ffffff',
    subtext: '#a1a1aa',
    bubbleMine: 'linear-gradient(135deg, #7000ff, #bd00ff)',
    bubbleOther: '#1f1f23',
    accent: '#0095f6',
    avatar: 'https://i.postimg.cc/CK5WqKJS/download-(1).jpg',
  },
}) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [isOnline, setIsOnline] = useState(false)
  const [isOtherTyping, setIsOtherTyping] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeCall, setActiveCall] = useState(null)

  const endRef = useRef(null)
  const channelRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const incomingTypingTimeoutRef = useRef(null)

  const currentUserId = user?.id

  const formatTime = (isoString) => {
    if (!isoString) return ''
    const d = new Date(isoString)
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  useEffect(() => {
    if (!currentUserId || !otherUser) return
    setMessages([])
    setIsOtherTyping(false)

    supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', otherUser.id)
      .eq('receiver_id', currentUserId)
      .eq('is_read', false)
      .then()

    supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUser.id}),and(sender_id.eq.${otherUser.id},receiver_id.eq.${currentUserId})`
      )
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error) setMessages(data || [])
      })

    const channelName = `chat-${[currentUserId, otherUser.id].sort().join('-')}`
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true, self: false },
        presence: { key: currentUserId },
      },
    })

    channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const m = payload.new
          const isRelevant =
            (m.sender_id === currentUserId && m.receiver_id === otherUser.id) ||
            (m.sender_id === otherUser.id && m.receiver_id === currentUserId)

          if (isRelevant) {
            setMessages((prev) =>
              prev.some((msg) => msg.id === m.id) ? prev : [...prev, m]
            )

            if (m.sender_id === otherUser.id) {
              setIsOtherTyping(false)
              await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', m.id)
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const updated = payload.new
          if (updated) {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === updated.id ? { ...msg, ...updated } : msg))
            )
          }
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.userId === otherUser.id) {
          setIsOtherTyping(Boolean(payload.isTyping))
          if (incomingTypingTimeoutRef.current) clearTimeout(incomingTypingTimeoutRef.current)
          if (payload.isTyping) {
            incomingTypingTimeoutRef.current = setTimeout(() => {
              setIsOtherTyping(false)
            }, 3000)
          }
        }
      })
      .on('broadcast', { event: 'call-offer' }, ({ payload }) => {
        if (payload?.to === currentUserId && payload?.offer) {
          setActiveCall({
            isIncoming: true,
            offer: payload.offer,
          })
        }
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, otherUser])

  useEffect(() => {
    if (!otherUser || !currentUserId) return

    const channel = supabase.channel('online-users', {
      config: { presence: { key: currentUserId } },
    })

    const update = () => {
      const state = channel.presenceState()
      setIsOnline(Boolean(state[otherUser.id]))
    }

    channel
      .on('presence', { event: 'sync' }, update)
      .on('presence', { event: 'join' }, update)
      .on('presence', { event: 'leave' }, update)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [otherUser, currentUserId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOtherTyping])

  const sendTypingStatus = (isTyping) => {
    if (!channelRef.current) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUserId, isTyping },
    })
  }

  const handleInputChange = (e) => {
    setText(e.target.value)
    sendTypingStatus(true)

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false)
    }, 1500)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const filePath = `${currentUserId}/${Date.now()}.${fileExt}`

    try {
      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath)

      await supabase.from('messages').insert({
        sender_id: currentUserId,
        receiver_id: otherUser.id,
        message: text.trim() || '',
        media_url: data.publicUrl,
        media_type: file.type,
        is_read: false,
      })

      setText('')
    } catch (err) {
      console.error(err)
      alert('Failed to upload file.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    sendTypingStatus(false)

    setText('')

    const { error } = await supabase.from('messages').insert({
      sender_id: currentUserId,
      receiver_id: otherUser.id,
      message: trimmed,
      is_read: false,
    })

    if (error) {
      setText(trimmed)
      alert('Failed to send message.')
    }
  }

  const otherName = otherUser.username || otherUser.email.split('@')[0]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: themeColors.bg,
        color: themeColors.text,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          borderBottom: `1px solid ${themeColors.border}`,
          backgroundColor: themeColors.cardBg,
          backdropFilter: 'blur(12px)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: themeColors.text,
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
            }}
            title="Back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #f09433, #dc2743, #bc1888)',
              padding: '2px',
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
                backgroundColor: themeColors.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px',
                fontWeight: '700',
                color: themeColors.text,
              }}
            >
              {otherName[0].toUpperCase()}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: themeColors.text }}>
              {otherName}
            </div>
            <div style={{ fontSize: '11.5px', color: isOnline ? '#22c55e' : themeColors.subtext, marginTop: '1px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isOnline ? '#22c55e' : themeColors.subtext }} />
              {isOnline ? 'Active now' : 'Offline'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setActiveCall({ isIncoming: false, offer: null })}
            style={{
              background: 'none',
              border: `1px solid ${themeColors.border}`,
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: themeColors.text,
              cursor: 'pointer',
            }}
            title="Start Voice Call"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>

          <img
            key={themeColors.avatar}
            src={themeColors.avatar || 'https://i.postimg.cc/CK5WqKJS/download-(1).jpg'}
            alt="Theme Mascot"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            style={{
              width: '42px',
              height: '42px',
              minWidth: '42px',
              minHeight: '42px',
              objectFit: 'cover',
              borderRadius: '50%',
              border: `2px solid ${themeColors.border}`,
              display: 'block',
            }}
          />
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '780px',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
          }}
        >
          {messages.map((m, index) => {
            const isMine = m.sender_id === currentUserId
            const prevMessage = messages[index - 1]
            const nextMessage = messages[index + 1]

            const isFirstInGroup = !prevMessage || prevMessage.sender_id !== m.sender_id
            const isLastInGroup = !nextMessage || nextMessage.sender_id !== m.sender_id

            return (
              <MessageItem
                key={m.id}
                message={m}
                isMine={isMine}
                isFirstInGroup={isFirstInGroup}
                isLastInGroup={isLastInGroup}
                otherUser={otherUser}
                themeColors={themeColors}
                formatTime={formatTime}
              />
            )
          })}
          <div ref={endRef} />
        </div>
      </div>

      <div
        style={{
          padding: '12px 24px 20px',
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          zIndex: 10,
        }}
      >
        <form
          onSubmit={sendMessage}
          style={{
            width: '100%',
            maxWidth: '780px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: themeColors.cardBg,
            border: `1px solid ${themeColors.border}`,
            borderRadius: '35px',
            padding: '6px 12px',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          }}
        >
          <label
            style={{
              background: 'none',
              border: 'none',
              color: uploading ? themeColors.accent : themeColors.subtext,
              cursor: uploading ? 'wait' : 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              margin: 0,
            }}
          >
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              style={{ display: 'none' }}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            />
            📎
          </label>

          <input
            value={text}
            onChange={handleInputChange}
            placeholder={uploading ? 'Uploading attachment...' : `Message ${otherName}...`}
            disabled={uploading}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              color: themeColors.text,
              fontSize: '14.5px',
              padding: '8px 4px',
              outline: 'none',
            }}
          />

          <button
            type="submit"
            disabled={!text.trim() || uploading}
            style={{
              background: text.trim() ? themeColors.accent : 'transparent',
              border: 'none',
              color: text.trim() ? '#ffffff' : themeColors.subtext,
              fontWeight: '600',
              fontSize: '13.5px',
              cursor: text.trim() ? 'pointer' : 'default',
              padding: '8px 18px',
              borderRadius: '24px',
            }}
          >
            Send
          </button>
        </form>
      </div>

      {activeCall && (
        <CallModal
          currentUserId={currentUserId}
          otherUser={otherUser}
          channel={channelRef.current}
          isIncoming={activeCall.isIncoming}
          incomingOffer={activeCall.offer}
          onClose={() => setActiveCall(null)}
          themeColors={themeColors}
        />
      )}
    </div>
  )
}