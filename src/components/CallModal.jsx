import { useEffect, useRef, useState, useCallback } from 'react'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun.services.mozilla.com' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
}

export default function CallModal({
  currentUserId,
  otherUser,
  channel,
  isIncoming,
  incomingOffer,
  onClose,
  themeColors,
}) {
  const [callStatus, setCallStatus] = useState(isIncoming ? 'ringing' : 'calling')
  const [isMuted, setIsMuted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)

  const remoteAudioRef = useRef(null)
  const peerConnection = useRef(null)
  const localStream = useRef(null)
  const timerRef = useRef(null)
  const isTerminatedRef = useRef(false)
  const iceCandidateQueue = useRef([])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const endCall = useCallback((notify = true) => {
    if (isTerminatedRef.current) return
    isTerminatedRef.current = true

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (notify && channel) {
      try {
        channel.send({
          type: 'broadcast',
          event: 'call-end',
          payload: { to: otherUser?.id, from: currentUserId },
        })
      } catch (_) {}
    }

    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => {
        try {
          track.stop()
          track.enabled = false
        } catch (_) {}
      })
      localStream.current = null
    }

    if (peerConnection.current) {
      try {
        peerConnection.current.ontrack = null
        peerConnection.current.onicecandidate = null
        peerConnection.current.close()
      } catch (_) {}
      peerConnection.current = null
    }

    if (remoteAudioRef.current) {
      try {
        remoteAudioRef.current.pause()
        remoteAudioRef.current.srcObject = null
      } catch (_) {}
    }

    iceCandidateQueue.current = []
    onClose()
  }, [channel, currentUserId, otherUser?.id, onClose])

  const toggleMute = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!localStream.current) return
    const tracks = localStream.current.getAudioTracks()
    if (tracks && tracks.length > 0) {
      const nextState = !tracks[0].enabled
      tracks.forEach((t) => {
        t.enabled = nextState
      })
      setIsMuted(!nextState)
    }
  }

  const handleHangup = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    endCall(true)
  }

  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [callStatus])

  const getMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      })
      localStream.current = stream
      return stream
    } catch (err) {
      console.warn('Microphone error:', err)
      endCall(false)
      throw err
    }
  }

  const initPeerConnection = () => {
    if (peerConnection.current) return peerConnection.current

    const pc = new RTCPeerConnection(ICE_SERVERS)

    pc.ontrack = (event) => {
      if (remoteAudioRef.current && event.streams[0]) {
        remoteAudioRef.current.srcObject = event.streams[0]
        remoteAudioRef.current.muted = false
        const playPromise = remoteAudioRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            const unlock = () => {
              remoteAudioRef.current?.play()
              document.removeEventListener('touchstart', unlock)
            }
            document.addEventListener('touchstart', unlock, { once: true })
          })
        }
      }
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && channel) {
        channel.send({
          type: 'broadcast',
          event: 'call-ice',
          payload: { to: otherUser?.id, candidate: event.candidate },
        })
      }
    }

    peerConnection.current = pc
    return pc
  }

  const startOutgoingCall = async () => {
    try {
      const stream = await getMedia()
      const pc = initPeerConnection()

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream)
      })

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      })
      await pc.setLocalDescription(offer)

      channel?.send({
        type: 'broadcast',
        event: 'call-offer',
        payload: {
          to: otherUser?.id,
          from: currentUserId,
          offer,
        },
      })
    } catch (err) {
      endCall(false)
    }
  }

  // Answer handler with candidate queue flushing
  const acceptCall = async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.play().catch(() => {})
    }

    try {
      const stream = await getMedia()
      const pc = initPeerConnection()

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream)
      })

      await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer))

      // Process all buffered ICE candidates received while ringing
      while (iceCandidateQueue.current.length > 0) {
        const candidate = iceCandidateQueue.current.shift()
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (_) {}
      }

      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      channel?.send({
        type: 'broadcast',
        event: 'call-answer',
        payload: { to: otherUser?.id, answer },
      })

      setCallStatus('connected')
    } catch (err) {
      console.error('Failed to answer call:', err)
      endCall(false)
    }
  }

  // Signaling setup
  useEffect(() => {
    if (!channel) return

    const onAnswer = async ({ payload }) => {
      if (payload?.to === currentUserId && peerConnection.current) {
        try {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.answer))
          setCallStatus('connected')
        } catch (_) {}
      }
    }

    const onIce = async ({ payload }) => {
      if (payload?.to === currentUserId && payload.candidate) {
        if (peerConnection.current && peerConnection.current.remoteDescription) {
          try {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(payload.candidate))
          } catch (_) {}
        } else {
          // Queue candidates arriving before the answer/offer is set
          iceCandidateQueue.current.push(payload.candidate)
        }
      }
    }

    const onEnd = ({ payload }) => {
      if (payload?.to === currentUserId) {
        endCall(false)
      }
    }

    channel.on('broadcast', { event: 'call-answer' }, onAnswer)
    channel.on('broadcast', { event: 'call-ice' }, onIce)
    channel.on('broadcast', { event: 'call-end' }, onEnd)

    if (!isIncoming) {
      startOutgoingCall()
    }

    return () => {
      endCall(false)
    }
  }, [channel, currentUserId, isIncoming, endCall])

  const otherName = otherUser?.username || otherUser?.email?.split('@')[0] || 'User'

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(5, 5, 8, 0.96)',
        backdropFilter: 'blur(20px)',
        zIndex: 9999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
        touchAction: 'manipulation',
      }}
    >
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '24px',
          maxWidth: '320px',
          width: '100%',
        }}
      >
        <div
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(45deg, #f09433, #dc2743, #bc1888)',
            padding: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              backgroundColor: '#0c0d12',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '34px',
              fontWeight: '800',
              color: '#ffffff',
            }}
          >
            {otherName[0].toUpperCase()}
          </div>
        </div>

        <div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: '700', color: '#ffffff' }}>
            {otherName}
          </h2>
          <p style={{ margin: 0, fontSize: '14.5px', color: themeColors?.subtext || '#a1a1aa' }}>
            {callStatus === 'ringing'
              ? 'Incoming call...'
              : callStatus === 'calling'
              ? 'Calling...'
              : `Connected • ${formatTime(callDuration)}`}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '28px',
            marginTop: '16px',
            width: '100%',
          }}
        >
          {callStatus === 'ringing' ? (
            <>
              {/* Accept */}
              <button
                type="button"
                onClick={acceptCall}
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '26px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(34, 197, 94, 0.45)',
                  outline: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                📞
              </button>

              {/* Decline */}
              <button
                type="button"
                onClick={handleHangup}
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '26px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(239, 68, 68, 0.45)',
                  outline: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                ✕
              </button>
            </>
          ) : (
            <>
              {/* Mute */}
              <button
                type="button"
                onClick={toggleMute}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: isMuted ? '#ef4444' : 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  outline: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {isMuted ? '🔇' : '🎤'}
              </button>

              {/* Hangup */}
              <button
                type="button"
                onClick={handleHangup}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '22px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(239, 68, 68, 0.45)',
                  outline: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                📞
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}