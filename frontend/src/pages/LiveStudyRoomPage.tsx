import { useEffect, useState, useRef, useMemo } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, Presentation, ShieldAlert, Sparkles, Swords, MessageSquare, 
  Map, Copy, Check, Send, BrainCircuit, Activity, Crown
} from 'lucide-react'
import { GlowCard } from '@/components/ui/spotlight-card'
import { AnimatedGroup } from '@/components/ui/animated-group'
import ReactFlow, { Background, Controls, Node, Edge } from 'reactflow'
import 'reactflow/dist/style.css'
import { useAuthStore } from '../store/authStore'
import { generateQuiz } from '../lib/api'

// We will connect to the same url that hosts the socket.io server
const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'

interface Participant {
  id: string
  name: string
  isHost: boolean
  score: number
}

interface RoomState {
  mode: 'mindmap' | 'quiz' | 'discussion'
  document_id?: string
  isHost: boolean
  state: any
}

interface ChatMessage {
  sender: string
  message: string
  anchor?: string
  sid: string
}

export default function LiveStudyRoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const [searchParams] = useSearchParams()
  const documentId = searchParams.get('documentId') || undefined
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [userName, setUserName] = useState(user?.display_name || '')
  
  const [participants, setParticipants] = useState<Participant[]>([])
  const [roomMode, setRoomMode] = useState<'mindmap' | 'quiz' | 'discussion'>('mindmap')
  const [isHost, setIsHost] = useState(false)
  const [copied, setCopied] = useState(false)

  // Mindmap state
  const [mindmapNodes, setMindmapNodes] = useState<Node[]>([
    { id: '1', data: { label: 'Central Topic' }, position: { x: 400, y: 300 }, style: { background: 'linear-gradient(135deg,#0ea5e9,#7c3aed)', color: '#fff', border: 'none', borderRadius: 16, padding: '8px 16px', fontWeight: 700 } }
  ])
  const [mindmapEdges, setMindmapEdges] = useState<Edge[]>([])

  // Quiz state
  const [quizQuestion, setQuizQuestion] = useState<{ q: string, options: string[], answerIndex: number } | null>(null)
  const [myAnswer, setMyAnswer] = useState<number | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputMsg, setInputMsg] = useState('')
  const [anchorContext, setAnchorContext] = useState('')
  const chatBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const connectToRoom = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!userName.trim()) return

    const newSocket = io(SOCKET_URL, { transports: ['websocket'] })
    
    newSocket.on('connect', () => {
      setConnected(true)
      newSocket.emit('join_room', { room_id: roomId, user_name: userName, document_id: documentId })
    })

    newSocket.on('room_state', (data: RoomState) => {
      setHasJoined(true)
      setRoomMode(data.mode)
      setIsHost(data.isHost)
      if (data.mode === 'mindmap' && data.state?.nodes) {
        setMindmapNodes(data.state.nodes)
        setMindmapEdges(data.state.edges || [])
      }
      if (data.mode === 'quiz' && data.state?.current_question) {
        setQuizQuestion(data.state.current_question)
        setMyAnswer(null)
      }
    })

    newSocket.on('participants_update', (data: Participant[]) => {
      setParticipants(data)
    })

    newSocket.on('mode_changed', (mode: string) => {
      setRoomMode(mode as any)
      setMyAnswer(null)
      setQuizQuestion(null)
    })

    newSocket.on('mindmap_updated', (data: any) => {
      setMindmapNodes(data.nodes)
      setMindmapEdges(data.edges)
    })

    newSocket.on('new_question', (question: any) => {
      setQuizQuestion(question)
      setMyAnswer(null)
    })

    newSocket.on('leaderboard_update', (data: Participant[]) => {
      setParticipants(data)
    })

    newSocket.on('chat_received', (msg: ChatMessage) => {
      setChatMessages(prev => [...prev, msg])
    })

    newSocket.on('disconnect', () => {
      setConnected(false)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }

  // Effect to automatically reconnect if name is present
  useEffect(() => {
    if (!socket && user?.display_name) {
      connectToRoom()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const copyCode = () => {
    navigator.clipboard.writeText(roomId || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const changeMode = (mode: 'mindmap' | 'quiz' | 'discussion') => {
    if (!isHost || !socket) return
    socket.emit('change_mode', { room_id: roomId, mode })
    setRoomMode(mode)
  }

  const addMindmapNode = () => {
    if (!isHost || !socket) return
    const id = (mindmapNodes.length + 1).toString()
    const angle = Math.random() * Math.PI * 2
    const r = 150 + Math.random() * 100
    const newNode: Node = {
      id,
      data: { label: `New Idea ${id}` },
      position: { x: 400 + r * Math.cos(angle), y: 300 + r * Math.sin(angle) },
      style: { background: 'rgba(14,165,233,0.15)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 12, padding: '6px 12px', fontWeight: 600 }
    }
    const newNodes = [...mindmapNodes, newNode]
    const newEdges = [...mindmapEdges, { id: `e1-${id}`, source: '1', target: id, animated: true, style: { stroke: 'rgba(14,165,233,0.4)', strokeWidth: 2 } }]
    
    setMindmapNodes(newNodes)
    setMindmapEdges(newEdges)
    socket.emit('sync_mindmap', { room_id: roomId, nodes: newNodes, edges: newEdges })
  }

  const broadcastQuestion = async () => {
    if (!isHost || !socket) return
    setQuizLoading(true)
    try {
      // In a real app we'd fetch from actual document. For demo, we use a fun dummy question if document API fails
      // We will try to fetch if we have documentId
      let qStr = "What is the primary function of mitochondria?"
      let options = ["Energy production", "Protein synthesis", "DNA storage", "Waste removal"]
      let ans = 0

      if (documentId) {
        try {
          const res = await generateQuiz({ document_id: documentId, count: 1, difficulty: 'medium' })
          const q = res.data.questions[0]
          qStr = q.question
          options = q.options
          ans = q.correct_option_index
        } catch (e) {
          console.log("Fallback to dummy q")
        }
      }

      const qObj = { q: qStr, options, answerIndex: ans }
      
      setQuizQuestion(qObj)
      setMyAnswer(null)
      socket.emit('quiz_question', { room_id: roomId, question: qObj })
    } finally {
      setQuizLoading(false)
    }
  }

  const submitAnswer = (idx: number) => {
    if (!socket || myAnswer !== null || !quizQuestion) return
    setMyAnswer(idx)
    const isCorrect = idx === quizQuestion.answerIndex
    socket.emit('submit_answer', { room_id: roomId, answer: idx, is_correct: isCorrect })
  }

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMsg.trim() || !socket) return
    socket.emit('send_chat', { room_id: roomId, message: inputMsg.trim(), anchor: anchorContext })
    setInputMsg('')
    setAnchorContext('')
  }

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <GlowCard className="max-w-md w-full">
          <div className="glass-card p-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-orange-600/20 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-center mb-2">Join Study Room</h1>
            <p className="text-center text-muted-foreground text-sm mb-6">
              You are invited to room <span className="font-mono text-emerald-400 font-bold">{roomId}</span>
            </p>
            
            <form onSubmit={connectToRoom} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground ml-1 mb-1 block">Your Name</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  className="input-field w-full text-center text-lg placeholder:text-muted-foreground/30"
                  placeholder="Enter your name to join"
                />
              </div>
              <button type="submit" className="btn-primary w-full shadow-[0_0_20px_rgba(14,165,233,0.3)]">
                <Sparkles className="w-4 h-4" /> Enter Room
              </button>
            </form>
          </div>
        </GlowCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden text-foreground">
      {/* HEADER */}
      <header className="h-16 border-b border-border/50 backdrop-blur-xl flex items-center justify-between px-6 flex-shrink-0 z-50 relative bg-background/50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(14,165,233,0.4)]">
              <Activity className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-wide">LIVE ROOM</span>
              <div className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`} />
                <span className="text-muted-foreground font-mono">{roomId}</span>
                <button onClick={copyCode} className="text-muted-foreground hover:text-white transition-colors">
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          <div className="hidden md:flex bg-muted/30 p-1 rounded-xl border border-border/50">
            {[
              { id: 'mindmap', icon: Map, label: 'Mind Map' },
              { id: 'quiz', icon: Swords, label: 'Quiz Battle' },
              { id: 'discussion', icon: MessageSquare, label: 'Discussion' }
            ].map(m => (
              <button 
                key={m.id}
                onClick={() => changeMode(m.id as any)}
                disabled={!isHost}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  roomMode === m.id 
                    ? 'bg-card text-emerald-400 shadow-[0_4px_12px_rgba(14,165,233,0.1)] border border-emerald-500/20' 
                    : 'text-muted-foreground hover:text-white disabled:opacity-50 disabled:hover:text-muted-foreground'
                }`}
              >
                <m.icon className={`w-4 h-4 ${roomMode === m.id ? 'text-emerald-400' : ''}`} />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => navigate(-1)} className="btn-ghost text-xs px-4 border border-border text-muted-foreground hover:text-white">
          Leave Room
        </button>
      </header>

      {/* MAIN CONTENT DIVIDER */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* SIDEBAR - PARTICIPANTS & LEADERBOARD */}
        <aside className="w-64 border-r border-border/50 bg-card/10 flex flex-col z-40 backdrop-blur-md">
          <div className="p-4 border-b border-border/30 bg-muted/10">
            <h3 className="font-semibold text-sm flex items-center gap-2 tracking-wide">
              <Users className="w-4 h-4 text-emerald-400" /> Participants ({participants.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <AnimatePresence>
              {participants.map((p, i) => (
                <motion.div 
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${p.id === socket?.id ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-muted/20 border-transparent hover:border-border/50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${p.isHost ? 'bg-amber-500/20 text-amber-500' : 'bg-muted text-muted-foreground'}`}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium max-w-[90px] truncate">
                        {p.name} {p.id === socket?.id && '(You)'}
                      </span>
                      {p.isHost && <span className="text-[10px] text-amber-500 flex items-center gap-1"><Crown className="w-3 h-3" /> Host</span>}
                    </div>
                  </div>
                  {roomMode === 'quiz' && (
                    <div className="text-sm font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {p.score}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </aside>

        {/* WORKSPACE AREA */}
        <main className="flex-1 relative overflow-hidden bg-dot-pattern bg-[length:20px_20px] flex items-center justify-center">
          <AnimatePresence mode="wait">

            {/* MINDMAP MODE */}
            {roomMode === 'mindmap' && (
              <motion.div key="mindmap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                <ReactFlow nodes={mindmapNodes} edges={mindmapEdges} fitView>
                  <Background color="rgba(255,255,255,0.05)" gap={30} />
                  <Controls className="!bg-card !border-border" />
                </ReactFlow>
                {isHost && (
                  <div className="absolute bottom-6 inset-x-0 mx-auto w-max z-50">
                    <button onClick={addMindmapNode} className="btn-primary shadow-[0_0_20px_rgba(14,165,233,0.4)]">
                      <Sparkles className="w-4 h-4" /> Expand Concept Branch
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* QUIZ BATTLE MODE */}
            {roomMode === 'quiz' && (
              <motion.div key="quiz" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full max-w-4xl p-6">
                {!quizQuestion ? (
                  <div className="text-center p-12 bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl">
                    <Swords className="w-16 h-16 text-indigo-400 mx-auto mb-4 opacity-80" />
                    <h2 className="text-3xl font-bold mb-3 tracking-tight">Quiz Battle</h2>
                    <p className="text-muted-foreground mb-8">Waiting for the host to launch the next question...</p>
                    {isHost && (
                      <button onClick={broadcastQuestion} disabled={quizLoading} className="btn-primary px-8 py-3 text-lg h-14 shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                        {quizLoading ? 'Generating...' : 'Launch Next Question'} <Presentation className="w-5 h-5 ml-2" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <GlowCard className="p-8 glass-card border-[rgba(99,102,241,0.3)] shadow-[0_0_50px_rgba(99,102,241,0.1)] relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10 blur-xl">
                        <BrainCircuit className="w-32 h-32 text-indigo-500" />
                      </div>
                      <h2 className="text-2xl font-bold leading-relaxed relative z-10">{quizQuestion.q}</h2>
                    </GlowCard>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {quizQuestion.options?.map((opt, i) => {
                        const isSelected = myAnswer === i
                        const isCorrect = isSelected && i === quizQuestion.answerIndex
                        const isWrong = isSelected && i !== quizQuestion.answerIndex
                        
                        return (
                          <motion.button
                            key={i}
                            whileHover={myAnswer === null ? { scale: 1.02 } : {}}
                            whileTap={myAnswer === null ? { scale: 0.98 } : {}}
                            onClick={() => submitAnswer(i)}
                            disabled={myAnswer !== null}
                            className={`p-5 rounded-2xl border-2 text-left font-medium transition-all text-lg group relative overflow-hidden ${
                              myAnswer === null 
                                ? 'bg-card/40 hover:bg-card border-border/50 hover:border-emerald-500/50'
                                : isCorrect 
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-100'
                                  : isWrong 
                                    ? 'bg-red-500/20 border-red-500 text-red-100'
                                    : i === quizQuestion.answerIndex
                                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                                      : 'bg-card/20 border-border/30 opacity-50'
                            }`}
                          >
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg mr-4 font-bold text-sm ${myAnswer === null ? 'bg-muted text-muted-foreground group-hover:bg-emerald-500/20 group-hover:text-emerald-400' : 'bg-background/30'}`}>
                              {['A', 'B', 'C', 'D'][i]}
                            </span>
                            {opt}
                          </motion.button>
                        )
                      })}
                    </div>
                    {isHost && myAnswer !== null && (
                      <div className="flex justify-center mt-8">
                        <button onClick={broadcastQuestion} className="btn-primary text-sm shadow-[0_0_20px_rgba(99,102,241,0.4)]">Next Question</button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* DISCUSSION MODE */}
            {roomMode === 'discussion' && (
              <motion.div key="discussion" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-4 bg-card/60 rounded-3xl border border-border/50 flex flex-col overflow-hidden backdrop-blur-xl shadow-2xl">
                <div className="p-5 border-b border-border/50 bg-muted/10 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold flex items-center gap-2"><MessageSquare className="w-5 h-5 text-indigo-400" /> Active Discussion</h2>
                    <p className="text-xs text-muted-foreground mt-1">Connect chat messages to specific document points</p>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50">
                      <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
                      <p>Start the discussion...</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, i) => {
                      const isMe = msg.sid === socket?.id
                      return (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <span className="text-[11px] text-muted-foreground mb-1 ml-1">{msg.sender}</span>
                          <div className={`max-w-[70%] p-4 rounded-2xl ${isMe ? 'bg-gradient-to-br from-indigo-500 to-orange-600 text-white rounded-br-sm shadow-[0_5px_20px_rgba(99,102,241,0.2)]' : 'bg-muted/80 backdrop-blur-sm text-foreground rounded-bl-sm border border-border/50'}`}>
                            {msg.anchor && (
                              <div className="mb-2 text-[10px] font-mono bg-black/20 text-emerald-200 px-2 py-1 rounded inline-flex items-center gap-1 border border-white/10">
                                <ShieldAlert className="w-3 h-3" /> Ref: {msg.anchor}
                              </div>
                            )}
                            <p className="text-sm leading-relaxed">{msg.message}</p>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                  <div ref={chatBottomRef} />
                </div>

                <div className="p-4 border-t border-border/50 bg-background/50 backdrop-blur-md">
                  <form onSubmit={sendChat} className="flex flex-col gap-2 relative">
                    <input 
                      type="text" 
                      value={anchorContext}
                      onChange={e => setAnchorContext(e.target.value)}
                      placeholder="Optional anchor (e.g., 'Page 2, Paras 3')" 
                      className="input-field py-1.5 text-xs font-mono w-full bg-muted/30 border-transparent focus:bg-card"
                    />
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={inputMsg}
                        onChange={e => setInputMsg(e.target.value)}
                        placeholder="Type a message..." 
                        className="input-field flex-1 bg-card border-border/50"
                      />
                      <button type="submit" disabled={!inputMsg.trim()} className="btn-primary w-12 flex-shrink-0 !p-0 flex items-center justify-center">
                        <Send className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
