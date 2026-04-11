import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, X, Check, AlertCircle, FolderOpen, ArrowRight } from 'lucide-react'
import { uploadDocument } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { GlowCard } from '@/components/ui/spotlight-card'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export default function UploadPage() {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [folder, setFolder] = useState('Default')
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [uploadedId, setUploadedId] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const validateFile = (f: File): string => {
    if (f.size > MAX_SIZE) return `File too large (${(f.size / 1024 / 1024).toFixed(1)}MB). Max is 10MB.`
    if (!['application/pdf', 'text/plain'].includes(f.type) && !f.name.match(/\.(pdf|txt)$/i)) {
      return 'Only PDF and TXT files are supported.'
    }
    return ''
  }

  const handleFile = (f: File) => {
    const err = validateFile(f)
    if (err) { setError(err); return }
    setError('')
    setFile(f)
    if (!title) setTitle(f.name.replace(/\.(pdf|txt)$/i, ''))
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [title])

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    setProgress(0)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title || file.name)
    formData.append('folder', folder)

    try {
      const res = await uploadDocument(formData, setProgress)
      setDone(true)
      setUploadedId(res.data.id)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const reset = () => {
    setFile(null); setTitle(''); setFolder('Default')
    setProgress(0); setError(''); setDone(false); setUploadedId('')
  }

  return (
    <AnimatedGroup preset="blur-slide" className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="page-title gradient-text">Upload Document</h1>
        <p className="text-muted-foreground mt-2">Upload a PDF or TXT file to start studying with AI</p>
      </div>

      <AnimatePresence mode="wait">
        {done ? (
          <GlowCard>
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-10 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Upload Successful!</h2>
            <p className="text-muted-foreground text-sm mb-6">Your document is ready for AI analysis.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => navigate(`/study/${uploadedId}`)} className="btn-primary">
                Start Studying <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={reset} className="btn-secondary">Upload Another</button>
            </div>
          </motion.div>
          </GlowCard>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {/* Drop zone */}
            <GlowCard>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => !file && fileRef.current?.click()}
              className={`glass-card p-10 text-center cursor-pointer transition-all duration-200 ${
                dragging ? 'border-primary/60 bg-primary/5 scale-[1.01]' : 'hover:border-border hover:bg-muted/20'
              } ${file ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.txt"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              {file ? (
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto">
                    <FileText className="w-7 h-7 text-sky-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); setTitle('') }}
                    className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 mx-auto transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              ) : (
                <>
                  <div className={`w-16 h-16 rounded-2xl border-2 border-dashed flex items-center justify-center mx-auto mb-4 transition-colors ${dragging ? 'border-primary bg-primary/10' : 'border-border'}`}>
                    <Upload className={`w-7 h-7 transition-colors ${dragging ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <p className="font-semibold text-foreground mb-1">Drop your file here</p>
                  <p className="text-sm text-muted-foreground">or click to browse · PDF or TXT · max 10MB</p>
                </>
              )}
            </div>
            </GlowCard>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Form fields */}
            {file && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div>
                  <label className="label">Document Title</label>
                  <input
                    className="input-field"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a title for this document"
                  />
                </div>
                <div>
                  <label className="label">
                    <FolderOpen className="w-3.5 h-3.5 inline mr-1" />
                    Folder
                  </label>
                  <input
                    className="input-field"
                    value={folder}
                    onChange={(e) => setFolder(e.target.value)}
                    placeholder="e.g. Physics, Math, Literature"
                  />
                </div>
              </motion.div>
            )}

            {/* Upload progress */}
            {uploading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading & processing...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-sky-500 to-violet-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            )}

            {/* Submit */}
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="btn-primary w-full justify-center py-3"
            >
              {uploading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
              ) : (
                <><Upload className="w-4 h-4" /> Upload Document</>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedGroup>
  )
}
