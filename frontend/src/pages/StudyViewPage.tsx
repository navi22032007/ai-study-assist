import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Sparkles, BookOpen, Brain, MessageSquare, Map,
  Languages, Zap, Download, Share2, ChevronLeft, Loader2,
  Copy, Check, Globe, RotateCcw, Trash2
} from 'lucide-react'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { GlowCard } from '@/components/ui/spotlight-card'
import ReactFlow, { Background, Controls, Node, Edge } from 'reactflow'
import 'reactflow/dist/style.css'
import { 
  getDocument, generateSummary, generateKeyPoints, generateFlashcards,
  generateELI5, translateContent, chatWithDocument, generateMindMap,
  generateQuiz, createShareLink, toggleBookmark, exportQuizCSV, deleteDocument
} from '../lib/api'
import { Document, KeyPoint, Flashcard, ChatMessage } from '../types'

// Sub-components defined inline for brevity

function SummaryTab({ docId }: { docId: string }) {
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [eli5, setEli5] = useState('')
  const [eli5Loading, setEli5Loading] = useState(false)
  const [translation, setTranslation] = useState('')
  const [transLang, setTransLang] = useState('Spanish')
  const [transLoading, setTransLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await generateSummary(docId)
      setSummary(res.data.summary)
    } catch(e: any) {
      alert(e.response?.data?.detail || 'Failed to generate summary')
    } finally { setLoading(false) }
  }

  const handleELI5 = async () => {
    setEli5Loading(true)
    try {
      const res = await generateELI5(docId)
      setEli5(res.data.explanation)
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
            <Sparkles className="w-10 h-10 text-sky-400 mx-auto mb-3 opacity-60" />
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
              <Globe className="w-4 h-4 text-violet-400" />
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

function KeyPointsTab({ docId }: { docId: string }) {
  const [keyPoints, setKeyPoints] = useState<KeyPoint[]>([])
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await generateKeyPoints(docId)
      setKeyPoints(res.data.key_points)
    } catch(e: any) {
      alert(e.response?.data?.detail || 'Failed')
    } finally { setLoading(false) }
  }

  const handleBookmark = async (i: number) => {
    const updated = [...keyPoints]
    updated[i] = { ...updated[i], bookmarked: !updated[i].bookmarked }
    setKeyPoints(updated)
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
            <BookOpen className="w-10 h-10 text-violet-400 mx-auto mb-3 opacity-60" />
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

function FlashcardsTab({ docId }: { docId: string }) {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(false)
  const [flipped, setFlipped] = useState<Record<number, boolean>>({})
  const [count, setCount] = useState(10)

  const generate = async () => {
    setLoading(true)
    setFlipped({})
    try {
      const res = await generateFlashcards(docId, count)
      setCards(res.data.flashcards)
    } catch(e: any) {
      alert(e.response?.data?.detail || 'Failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      {cards.length === 0 ? (
        <GlowCard>
        <div className="glass-card p-10 text-center">
          <Brain className="w-10 h-10 text-sky-400 mx-auto mb-3 opacity-60" />
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
                      <span className="tag bg-sky-500/10 text-sky-400 border border-sky-500/20 self-start">{card.topic}</span>
                      <p className="text-sm font-semibold text-white text-center">{card.front}</p>
                      <p className="text-xs text-muted-foreground text-right">Tap to flip →</p>
                    </div>
                    <div className="absolute inset-0 glass-card p-4 flex flex-col justify-center items-center bg-gradient-to-br from-sky-500/10 to-violet-600/10"
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

function MindMapTab({ docId }: { docId: string }) {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await generateMindMap(docId)
      const rawNodes: any[] = res.data.nodes
      const rawEdges: any[] = res.data.edges

      const nodeTypeStyles: Record<string, any> = {
        root: { background: 'linear-gradient(135deg,#0ea5e9,#7c3aed)', color: '#fff', border: 'none', borderRadius: 16, padding: '8px 16px', fontWeight: 700 },
        topic: { background: 'rgba(14,165,233,0.15)', color: '#38bdf8', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 12, padding: '6px 12px', fontWeight: 600 },
        subtopic: { background: 'rgba(124,58,237,0.1)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 8, padding: '4px 10px', fontSize: '12px' },
      }

      const positions = rawNodes.map((_, i) => {
        const angle = (i / rawNodes.length) * 2 * Math.PI
        const r = i === 0 ? 0 : i < 4 ? 200 : 380
        return { x: 400 + r * Math.cos(angle), y: 300 + r * Math.sin(angle) }
      })

      setNodes(rawNodes.map((n: any, i: number) => ({
        id: n.id, data: { label: n.label },
        position: positions[i],
        style: nodeTypeStyles[n.type] || nodeTypeStyles.subtopic,
      })))
      setEdges(rawEdges.map((e: any) => ({
        id: e.id, source: e.source, target: e.target,
        style: { stroke: 'rgba(14,165,233,0.4)', strokeWidth: 2 },
        animated: true,
      })))
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
                ? 'bg-gradient-to-br from-sky-500 to-violet-600 text-white rounded-br-sm' 
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

// ─── Main Study View ─────────────────────────────────────────────────────────

const TABS = [
  { id: 'summary', label: 'Summary', icon: Sparkles },
  { id: 'keypoints', label: 'Key Points', icon: BookOpen },
  { id: 'flashcards', label: 'Flashcards', icon: Brain },
  { id: 'mindmap', label: 'Mind Map', icon: Map },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
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
          {activeTab === 'summary' && <SummaryTab docId={documentId!} />}
          {activeTab === 'keypoints' && <KeyPointsTab docId={documentId!} />}
          {activeTab === 'flashcards' && <FlashcardsTab docId={documentId!} />}
          {activeTab === 'mindmap' && <MindMapTab docId={documentId!} />}
          {activeTab === 'chat' && <ChatTab docId={documentId!} />}
        </motion.div>
      </AnimatePresence>
    </AnimatedGroup>
  )
}
