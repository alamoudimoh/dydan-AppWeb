import LogoSVG from '@/assets/logo.svg'
import { Email, GitHub } from '@mui/icons-material'
import {
  Box,
  Container,
  Divider,
  Grid,
  IconButton,
  Link,
  Typography,
} from '@mui/joy'
import { version } from '../../../package.json'
import { APP_SUPPORT_URL } from '@/config/AppBranding'
import { DAYDAN_APP_REPO } from '@/config/ReportDestinations'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    product: [
      { label: 'Features', href: '#features' },
      { label: 'Demo', href: '#demo' },
      { label: 'Getting Started', href: '#getting-started' },
    ],
    resources: [
      {
        label: 'Documentation',
        href: `${DAYDAN_APP_REPO}#readme`,
      },
      {
        label: 'Report an issue',
        href: `${DAYDAN_APP_REPO}/issues`,
      },
      {
        label: 'Discussions',
        href: `${DAYDAN_APP_REPO}/discussions`,
      },
    ],
    downloads: [
      {
        label: 'GitHub Releases',
        href: `${DAYDAN_APP_REPO}/releases`,
      },
      { label: 'Source Code', href: DAYDAN_APP_REPO },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      {
        label: 'License',
        href: `${DAYDAN_APP_REPO}/blob/develop/LICENSE`,
      },
      {
        label: 'Changelog',
        href: `${DAYDAN_APP_REPO}/releases`,
      },
    ],
  }

  const socialLinks = [
    {
      icon: <GitHub />,
      href: DAYDAN_APP_REPO,
      label: 'GitHub',
    },
    {
      icon: <Email />,
      href: APP_SUPPORT_URL,
      label: 'Support',
    },
  ]

  return (
    <Box
      component='footer'
      sx={{
        background: 'background.surface',
        borderTop: '1px solid',
        borderColor: 'divider',
        py: { xs: 6, md: 8 },
        mt: 8,
      }}
    >
      <Container maxWidth='xl'>
        {/* Main Footer Content */}
        <Grid container spacing={4} mb={6}>
          {/* Brand Section */}
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <img
                  src={LogoSVG}
                  alt='DayDan Logo'
                  width='48px'
                  height='48px'
                />
                <Typography
                  level='h4'
                  sx={{
                    ml: 2,
                    fontWeight: 700,
                    fontSize: 28,
                    color: 'text.primary',
                  }}
                >
                  Done<span style={{ color: '#06b6d4' }}>tick</span>
                </Typography>
              </Box>
              <Typography
                level='body-md'
                sx={{
                  color: 'text.secondary',
                  lineHeight: 1.6,
                  mb: 4,
                  maxWidth: 300,
                }}
              >
                Open-source task management made simple. Organize your life,
                collaborate with your team, and stay on top of everything that
                matters.
              </Typography>

              {/* Social Links */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                {socialLinks.map((social, index) => (
                  <IconButton
                    key={index}
                    component='a'
                    href={social.href}
                    target='_blank'
                    rel='noopener noreferrer'
                    variant='soft'
                    sx={{
                      color: 'text.secondary',
                      background: 'background.level1',
                      '&:hover': {
                        color: 'primary.500',
                        background: 'primary.50',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                    aria-label={social.label}
                  >
                    {social.icon}
                  </IconButton>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Footer Links */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={4}>
              <Grid item xs={6} sm={3}>
                <Typography
                  level='title-md'
                  sx={{
                    color: 'text.primary',
                    fontWeight: 600,
                    mb: 3,
                  }}
                >
                  Product
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {footerLinks.product.map((link, index) => (
                    <Link
                      key={index}
                      href={link.href}
                      sx={{
                        color: 'text.secondary',
                        textDecoration: 'none',
                        fontSize: 14,
                        '&:hover': {
                          color: 'primary.500',
                        },
                        transition: 'color 0.3s ease',
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Typography
                  level='title-md'
                  sx={{
                    color: 'text.primary',
                    fontWeight: 600,
                    mb: 3,
                  }}
                >
                  Resources
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {footerLinks.resources.map((link, index) => (
                    <Link
                      key={index}
                      href={link.href}
                      target='_blank'
                      rel='noopener noreferrer'
                      sx={{
                        color: 'text.secondary',
                        textDecoration: 'none',
                        fontSize: 14,
                        '&:hover': {
                          color: 'primary.500',
                        },
                        transition: 'color 0.3s ease',
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Typography
                  level='title-md'
                  sx={{
                    color: 'text.primary',
                    fontWeight: 600,
                    mb: 3,
                  }}
                >
                  Downloads
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {footerLinks.downloads.map((link, index) => (
                    <Link
                      key={index}
                      href={link.href}
                      target='_blank'
                      rel='noopener noreferrer'
                      sx={{
                        color: 'text.secondary',
                        textDecoration: 'none',
                        fontSize: 14,
                        '&:hover': {
                          color: 'primary.500',
                        },
                        transition: 'color 0.3s ease',
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </Box>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Typography
                  level='title-md'
                  sx={{
                    color: 'text.primary',
                    fontWeight: 600,
                    mb: 3,
                  }}
                >
                  Legal
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {footerLinks.legal.map((link, index) => (
                    <Link
                      key={index}
                      href={link.href}
                      target={link.href.startsWith('http') ? '_blank' : '_self'}
                      rel={
                        link.href.startsWith('http')
                          ? 'noopener noreferrer'
                          : undefined
                      }
                      sx={{
                        color: 'text.secondary',
                        textDecoration: 'none',
                        fontSize: 14,
                        '&:hover': {
                          color: 'primary.500',
                        },
                        transition: 'color 0.3s ease',
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: 'divider', mb: 4 }} />

        {/* Bottom Section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography
            level='body-sm'
            sx={{
              color: 'text.secondary',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            © {currentYear} DayDan. All rights reserved.
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
              Version {version}
            </Typography>
         
          </Box>
        </Box>
      </Container>
    </Box>
  )
}

export default Footer
