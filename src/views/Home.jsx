import { Box, Button, Container, Typography } from '@mui/joy'
import { useNavigate } from 'react-router-dom'

import {
  APP_DISPLAY_NAME,
  APP_DISPLAY_TAGLINE,
} from '../config/AppBranding'
import Logo from '../Logo'

const Home = () => {
  const navigate = useNavigate()

  return (
    <Container className='flex h-full items-center justify-center'>
      <Box className='flex flex-col items-center justify-center' sx={{ gap: 2 }}>
        <Logo />
        <Typography level='h1'>{APP_DISPLAY_NAME}</Typography>
        <Typography level='body-md' sx={{ color: 'text.secondary' }}>
          {APP_DISPLAY_TAGLINE}
        </Typography>
        <Button onClick={() => navigate('/chores')}>Get Started</Button>
      </Box>
    </Container>
  )
}

export default Home
