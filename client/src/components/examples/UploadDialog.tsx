import { useState } from 'react'
import { UploadDialog, type UploadPhase } from '../UploadDialog'
import { Button } from '@/components/ui/button'

export default function UploadDialogExample() {
  const [open, setOpen] = useState(false)
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [failedPhase, setFailedPhase] = useState<string | null>(null)

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Upload</Button>
      <UploadDialog
        open={open}
        onOpenChange={setOpen}
        onUpload={(files, brandId) => console.log('Files uploaded:', files.length, 'brand:', brandId)}
        uploadPhase={uploadPhase}
        uploadError={uploadError}
        failedPhase={failedPhase}
      />
    </>
  )
}
