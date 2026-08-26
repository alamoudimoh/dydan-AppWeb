import { Box, Divider, Link, Stack, Typography } from '@mui/joy'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

import PageHeader from '@/components/common/PageHeader'
import SectionCard from '@/components/common/SectionCard'
import { narrowPageShellSx } from '@/theme/appLayout'

const PRIVACY_EFFECTIVE_DATE = 'January 1, 2024'

const LegalList = ({ children }) => (
  <Box
    component='ul'
    sx={{
      paddingInlineStart: { xs: 2.5, sm: 3 },
      paddingInlineEnd: 0,
      my: 1,
      '& li': {
        mb: 0.75,
        lineHeight: 1.55,
      },
      '& li::marker': {
        color: 'text.secondary',
      },
    }}
  >
    {children}
  </Box>
)

LegalList.propTypes = {
  children: PropTypes.node,
}

const LegalListItem = ({ children }) => <Box component='li'>{children}</Box>

LegalListItem.propTypes = {
  children: PropTypes.node,
}

const LegalParagraph = ({ children, ...props }) => (
  <Typography level='body-md' sx={{ lineHeight: 1.6, mb: 1.5 }} {...props}>
    {children}
  </Typography>
)

LegalParagraph.propTypes = {
  children: PropTypes.node,
}

const PrivacyPolicyView = () => {
  const { t } = useTranslation()

  return (
    <Box component='main' sx={narrowPageShellSx}>
      <PageHeader
        title={t('legal.privacyTitle')}
        titleLevel='h1'
        subtitle={t('legal.effectiveDate', { date: PRIVACY_EFFECTIVE_DATE })}
      />

      <LegalParagraph>
        Favoro LLC (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates
        the DayDan application and website (collectively, the
        &quot;Service&quot;). This Privacy Policy informs you of our policies
        regarding the collection, use, and disclosure of personal data when you
        use our Service and the choices you have associated with that data.
      </LegalParagraph>

      <Stack spacing={3} sx={{ mt: 3 }}>
        <SectionCard title='Information We Collect' titleLevel='h2'>
          <LegalParagraph>
            <strong>Personal Data:</strong> When you register for an account or
            use the Service, we may collect certain personally identifiable
            information, such as your name and email address.
          </LegalParagraph>
          <LegalParagraph>
            <strong>Usage Data:</strong> We collect information on how you use
            the Service, such as your IP address, browser type, pages visited,
            and the time and date of your visit.
          </LegalParagraph>
          <LegalParagraph>
            <strong>Task Data:</strong> We store the tasks and chores you create
            within the app, including their details and any assigned users.
          </LegalParagraph>
        </SectionCard>

        <SectionCard title='How We Use Your Information' titleLevel='h2'>
          <LegalParagraph>
            <strong>Provide and Maintain the Service:</strong> We use your
            information to operate, maintain, and improve the Service.
          </LegalParagraph>
          <LegalParagraph>
            <strong>Communicate with You:</strong> We may use your email address
            to send you notifications, updates, and promotional materials
            related to the Service.
          </LegalParagraph>
          <LegalParagraph>
            <strong>Analyze Usage:</strong> We analyze usage data to understand
            how the Service is used and to make improvements.
          </LegalParagraph>
        </SectionCard>

        <SectionCard title='How We Share Your Information' titleLevel='h2'>
          <LegalParagraph>
            <strong>With Your Consent:</strong> We will not share your personal
            data with third parties without your consent, except as described in
            this Privacy Policy.
          </LegalParagraph>
          <LegalParagraph>
            <strong>Service Providers:</strong> We may engage third-party
            companies or individuals to perform services on our behalf (e.g.,
            hosting, analytics). These third parties have access to your
            personal data only to perform these tasks and are obligated not to
            disclose or use it for any other purpose.
          </LegalParagraph>
          <LegalParagraph>
            <strong>Compliance with Law:</strong> We may disclose your personal
            data if required to do so by law or in response to valid requests by
            public authorities (e.g., a court or government agency).
          </LegalParagraph>
        </SectionCard>

        <SectionCard title='Security' titleLevel='h2'>
          <LegalParagraph>
            We value your privacy and have implemented reasonable security
            measures to protect your personal data from unauthorized access,
            disclosure, alteration, or destruction. However, no method of
            transmission over the Internet or electronic storage is 100% secure,
            and we cannot guarantee absolute security.
          </LegalParagraph>
        </SectionCard>

        <SectionCard title='Your Choices' titleLevel='h2'>
          <LegalParagraph>
            <strong>Account Information:</strong> You can update or correct your
            account information at any time.
          </LegalParagraph>
          <LegalParagraph>
            <strong>Marketing Communications:</strong> You can opt out of
            receiving promotional emails by following the unsubscribe
            instructions included in those emails.
          </LegalParagraph>
        </SectionCard>

        <SectionCard title="Children's Privacy" titleLevel='h2'>
          <LegalParagraph>
            Our Service is not intended for children under 13 years of age. We
            do not knowingly collect personal data from children under 13. If
            you are a parent or guardian and you are aware that your child has
            provided us with personal data, please contact us.
          </LegalParagraph>
        </SectionCard>

        <SectionCard title='Changes to This Privacy Policy' titleLevel='h2'>
          <LegalParagraph>
            We may update our Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page
            and updating the &quot;Effective Date&quot; at the top of this
            Privacy Policy.
          </LegalParagraph>
        </SectionCard>

        <SectionCard title={t('legal.contactUs')} titleLevel='h2'>
          <LegalParagraph>
            If you have any questions about this Privacy Policy, please contact
            us at:
          </LegalParagraph>
          <LegalList>
            <LegalListItem>
              <strong>{t('legal.email')}:</strong>{' '}
              <Link href='mailto:privacy@donetick.com'>
                privacy@donetick.com
              </Link>
            </LegalListItem>
            <LegalListItem>
              <strong>{t('legal.address')}:</strong> Favoro LLC
            </LegalListItem>
          </LegalList>
        </SectionCard>
      </Stack>

      <Divider sx={{ my: 4, borderColor: 'divider' }} />

      <Box>
        <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
          <strong>
            {t('legal.lastUpdated', { date: PRIVACY_EFFECTIVE_DATE })}
          </strong>
        </Typography>
      </Box>
    </Box>
  )
}

export default PrivacyPolicyView
