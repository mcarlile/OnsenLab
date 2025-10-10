import { EmptyState } from '../EmptyState'

export default function EmptyStateExample() {
  return (
    <div className="max-w-2xl">
      <EmptyState onUploadClick={() => console.log('Upload clicked')} />
    </div>
  )
}
