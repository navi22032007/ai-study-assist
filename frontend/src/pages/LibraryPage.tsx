import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  Library, Search, FolderOpen, FileText, Trash2, Edit3, MoreHorizontal,
  Upload, BookOpen, Zap, Plus, X, Check, Brain, Sparkles, CreditCard
} from 'lucide-react'
import { listDocuments, deleteDocument, updateDocument, getFolders } from '../lib/api'
import { Document } from '../types'
import { BentoGrid, type BentoItem } from '@/components/ui/bento-grid'
import { AnimatedGroup } from '@/components/ui/animated-group'

export default function LibraryPage() {
  const [docs, setDocs] = useState<Document[]>([])
  const [folders, setFolders] = useState<string[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [menuId, setMenuId] = useState<string | null>(null)
  const navigate = useNavigate()

  const fetchDocs = async () => {
    setLoading(true)
    try {
      const [docsRes, foldersRes] = await Promise.all([
        listDocuments({ folder: selectedFolder || undefined, search: search || undefined }),
        getFolders()
      ])
      setDocs(docsRes.data.documents)
      setFolders(foldersRes.data.folders)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchDocs() }, [selectedFolder, search])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document? This cannot be undone.')) return
    await deleteDocument(id)
    setDocs(d => d.filter(x => x.id !== id))
    setMenuId(null)
  }

  const handleEditSave = async (id: string) => {
    if (!editTitle.trim()) return
    await updateDocument(id, { title: editTitle })
    setDocs(d => d.map(x => x.id === id ? { ...x, title: editTitle } : x))
    setEditId(null)
  }

  return (
    <AnimatedGroup preset="blur-slide" className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title gradient-text">Document Library</h1>
          <p className="text-muted-foreground mt-1">{docs.length} document{docs.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/upload" className="btn-primary">
          <Upload className="w-4 h-4" /> Upload New
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="input-field pl-10"
            placeholder="Search documents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedFolder('')}
            className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${!selectedFolder ? 'bg-primary/10 text-primary border border-primary/20' : 'btn-ghost'}`}
          >
            All
          </button>
          {folders.map(f => (
            <button
              key={f}
              onClick={() => setSelectedFolder(f === selectedFolder ? '' : f)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${selectedFolder === f ? 'bg-primary/10 text-primary border border-primary/20' : 'btn-ghost'}`}
            >
              <FolderOpen className="w-3.5 h-3.5" /> {f}
            </button>
          ))}
        </div>
      </div>

      {/* Document grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-44 rounded-2xl" />)}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-20">
          <Library className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-2">No documents found</h3>
          <p className="text-muted-foreground text-sm mb-5">
            {search ? 'Try a different search term' : 'Upload your first document to get started'}
          </p>
          {!search && null}
        </div>
      ) : (
        <BentoGrid
          items={docs.map((doc, i): BentoItem => {
            const tags: string[] = []
            if (doc.summary) tags.push('Summary')
            if (doc.key_points?.length) tags.push('Key Points')
            if (doc.flashcards?.length) tags.push('Flashcards')
            if (doc.mind_map) tags.push('Mind Map')

            const featureCount = tags.length
            const fileIcon = doc.file_type === 'application/pdf'
              ? <FileText className="w-4 h-4 text-red-400" />
              : <FileText className="w-4 h-4 text-sky-400" />

            return {
              title: doc.title,
              description: `${doc.folder} · ${(doc.file_size / 1024).toFixed(0)} KB · ${new Date(doc.created_at).toLocaleDateString()}`,
              icon: fileIcon,
              status: featureCount === 4 ? 'Complete' : featureCount > 0 ? `${featureCount}/4 Ready` : 'New',
              tags,
              meta: doc.file_type === 'application/pdf' ? 'PDF' : 'TXT',
              cta: 'Study →',
              colSpan: i === 0 ? 2 : 1,
              hasPersistentHover: i === 0,
              onClick: () => navigate(`/study/${doc.id}`),
              onDelete: () => handleDelete(doc.id),
            }
          })}
        />
      )}
    </AnimatedGroup>
  )
}
