import { StarField } from './StarField'
import { MilkyWay } from './MilkyWay'
import { Nebula } from './Nebula'
import { DustParticles, DistantGalaxies } from './DustParticles'

export function SpaceBackground() {
  return (
    <>
      <MilkyWay />
      <StarField />
      <Nebula />
      <DistantGalaxies />
      <DustParticles />
    </>
  )
}
