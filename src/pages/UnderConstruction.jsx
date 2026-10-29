import { Link } from 'react-router-dom'

const UnderConstruction = ({ page }) => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem',
      gap: '1rem',
      background: '#070606',
      color: '#fff',
    }}
  >
    <div style={{ fontSize: '4rem' }}>🚧</div>
    <h1 style={{ margin: 0 }}>{page} is Under Construction</h1>
    <p style={{ margin: 0, opacity: 0.7 }}>
      We're working on this page. Please check back soon!
    </p>
    <Link
      to="/"
      style={{
        marginTop: '1rem',
        padding: '0.6rem 1.4rem',
        borderRadius: '8px',
        border: '1px solid currentColor',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      ← Back to Home
    </Link>
  </div>
)

export default UnderConstruction
