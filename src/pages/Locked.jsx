import UnderConstruction from './UnderConstruction'

// Pages listed here show "Under Construction".
// Delete a name from this list to open that page again.
const LOCKED = ['about', 'team', 'gallery', 'achievements', 'sponsors']

const Locked = ({ name, label, children }) =>
  LOCKED.includes(name) ? <UnderConstruction page={label} /> : children

export default Locked