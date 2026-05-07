import { useCallback, useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ComponentType } from 'react'
import { FileText, Loader2, Monitor, ScanLine, UploadCloud } from 'lucide-react'

type DocKind = 'scanned' | 'digital'

function UploadSection({
  kind,
  title,
  description,
  icon: Icon,
  file,
  onFile,
  isDragging,
  setDragging,
  processing,
  onProcess,
  inputId,
}: {
  kind: DocKind
  title: string
  description: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  file: File | null
  onFile: (f: File | null) => void
  isDragging: boolean
  setDragging: (v: boolean) => void
  processing: boolean
  onProcess: () => void
  inputId: string
}) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    onFile(f ?? null)
  }

  return (
    <section
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      aria-labelledby={`${inputId}-heading`}
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-gov-navy">
          <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
        </div>
        <div className="min-w-0 text-left">
          <h3
            id={`${inputId}-heading`}
            className="text-base font-semibold text-gov-navy"
          >
            {title}
          </h3>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        onDragEnter={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            document.getElementById(inputId)?.click()
          }
        }}
        className={[
          'rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          isDragging
            ? 'border-gov-blue bg-blue-50/50'
            : 'border-slate-300 hover:border-slate-400',
        ].join(' ')}
      >
        <UploadCloud
          className="mx-auto h-10 w-10 text-slate-400"
          strokeWidth={1.25}
          aria-hidden
        />
        <p className="mt-3 text-sm font-medium text-slate-700">
          Drop PDF here or{' '}
          <label className="cursor-pointer text-gov-blue underline decoration-gov-blue/30 underline-offset-2 hover:decoration-gov-blue">
            browse
            <input
              id={inputId}
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </p>
        <p className="mt-1 text-xs text-slate-500">PDF only · demo</p>
      </div>

      {file && (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-center gap-3 text-left">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 ring-1 ring-slate-200">
              <FileText className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                {file.name}
              </p>
              <p className="text-xs text-slate-500">
                {(file.size / 1024).toFixed(1)} KB ·{' '}
                <span className="capitalize">{kind}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onProcess}
            disabled={processing}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gov-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2d4a73] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Analysing… (may take 30–60s)
              </>
            ) : (
              'Process Document'
            )}
          </button>
        </div>
      )}
    </section>
  )
}

export function UploadPage() {
  const navigate = useNavigate()
  const baseId = useId()
  const scannedInputId = `${baseId}-scanned`
  const digitalInputId = `${baseId}-digital`

  const [scannedFile, setScannedFile] = useState<File | null>(null)
  const [digitalFile, setDigitalFile] = useState<File | null>(null)
  const [dragScanned, setDragScanned] = useState(false)
  const [dragDigital, setDragDigital] = useState(false)
  const [processingKind, setProcessingKind] = useState<DocKind | null>(null)

  const onFile = useCallback((kind: DocKind, f: File | null) => {
    if (f && f.type === 'application/pdf') {
      if (kind === 'scanned') setScannedFile(f)
      else setDigitalFile(f)
    } else if (f) {
      alert('Please upload a PDF file.')
    }
  }, [])

  const handleProcess = async (kind: DocKind, file: File) => {
    setProcessingKind(kind)
    
    const formData = new FormData()
    formData.append('pdf', file)

    try {
      // Step 1: Upload — returns immediately with a case_id
      const uploadResponse = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errData = await uploadResponse.json().catch(() => ({}))
        throw new Error(errData.detail || 'Upload failed')
      }

      const { id: caseId } = await uploadResponse.json()

      // Step 2: Poll /status/{caseId} every 2 seconds until done or error
      let result = null
      let attempts = 0
      const maxAttempts = 60 // 2 min max wait

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        const statusResponse = await fetch(`http://localhost:8000/status/${caseId}`)
        const statusData = await statusResponse.json()

        if (statusData.processing_status === 'done') {
          result = statusData.data
          break
        } else if (statusData.processing_status === 'error') {
          throw new Error(statusData.error || 'Processing failed on server')
        }
        attempts++
      }

      if (!result) throw new Error('Processing timed out. Please try again.')

      // Step 3: Navigate with the result
      localStorage.setItem('lastCase', JSON.stringify({
        id: caseId,
        caseData: result,
        fileName: file.name,
        documentSource: kind
      }))

      setProcessingKind(null)
      navigate('/verification', {
        state: {
          id: caseId,
          caseData: result,
          fileName: file.name,
          documentSource: kind
        },
      })
    } catch (error: any) {
      console.error('Upload error:', error)
      alert(`Error: ${error.message || 'Check if backend is running.'}`)
      setProcessingKind(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 text-center sm:text-left">
        <h2 className="text-2xl font-semibold text-gov-navy">
          Upload judgment document
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Choose whether the file is a <strong className="font-medium text-slate-700">scanned</strong> image-based PDF or a{' '}
          <strong className="font-medium text-slate-700">digital</strong>{' '}
          native PDF. Documents are processed locally in this demo.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <UploadSection
          kind="scanned"
          title="Scanned documents"
          description="Scans, faxes, or image-only PDFs. OCR and layout recovery may apply."
          icon={ScanLine}
          file={scannedFile}
          onFile={(f) => onFile('scanned', f)}
          isDragging={dragScanned}
          setDragging={setDragScanned}
          processing={processingKind === 'scanned'}
          onProcess={() => scannedFile && handleProcess('scanned', scannedFile)}
          inputId={scannedInputId}
        />
        <UploadSection
          kind="digital"
          title="Digital documents"
          description="Text-native or digitally generated PDFs with selectable text."
          icon={Monitor}
          file={digitalFile}
          onFile={(f) => onFile('digital', f)}
          isDragging={dragDigital}
          setDragging={setDragDigital}
          processing={processingKind === 'digital'}
          onProcess={() =>
            digitalFile && handleProcess('digital', digitalFile)
          }
          inputId={digitalInputId}
        />
      </div>
    </div>
  )
}
