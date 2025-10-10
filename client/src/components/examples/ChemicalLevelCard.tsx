import { ChemicalLevelCard } from '../ChemicalLevelCard'

export default function ChemicalLevelCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl">
      <ChemicalLevelCard
        name="pH"
        value={7.4}
        unit="pH"
        optimalMin={7.2}
        optimalMax={7.8}
        warningMin={7.0}
        warningMax={8.0}
      />
      <ChemicalLevelCard
        name="Chlorine"
        value={2.5}
        unit="ppm"
        optimalMin={1.0}
        optimalMax={3.0}
        warningMin={0.5}
        warningMax={5.0}
      />
      <ChemicalLevelCard
        name="Alkalinity"
        value={95}
        unit="ppm"
        optimalMin={80}
        optimalMax={120}
        warningMin={60}
        warningMax={150}
      />
    </div>
  )
}
