import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { verifyPublicCertificate } from '../lib/api'
import { QRCodeSVG } from 'qrcode.react'
import { format } from 'date-fns'
import { Loader2, Download, Award, ShieldCheck, ChevronRight } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function PublicCertificatePage() {
  const { token } = useParams<{ token: string }>()
  const [cert, setCert] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [downloading, setDownloading] = useState(false)
  
  const certRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!token) return
    verifyPublicCertificate(token)
      .then(res => setCert(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [token])

  const handleDownload = async () => {
    if (!certRef.current) return
    setDownloading(true)
    try {
      const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('landscape', 'px', [1056, 816]) // Standard letter landscape
      pdf.addImage(imgData, 'PNG', 0, 0, 1056, 816)
      pdf.save(`Certificate_of_Mastery_${cert.topic.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)
    } catch (e) {
      alert("Failed to download PDF")
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
        <p className="text-muted-foreground">Verifying secure credential...</p>
      </div>
    )
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <ShieldCheck className="w-12 h-12 text-red-500 opacity-50" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Invalid Certificate</h1>
        <p className="text-muted-foreground max-w-md">
          This digital credential could not be verified. It may have been revoked, expired, or the URL is incorrect.
        </p>
        <Link to="/" className="btn-primary mt-8 inline-flex">Return to Home</Link>
      </div>
    )
  }

  const verificationUrl = window.location.href

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-8 flex flex-col items-center relative overflow-hidden">
      
      {/* Background aesthetic */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-sky-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Bar Navigation */}
      <div className="w-full max-w-[1056px] mx-auto flex items-center justify-between mb-8 z-10">
        <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
          <Award className="w-6 h-6" /> StudyAI
        </div>
        <div className="flex bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-sm font-semibold items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <ShieldCheck className="w-4 h-4" /> Officially Verified Credential
        </div>
      </div>

      {/* The Printable Certificate Container */}
      <div className="relative z-10 bg-white text-slate-800 shadow-2xl rounded-sm w-full max-w-[1056px] aspect-[1.3] flex flex-col items-center justify-center p-8 sm:p-16 border-8 border-double border-slate-200"
        ref={certRef}
        style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.05) 0%, transparent 80%)' }}
      >
        <div className="absolute inset-0 border-[1px] border-slate-300 m-2 pointer-events-none" />
        
        {/* Certificate Header */}
        <div className="w-full text-center mb-8">
           <Award className="w-20 h-20 text-yellow-500 mx-auto mb-4 drop-shadow-md" />
           <h1 className="text-5xl sm:text-7xl font-serif font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
             Certificate of Mastery
           </h1>
           <p className="text-sm sm:text-base tracking-widest uppercase text-slate-400 mt-4 font-semibold">
             Awarded upon successful completion of curriculum & evaluation
           </p>
        </div>

        {/* Certificate Body */}
        <div className="w-full flex-1 flex flex-col items-center justify-center space-y-8 text-center max-w-3xl z-10">
           <p className="text-xl sm:text-2xl text-slate-600 italic" style={{ fontFamily: 'Georgia, serif' }}>
             This is to formally certify that
           </p>
           
           <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 border-b-2 border-slate-300 pb-2 px-12 min-w-[50%]">
             {cert.user_name}
           </h2>
           
           <p className="text-lg sm:text-xl text-slate-600 italic" style={{ fontFamily: 'Georgia, serif' }}>
             has demonstrated outstanding comprehension and achieved a verified evaluation score of <span className="font-bold text-emerald-600 not-italic">{cert.score}%</span> on the topic:
           </p>

           <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 text-balance leading-snug max-w-2xl">
             "{cert.topic}"
           </h3>
        </div>

        {/* Certificate Footer */}
        <div className="w-full mt-12 grid grid-cols-3 gap-4 items-end">
          <div className="flex flex-col items-center text-center">
            <span className="text-lg font-semibold text-slate-800 border-b border-slate-400 pb-1 w-48 truncate">
              {format(new Date(cert.created_at), 'MMMM do, yyyy')}
            </span>
            <span className="text-xs text-slate-500 uppercase tracking-widest mt-2 font-medium">Date of Issue</span>
          </div>

          <div className="flex flex-col items-center justify-center mt-auto">
             <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
               <QRCodeSVG value={verificationUrl} size={90} level="H" includeMargin={false} />
             </div>
             <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-2 font-mono">Scan to Verify Authenticity</p>
          </div>

          <div className="flex flex-col items-center text-center">
            <span className="text-lg font-semibold text-slate-800 border-b border-slate-400 pb-1 w-48 truncate">
              StudyAI Automated Evaluator
            </span>
            <span className="text-xs text-slate-500 uppercase tracking-widest mt-2 font-medium">Verified Issuer</span>
          </div>
        </div>

        {/* Document ID / Metadata */}
        <div className="absolute bottom-4 right-6 text-[10px] text-slate-400 font-mono tracking-widest text-right">
          ID: {cert.token.toUpperCase().slice(0,16)}<br/>
          STUDYAI.COM
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-[1056px] mx-auto mt-8 flex justify-center pb-20 z-10">
        <button 
          onClick={handleDownload}
          disabled={downloading} 
          className="btn-primary px-8 py-4 text-base"
        >
          {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          Download as PDF
        </button>
      </div>
    </div>
  )
}
