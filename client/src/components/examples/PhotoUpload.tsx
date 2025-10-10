import { PhotoUpload } from '../PhotoUpload'

export default function PhotoUploadExample() {
  return (
    <div className="max-w-2xl">
      <PhotoUpload 
        onUpload={(file) => console.log('File uploaded:', file.name)} 
      />
    </div>
  )
}
