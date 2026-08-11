import { Box, Sheet } from '@mui/joy'
import { styled } from '@mui/joy/styles'

const Container = styled('div')(({ theme }) => ({
  minHeight: '100vh',
  padding: '24px',
  display: 'grid',
  placeItems: 'start center',
  [theme.breakpoints.up('sm')]: {
    // center children
    placeItems: 'center',
  },
}))

const AuthCard = styled(Sheet)(({ theme }) => ({
  padding: 24,
  paddingTop: 32,
  borderRadius: 24,
  border: '1px solid var(--joy-palette-divider)',
  backgroundColor: 'var(--joy-palette-background-surface)',
  width: '100%',
  maxWidth: '400px',
  [theme.breakpoints.down('sm')]: {
    maxWidth: 'unset',
  },
}))

export default function AuthCardContainer({ children, ...props }) {
  return (
    <Container>
      <AuthCard>
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            paddingBottom: 4,
          }}
        >
          {/* <Logo size='96px' /> */}
        </Box>
        {children}
      </AuthCard>
    </Container>
  )
}
