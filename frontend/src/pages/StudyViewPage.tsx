import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Sparkles, BookOpen, Brain, MessageSquare, Map,
  Languages, Zap, Download, Share2, ChevronLeft, Loader2,
  Copy, Check, Globe, RotateCcw, Trash2, Mic, MicOff, Volume2, AudioLines, Eye, ChevronDown, ChevronUp, CheckCircle, XCircle
} from 'lucide-react'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { GlowCard } from '@/components/ui/spotlight-card'
import ReactFlow, { Background, Controls, Node, Edge } from 'reactflow'
import 'reactflow/dist/style.css'
import { 
  getDocument, generateSummary, generateKeyPoints, generateFlashcards,
  generateELI5, translateContent, chatWithDocument, generateMindMap,
  generateQuiz, createShareLink, toggleBookmark, exportQuizCSV, deleteDocument, analyzeDiagrams
} from '../lib/api'
import { Document, KeyPoint, Flashcard, ChatMessage, DiagramAnalysis } from '../types'

// Sub-components defined inline for brevity

function SummaryTab({ docId, initialSummary, initialEli5, onUpdate }: { docId: string, initialSummary: string, initialEli5: string, onUpdate: (data: Partial<Document>) => void }) {
  const [summary, setSummary] = useState(initialSummary)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [eli5, setEli5] = useState(initialEli5)
  const [eli5Loading, setEli5Loading] = useState(false)
  const [translation, setTranslation] = useState('')
  const [transLang, setTransLang] = useState('Spanish')
  const [transLoading, setTransLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await generateSummary(docId)
      const text = res.data.summary
      setSummary(text)
      onUpdate({ summary: text })
    } catch(e: any) {
      alert(e.response?.data?.detail || 'Failed to generate summary')
    } finally { setLoading(false) }
  }

  const handleELI5 = async () => {
    setEli5Loading(true)
    try {
      const res = await generateELI5(docId)
      const explanation = res.data.explanation
      setEli5(explanation)
      // Note: Backend doesn't persist ELI5 in DB, but we keep it in parent state for session persistence
      onUpdate({ eli5: explanation } as any) 
    } catch(e: any) {
      alert(e.response?.data?.detail || 'Failed')
    } finally { setEli5Loading(false) }
  }

  const handleTranslate = async () => {
    if (!summary) { alert('Generate summary first'); return }
    setTransLoading(true)
    try {
      const res = await translateContent(docId, transLang, 'summary')
      setTranslation(res.data.translated_content)
    } catch(e: any) {
      alert(e.response?.data?.detail || 'Translation failed')
    } finally { setTransLoading(false) }
  }

  const copy = () => {
    navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-5">
      {!summary ? (
        <GlowCard>
          <div className="glass-card p-10 text-center">
            <Sparkles className="w-10 h-10 text-emerald-400 mx-auto mb-3 opacity-60" />
            <p className="text-muted-foreground mb-4 text-sm">No summary generated yet</p>
            <button onClick={generate} disabled={loading} className="btn-primary">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Summary</>}
            </button>
          </div>
        </GlowCard>
      ) : (
        <div className="space-y-4">
          <GlowCard>
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">AI Summary</h3>
              <div className="flex gap-2">
                <button onClick={copy} className="btn-ghost text-xs px-2 py-1">
                  {copied ? <><Check className="w-3 h-3 text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                </button>
                <button onClick={generate} disabled={loading} className="btn-ghost text-xs px-2 py-1">
                  <RotateCcw className="w-3 h-3" /> Regenerate
                </button>
              </div>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{summary}</p>
            <p className="text-xs text-muted-foreground mt-3">{summary.split(' ').length} words</p>
          </div>
          </GlowCard>

          {/* ELI5 */}
          <GlowCard>
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="font-medium text-sm">ELI5 Mode</h3>
              </div>
              <button onClick={handleELI5} disabled={eli5Loading} className="btn-ghost text-xs px-2 py-1">
                {eli5Loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Explain Simply'}
              </button>
            </div>
            {eli5 && <p className="text-sm text-foreground leading-relaxed">{eli5}</p>}
          </div>
          </GlowCard>

          {/* Translation */}
          <GlowCard>
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-amber-400" />
              <h3 className="font-medium text-sm">Translate</h3>
            </div>
            <div className="flex gap-2">
              <select
                className="input-field flex-1"
                value={transLang}
                onChange={(e) => setTransLang(e.target.value)}
              >
                {['Spanish', 'French', 'German', 'Hindi', 'Tamil', 'Japanese', 'Chinese', 'Arabic', 'Portuguese', 'Russian'].map(l => (
                  <option key={l}>{l}</option>
                ))}
              </select>
              <button onClick={handleTranslate} disabled={transLoading} className="btn-secondary whitespace-nowrap">
                {transLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Languages className="w-4 h-4" /> Translate</>}
              </button>
            </div>
            {translation && <div className="mt-3 p-4 bg-muted/40 rounded-xl text-sm leading-relaxed">{translation}</div>}
          </div>
          </GlowCard>
        </div>
      )}
    </div>
  )
}

function KeyPointsTab({ docId, initialPoints, onUpdate }: { docId: string, initialPoints: KeyPoint[], onUpdate: (kp: KeyPoint[]) => void }) {
  const [keyPoints, setKeyPoints] = useState<KeyPoint[]>(initialPoints)
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await generateKeyPoints(docId)
      const points = res.data.key_points
      setKeyPoints(points)
      onUpdate(points)
    } catch(e: any) {
      alert(e.response?.data?.detail || 'Failed')
    } finally { setLoading(false) }
  }

  const handleBookmark = async (i: number) => {
    const updated = [...keyPoints]
    updated[i] = { ...updated[i], bookmarked: !updated[i].bookmarked }
    setKeyPoints(updated)
    onUpdate(updated)
    await toggleBookmark(docId, i, updated[i].bookmarked!)
  }

  const impClasses: Record<string, string> = {
    high: 'importance-high',
    medium: 'importance-medium',
    low: 'importance-low',
  }

  return (
    <div className="space-y-3">
      {keyPoints.length === 0 ? (
        <GlowCard>
          <div className="glass-card p-10 text-center">
            <BookOpen className="w-10 h-10 text-amber-400 mx-auto mb-3 opacity-60" />
            <p className="text-muted-foreground mb-4 text-sm">No key points extracted yet</p>
            <button onClick={generate} disabled={loading} className="btn-primary">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Extracting...</> : <><BookOpen className="w-4 h-4" /> Extract Key Points</>}
            </button>
          </div>
        </GlowCard>
      ) : (
        <>
          <div className="flex justify-end">
            <button onClick={generate} disabled={loading} className="btn-ghost text-xs">
              <RotateCcw className="w-3 h-3" /> Regenerate
            </button>
          </div>
          {keyPoints.map((kp, i) => (
            <GlowCard key={i}>
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-card-hover p-4 flex items-start gap-3">
                <span className={`tag mt-0.5 flex-shrink-0 ${impClasses[kp.importance_level]}`}>{kp.importance_level}</span>
                <p className="text-sm text-foreground flex-1 leading-relaxed">{kp.point}</p>
                <button onClick={() => handleBookmark(i)} className={`p-1 rounded-lg transition-colors ${kp.bookmarked ? 'text-amber-400' : 'text-muted-foreground hover:text-amber-400'}`}>
                  ★
                </button>
              </motion.div>
            </GlowCard>
          ))}
        </>
      )}
    </div>
  )
}

function FlashcardsTab({ docId, initialCards, onUpdate }: { docId: string, initialCards: Flashcard[], onUpdate: (cards: Flashcard[]) => void }) {
  const [cards, setCards] = useState<Flashcard[]>(initialCards)
  const [loading, setLoading] = useState(false)
  const [flipped, setFlipped] = useState<Record<number, boolean>>({})
  const [count, setCount] = useState(10)

  const generate = async () => {
    setLoading(true)
    setFlipped({})
    try {
      const res = await generateFlashcards(docId, count)
      const newCards = res.data.flashcards
      setCards(newCards)
      onUpdate(newCards)
    } catch(e: any) {
      alert(e.response?.data?.detail || 'Failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      {cards.length === 0 ? (
        <GlowCard>
        <div className="glass-card p-10 text-center">
          <Brain className="w-10 h-10 text-emerald-400 mx-auto mb-3 opacity-60" />
          <p className="text-muted-foreground mb-4 text-sm">No flashcards generated yet</p>
          <div className="flex items-center gap-3 justify-center mb-4">
            <label className="text-sm text-muted-foreground">Count:</label>
            <input type="number" min={5} max={20} value={count} onChange={e => setCount(+e.target.value)}
              className="input-field w-20 text-center" />
          </div>
          <button onClick={generate} disabled={loading} className="btn-primary">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Brain className="w-4 h-4" /> Generate Flashcards</>}
          </button>
        </div>
        </GlowCard>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{cards.length} cards · Click to flip</p>
            <button onClick={generate} disabled={loading} className="btn-ghost text-xs">
              <RotateCcw className="w-3 h-3" /> Regenerate
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cards.map((card, i) => (
              <GlowCard key={i}>
                <motion.div onClick={() => setFlipped(f => ({ ...f, [i]: !f[i] }))}
                  className="h-36 cursor-pointer"
                  style={{ perspective: '1000px' }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <motion.div
                    className="w-full h-full relative"
                    animate={{ rotateY: flipped[i] ? 180 : 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <div className="absolute inset-0 glass-card p-4 flex flex-col justify-between"
                      style={{ backfaceVisibility: 'hidden' }}>
                      <span className="tag bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-start">{card.topic}</span>
                      <p className="text-sm font-semibold text-white text-center">{card.front}</p>
                      <p className="text-xs text-muted-foreground text-right">Tap to flip →</p>
                    </div>
                    <div className="absolute inset-0 glass-card p-4 flex flex-col justify-center items-center bg-gradient-to-br from-emerald-500/10 to-amber-600/10"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                      <p className="text-sm text-foreground text-center leading-relaxed">{card.back}</p>
                    </div>
                  </motion.div>
                </motion.div>
              </GlowCard>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function MindMapTab({ docId, initialNodes, initialEdges, onUpdate }: { docId: string, initialNodes: any[], initialEdges: any[], onUpdate: (nodes: Node[], edges: Edge[]) => void }) {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [loading, setLoading] = useState(false)

  const nodeTypeStyles: Record<string, any> = {
    root: { background: 'linear-gradient(135deg,#10b981,#f59e0b)', color: '#fff', border: 'none', borderRadius: 16, padding: '8px 16px', fontWeight: 700 },
    topic: { background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: '6px 12px', fontWeight: 600 },
    subtopic: { background: 'rgba(245,158,11,0.1)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '4px 10px', fontSize: '12px' },
  }

  const transform = (rawNodes: any[], rawEdges: any[]) => {
    const positions = rawNodes.map((_, i) => {
      const angle = (i / rawNodes.length) * 2 * Math.PI
      const r = i === 0 ? 0 : i < 4 ? 200 : 380
      return { x: 400 + r * Math.cos(angle), y: 300 + r * Math.sin(angle) }
    })

    const finalNodes = rawNodes.map((n: any, i: number) => ({
      id: n.id, data: { label: n.label || n.data?.label },
      position: n.position || positions[i],
      style: n.style || nodeTypeStyles[n.type] || nodeTypeStyles.subtopic,
    }))
    
    const finalEdges = rawEdges.map((e: any) => ({
      id: e.id, source: e.source, target: e.target,
      style: { stroke: 'rgba(16,185,129,0.4)', strokeWidth: 2 },
      animated: true,
    }))

    return { nodes: finalNodes, edges: finalEdges }
  }

  useEffect(() => {
    if (initialNodes.length > 0) {
      const { nodes: n, edges: e } = transform(initialNodes, initialEdges)
      setNodes(n)
      setEdges(e)
    }
  }, [initialNodes, initialEdges])

  const generate = async () => {
    setLoading(true)
    try {
      const res = await generateMindMap(docId)
      const { nodes: n, edges: e } = transform(res.data.nodes, res.data.edges)
      setNodes(n)
      setEdges(e)
      onUpdate(n, e)
    } catch(err: any) {
      alert(err.response?.data?.detail || 'Failed')
    } finally { setLoading(false) }
  }

  return (
    <div>
      {nodes.length === 0 ? (
        <GlowCard>
          <div className="glass-card p-10 text-center">
            <Map className="w-10 h-10 text-emerald-400 mx-auto mb-3 opacity-60" />
            <p className="text-muted-foreground mb-4 text-sm">Generate a visual mind map from your document</p>
            <button onClick={generate} disabled={loading} className="btn-primary">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Map className="w-4 h-4" /> Generate Mind Map</>}
            </button>
          </div>
        </GlowCard>
      ) : (
        <GlowCard>
        <div className="glass-card overflow-hidden" style={{ height: 500 }}>
          <ReactFlow nodes={nodes} edges={edges} fitView>
            <Background color="rgba(255,255,255,0.03)" gap={20} />
            <Controls className="!bg-card !border-border" />
          </ReactFlow>
        </div>
        </GlowCard>
      )}
    </div>
  )
}

function ChatTab({ docId }: { docId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await chatWithDocument(docId, userMsg.content, messages)
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }])
    } catch(e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
    } finally { setLoading(false) }
  }

  return (
    <GlowCard>
    <div className="glass-card flex flex-col" style={{ height: 500 }}>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">Ask anything about your document</p>
            <p className="text-xs mt-1">Answers are strictly grounded in document content</p>
          </div>
        )}
        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              m.role === 'user' 
                ? 'bg-gradient-to-br from-emerald-500 to-amber-600 text-white rounded-br-sm' 
                : 'bg-muted text-foreground rounded-bl-sm'
            }`}>
              {m.content}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={el => { bottomRef.current = el }} />
      </div>
      <div className="border-t border-border/50 p-3 flex gap-2">
        <input
          className="input-field flex-1"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask about the document..."
        />
        <button onClick={send} disabled={loading || !input.trim()} className="btn-primary px-4">
          <MessageSquare className="w-4 h-4" />
        </button>
      </div>
    </div>
    </GlowCard>
  )
}

function VoiceTutorTab({ docId }: { docId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [transcriptItem, setTranscriptItem] = useState('')
  const bottomRef = useRef<HTMLDivElement | null>(null)
  
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = true
      }
      synthRef.current = window.speechSynthesis
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, transcriptItem])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    if (synthRef.current?.speaking) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }

    if (!recognitionRef.current) {
      alert("Your browser does not support the Web Speech API. Try Chrome.")
      return
    }

    setTranscriptItem('')
    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = ''
      let interimTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        } else {
          interimTranscript += event.results[i][0].transcript
        }
      }
      setTranscriptItem(finalTranscript || interimTranscript)

      if (finalTranscript) {
        handleUserSpeech(finalTranscript)
      }
    }

    recognitionRef.current.onerror = () => setIsListening(false)
    recognitionRef.current.onend = () => setIsListening(false)
    
    recognitionRef.current.start()
    setIsListening(true)
  }

  const handleUserSpeech = async (text: string) => {
    recognitionRef.current?.stop()
    setIsListening(false)
    setTranscriptItem('')
    
    const userMsg: ChatMessage = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setProcessing(true)

    try {
      const res = await chatWithDocument(docId, text, messages)
      const reply = res.data.response
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      speakResponse(reply)
    } catch(e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection failed.' }])
    } finally {
      setProcessing(false)
    }
  }

  const speakResponse = (text: string) => {
    if (!synthRef.current) return
    synthRef.current.cancel() // stop prev
    const utterance = new SpeechSynthesisUtterance(text)
    
    const voices = synthRef.current.getVoices()
    const niceVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Samantha') || v.lang === 'en-US')
    if (niceVoice) utterance.voice = niceVoice
    
    utterance.rate = 0.95
    utterance.pitch = 1.05

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    synthRef.current.speak(utterance)
  }

  return (
    <GlowCard>
      <div className="glass-card flex flex-col md:flex-row h-[500px] overflow-hidden relative">
        <div className="w-full md:w-1/2 p-10 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-border/50 relative bg-black/10">
          <div className="relative mb-8">
            {isListening && (
               <div className="absolute inset-0 bg-emerald-500 rounded-full blur-[40px] opacity-40 animate-pulse" />
            )}
            {isSpeaking && (
               <div className="absolute inset-0 bg-orange-500 rounded-full blur-[40px] opacity-30 animate-pulse" />
            )}
            
            <button 
              onClick={toggleListening}
              className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl border ${
                isListening ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 scale-105' 
                : isSpeaking ? 'bg-orange-500/20 border-orange-500 text-orange-400' 
                : 'bg-card border-border hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {processing ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : isSpeaking ? (
                <AudioLines className="w-12 h-12 animate-pulse" />
              ) : isListening ? (
                <Mic className="w-12 h-12 animate-bounce" />
              ) : (
                <MicOff className="w-10 h-10" />
              )}
            </button>
          </div>
          
          <h3 className="text-xl font-bold mb-2">Voice AI Tutor</h3>
          <p className="text-sm text-muted-foreground text-center max-w-[250px]">
            {processing ? 'Thinking about your question...' 
            : isSpeaking ? 'Tutor is speaking...' 
            : isListening ? 'Listening to you...' 
            : 'Tap the microphone to ask a question out loud'}
          </p>

          {isSpeaking && (
            <button onClick={() => { synthRef.current?.cancel(); setIsSpeaking(false); }} className="mt-6 text-xs text-muted-foreground hover:text-white px-4 py-2 rounded-full border border-border bg-card">
              Interrupt
            </button>
          )}
        </div>

        <div className="w-full md:w-1/2 flex flex-col bg-background/50">
          <div className="p-4 border-b border-border/50 bg-muted/20">
            <h4 className="font-semibold text-sm flex items-center gap-2"><AudioLines className="w-4 h-4 text-emerald-400" /> Live Transcript</h4>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
             {messages.length === 0 && !transcriptItem && (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30">
                  <Mic className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm">Speak to start the conversation</p>
                </div>
             )}
             
             {messages.map((m, i) => (
               <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                 className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                 <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 ml-1">{m.role === 'user' ? 'You' : 'AI Tutor'}</span>
                 <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                   m.role === 'user' 
                     ? 'bg-emerald-500/10 text-emerald-100 border border-emerald-500/20 rounded-tr-sm' 
                     : 'bg-orange-500/10 text-orange-100 border border-orange-500/20 rounded-tl-sm'
                 }`}>
                   {m.content}
                 </div>
               </motion.div>
             ))}

             {transcriptItem && (
               <div className="flex flex-col items-end opacity-60">
                 <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 ml-1">Listening...</span>
                 <div className="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed bg-emerald-500/5 text-emerald-100/70 border border-emerald-500/10 rounded-tr-sm italic">
                   {transcriptItem}
                 </div>
               </div>
             )}
             
             <div ref={el => { bottomRef.current = el }} />
          </div>
        </div>
      </div>
    </GlowCard>
  )
}

// ─── Diagrams Tab ────────────────────────────────────────────────────────────

function DiagramsTab({ diagrams, docId, onDiagramsLoaded }: { diagrams: DiagramAnalysis[], docId: string, onDiagramsLoaded: (d: DiagramAnalysis[]) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [quizState, setQuizState] = useState<Record<string, Record<number, string | null>>>({})
  const [showAnswers, setShowAnswers] = useState<Record<string, Record<number, boolean>>>({})
  const [scanning, setScanning] = useState(false)

  const handleScan = async () => {
    setScanning(true)
    try {
      const res = await analyzeDiagrams(docId)
      const newDiagrams = res.data.diagrams || []
      onDiagramsLoaded(newDiagrams)
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Diagram scan failed')
    } finally {
      setScanning(false)
    }
  }

  if (!diagrams || diagrams.length === 0) {
    return (
      <GlowCard>
        <div className="glass-card p-12 text-center">
          <Eye className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{scanning ? 'Scanning Document...' : 'No Diagrams Detected Yet'}</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            {scanning
              ? 'Extracting and analyzing visual content with Gemini Vision. This may take 15-30 seconds...'
              : 'Click the button below to scan this PDF for diagrams, charts, figures, and other visual content.'}
          </p>
          {scanning ? (
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              <span className="text-sm text-amber-300">Analyzing with AI Vision...</span>
            </div>
          ) : (
            <button onClick={handleScan} className="btn-primary">
              <Eye className="w-4 h-4" /> Scan for Diagrams
            </button>
          )}
        </div>
      </GlowCard>
    )
  }

  const handleQuizAnswer = (diagramId: string, qIndex: number, answer: string) => {
    setQuizState(prev => ({
      ...prev,
      [diagramId]: { ...(prev[diagramId] || {}), [qIndex]: answer }
    }))
    setShowAnswers(prev => ({
      ...prev,
      [diagramId]: { ...(prev[diagramId] || {}), [qIndex]: true }
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Eye className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold">AI Vision Analysis</h2>
          <p className="text-xs text-muted-foreground">{diagrams.length} visual{diagrams.length > 1 ? 's' : ''} detected and analysed by Gemini Vision</p>
        </div>
      </div>

      {diagrams.map((diagram, idx) => {
        const isExpanded = expandedId === diagram.id
        return (
          <GlowCard key={diagram.id}>
            <div className="glass-card overflow-hidden">
              {/* Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : diagram.id)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-muted/20 transition-colors"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted/30 flex-shrink-0 border border-border/30">
                  <img src={diagram.image_data} alt={diagram.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">Visual {idx + 1}</span>
                  <h3 className="font-semibold text-foreground mt-0.5 truncate">{diagram.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{diagram.explanation.substring(0, 120)}...</p>
                </div>
                <div className="flex-shrink-0">
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                </div>
              </button>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border/30">
                      {/* Image + Explanation split */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                        <div className="p-6 flex items-center justify-center bg-black/20 border-b md:border-b-0 md:border-r border-border/20">
                          <img
                            src={diagram.image_data}
                            alt={diagram.title}
                            className="max-w-full max-h-[400px] object-contain rounded-lg shadow-lg"
                          />
                        </div>
                        <div className="p-6 space-y-5">
                          {/* Explanation */}
                          <div>
                            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                              <Sparkles className="w-4 h-4 text-amber-400" /> AI Explanation
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">{diagram.explanation}</p>
                          </div>

                          {/* Components */}
                          {diagram.components && diagram.components.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                                <BookOpen className="w-4 h-4 text-emerald-400" /> Key Components
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {diagram.components.map((c, i) => (
                                  <span key={i} className="tag bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{c}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Quiz Questions */}
                          {diagram.quiz_questions && diagram.quiz_questions.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                                <Zap className="w-4 h-4 text-amber-400" /> Diagram Quiz
                              </h4>
                              <div className="space-y-4">
                                {diagram.quiz_questions.map((q, qi) => {
                                  const selected = quizState[diagram.id]?.[qi]
                                  const revealed = showAnswers[diagram.id]?.[qi]
                                  return (
                                    <div key={qi} className="p-4 rounded-xl bg-muted/20 border border-border/30 space-y-2">
                                      <p className="text-sm font-medium text-foreground">{q.question}</p>
                                      <div className="grid grid-cols-1 gap-1.5">
                                        {q.options.map((opt, oi) => {
                                          const isSelected = selected === opt
                                          const isCorrect = opt === q.correct_answer
                                          let optStyle = 'bg-card hover:bg-muted border-border/30 text-muted-foreground hover:text-foreground'
                                          if (revealed) {
                                            if (isCorrect) optStyle = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                            else if (isSelected && !isCorrect) optStyle = 'bg-red-500/10 border-red-500/30 text-red-300'
                                          } else if (isSelected) {
                                            optStyle = 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                          }
                                          return (
                                            <button
                                              key={oi}
                                              onClick={() => !revealed && handleQuizAnswer(diagram.id, qi, opt)}
                                              disabled={!!revealed}
                                              className={`text-left px-3 py-2 rounded-lg text-xs border flex items-center gap-2 transition-all ${optStyle}`}
                                            >
                                              {revealed && isCorrect && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                                              {revealed && isSelected && !isCorrect && <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                                              {opt}
                                            </button>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </GlowCard>
        )
      })}
    </div>
  )
}

// ─── Main Study View ─────────────────────────────────────────────────────────

const TABS = [
  { id: 'summary', label: 'Summary', icon: Sparkles },
  { id: 'keypoints', label: 'Key Points', icon: BookOpen },
  { id: 'flashcards', label: 'Flashcards', icon: Brain },
  { id: 'diagrams', label: 'AI Vision', icon: Eye },
  { id: 'mindmap', label: 'Mind Map', icon: Map },
  { id: 'chat', label: 'Text Chat', icon: MessageSquare },
  { id: 'voice', label: 'Voice Tutor', icon: Mic },
]

export default function StudyViewPage() {
  const { documentId } = useParams<{ documentId: string }>()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('summary')
  const [shareUrl, setShareUrl] = useState('')
  const [generatingQuiz, setGeneratingQuiz] = useState(false)

  useEffect(() => {
    if (!documentId) return
    getDocument(documentId).then(res => {
      setDoc(res.data)
      if (res.data.share_token) setShareUrl(`${window.location.origin}/shared/${res.data.share_token}`)
    }).catch(() => navigate('/library')).finally(() => setLoading(false))
  }, [documentId])

  const handleShare = async () => {
    try {
      const res = await createShareLink(documentId!)
      setShareUrl(res.data.share_url)
      navigator.clipboard.writeText(res.data.share_url)
      alert('Share link copied! Expires in 7 days.')
    } catch { alert('Failed to create share link') }
  }

  const handleGenerateQuiz = async () => {
    setGeneratingQuiz(true)
    try {
      const res = await generateQuiz({ document_id: documentId!, count: 10, difficulty: 'medium' })
      navigate(`/quiz/${res.data.id}`)
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to generate quiz')
    } finally { setGeneratingQuiz(false) }
  }

  const handleExportCSV = async () => {
    try {
      const res = await exportQuizCSV(documentId!)
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a'); a.href = url; a.download = `quiz_${documentId}.csv`; a.click()
    } catch { alert('No quiz found. Generate a quiz first.') }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) return
    try {
      await deleteDocument(documentId!)
      navigate('/library')
    } catch { alert('Failed to delete document') }
  }

  if (loading) return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="skeleton h-10 w-64 rounded-xl" />
      <div className="skeleton h-12 rounded-2xl" />
      <div className="skeleton h-96 rounded-2xl" />
    </div>
  )

  if (!doc) return null

  return (
    <AnimatedGroup preset="blur-slide" className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2 mt-0.5">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground truncate">{doc.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{doc.folder} · {(doc.file_size / 1024).toFixed(0)} KB · {new Date(doc.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={handleDelete} className="btn-secondary text-xs px-3 py-2 border-red-500/30 hover:border-red-500/60 bg-red-500/10 hover:bg-red-500/20 text-red-400">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
          <button onClick={() => {
            const roomId = Math.floor(100000 + Math.random() * 900000).toString()
            navigate(`/room/${roomId}?documentId=${documentId}`)
          }} className="btn-secondary text-xs px-3 py-2 border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400">
            <Globe className="w-3.5 h-3.5" /> Live Room
          </button>
          <button onClick={handleShare} className="btn-secondary text-xs px-3 py-2">
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
          <button onClick={handleExportCSV} className="btn-secondary text-xs px-3 py-2">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={handleGenerateQuiz} disabled={generatingQuiz} className="btn-primary text-xs px-3 py-2">
            {generatingQuiz ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Take Quiz
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-2xl overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'summary' && (
            <SummaryTab 
              docId={documentId!} 
              initialSummary={doc.summary || ''} 
              initialEli5={(doc as any).eli5 || ''}
              onUpdate={(data) => setDoc(prev => prev ? { ...prev, ...data } : prev)} 
            />
          )}
          {activeTab === 'keypoints' && (
            <KeyPointsTab 
              docId={documentId!} 
              initialPoints={doc.key_points || []} 
              onUpdate={(kp) => setDoc(prev => prev ? { ...prev, key_points: kp } : prev)} 
            />
          )}
          {activeTab === 'flashcards' && (
            <FlashcardsTab 
              docId={documentId!} 
              initialCards={doc.flashcards || []} 
              onUpdate={(cards) => setDoc(prev => prev ? { ...prev, flashcards: cards } : prev)} 
            />
          )}
          {activeTab === 'mindmap' && (
            <MindMapTab 
              docId={documentId!} 
              initialNodes={(doc.mind_map as any)?.nodes || []} 
              initialEdges={(doc.mind_map as any)?.edges || []} 
              onUpdate={(n, e) => setDoc(prev => prev ? { ...prev, mind_map: { nodes: n, edges: e } as any } : prev)} 
            />
          )}
          {activeTab === 'chat' && <ChatTab docId={documentId!} />}
          {activeTab === 'diagrams' && <DiagramsTab diagrams={doc?.diagrams || []} docId={documentId!} onDiagramsLoaded={(d) => setDoc(prev => prev ? { ...prev, diagrams: d } : prev)} />}
          {activeTab === 'voice' && <VoiceTutorTab docId={documentId!} />}
        </motion.div>
      </AnimatePresence>
    </AnimatedGroup>
  )
}
