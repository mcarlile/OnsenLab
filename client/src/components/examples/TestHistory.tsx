import { TestHistory } from '../TestHistory'

export default function TestHistoryExample() {
  const mockReadings = [
    {
      id: '1',
      timestamp: new Date('2025-01-10T14:30:00'),
      pH: 7.4,
      chlorine: 2.5,
      alkalinity: 95,
      confidence: 0.92,
    },
    {
      id: '2',
      timestamp: new Date('2025-01-09T10:15:00'),
      pH: 7.3,
      chlorine: 2.8,
      alkalinity: 98,
      confidence: 0.88,
    },
    {
      id: '3',
      timestamp: new Date('2025-01-08T16:45:00'),
      pH: 7.5,
      chlorine: 2.2,
      alkalinity: 92,
      confidence: 0.95,
    },
  ];

  return (
    <div className="max-w-5xl">
      <TestHistory 
        readings={mockReadings}
        onViewDetails={(id) => console.log('View details for:', id)}
      />
    </div>
  )
}
