import { useState } from 'react'
import { UploadDialog } from '../UploadDialog'
import { Button } from '@/components/ui/button'

export default function UploadDialogExample() {
  const [open, setOpen] = useState(false)
  
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Upload</Button>
      <UploadDialog 
        open={open}
        onOpenChange={setOpen}
        onUpload={(file) => console.log('File uploaded:', file.name)}
      />
    </>
  )
}
