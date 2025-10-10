import { TrendChart } from '../TrendChart'

export default function TrendChartExample() {
  const mockData = [
    { date: '1/5', value: 7.2 },
    { date: '1/6', value: 7.4 },
    { date: '1/7', value: 7.3 },
    { date: '1/8', value: 7.5 },
    { date: '1/9', value: 7.4 },
    { date: '1/10', value: 7.6 },
  ];

  return (
    <div className="max-w-3xl">
      <TrendChart
        title="pH Trend"
        data={mockData}
        optimalMin={7.2}
        optimalMax={7.8}
        unit="pH"
      />
    </div>
  )
}
