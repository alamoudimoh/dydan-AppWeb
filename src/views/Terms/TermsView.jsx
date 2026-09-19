import { Box, Card, Divider, Link, Stack, Typography } from '@mui/joy'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

import PageHeader from '@/components/common/PageHeader'
import SectionCard from '@/components/common/SectionCard'
import { APP_SUPPORT_URL } from '@/config/AppBranding'
import { narrowPageShellSx } from '@/theme/appLayout'

const TERMS_EFFECTIVE_DATE = 'January 1, 2024'

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

const LegalEmphasis = ({ children }) => (
  <Typography
    level='body-md'
    component='em'
    sx={{ color: 'text.secondary', fontStyle: 'italic' }}
  >
    {children}
  </Typography>
)

LegalEmphasis.propTypes = {
  children: PropTypes.node,
}

const SectionTitle = ({ children }) => (
  <Typography
    level='title-md'
    component='h3'
    sx={{ fontWeight: 600, mb: 1, mt: 2 }}
  >
    {children}
  </Typography>
)

SectionTitle.propTypes = {
  children: PropTypes.node,
}

const TermsView = () => {
  const { t } = useTranslation()

  return (
    <Box component='main' sx={narrowPageShellSx}>
      <PageHeader
        title={t('legal.termsTitle')}
        titleLevel='h1'
        subtitle={t('legal.effectiveDate', { date: TERMS_EFFECTIVE_DATE })}
      />

      <LegalParagraph>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use
        of the dydan task management platform provided by Favoro LLC
        (&quot;dydan&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
        By accessing or using our services, you agree to be bound by these
        Terms. If you do not agree to these Terms, you may not access or use our
        services.
      </LegalParagraph>

      <Card
        variant='soft'
        color='primary'
        sx={{
          my: 2.5,
          p: { xs: 2, sm: 2.5 },
          borderRadius: 'var(--dydan-radius-card)',
          bgcolor: 'background.level1',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography level='title-md' component='h2' sx={{ mb: 1 }}>
          {t('legal.important')}: {t('legal.cloudVsSelfHosted')}
        </Typography>
        <Typography level='body-md' sx={{ mb: 1.5, lineHeight: 1.6 }}>
          dydan is available in two deployment models with different terms and
          responsibilities:
        </Typography>
        <LegalList>
          <LegalListItem>
            <strong>Cloud-Hosted Service:</strong> A separately configured
            deployment where we provide infrastructure and data management
          </LegalListItem>
          <LegalListItem>
            <strong>Self-Hosted Service:</strong> Open-source software you
            deploy on your own infrastructure
          </LegalListItem>
        </LegalList>
        <Typography level='body-md' sx={{ lineHeight: 1.6 }}>
          Please review the applicable sections carefully as they define
          different rights and obligations.
        </Typography>
      </Card>

      <Stack spacing={3} sx={{ mt: 3 }}>
        <SectionCard title='1. Definitions' titleLevel='h2'>
          <LegalList>
            <LegalListItem>
              <strong>&quot;Cloud Service&quot;</strong> refers to the dydan
              platform hosted by its designated operator
            </LegalListItem>
            <LegalListItem>
              <strong>&quot;Self-Hosted Service&quot;</strong> refers to the
              open-source dydan software deployed on user-controlled
              infrastructure
            </LegalListItem>
            <LegalListItem>
              <strong>&quot;Content&quot;</strong> means all data, information,
              tasks, files, and other materials you create, upload, or store
              using our services
            </LegalListItem>
            <LegalListItem>
              <strong>&quot;Circle&quot;</strong> means a collaborative
              workspace shared between users for task management
            </LegalListItem>
          </LegalList>
        </SectionCard>

        <SectionCard
          title='2. Eligibility and Account Registration'
          titleLevel='h2'
        >
          <LegalList>
            <LegalListItem>
              You must be at least 13 years old to use our services
            </LegalListItem>
            <LegalListItem>
              Users under 18 must have parental consent
            </LegalListItem>
            <LegalListItem>
              You are responsible for maintaining the confidentiality of your
              account credentials
            </LegalListItem>
            <LegalListItem>
              You must provide accurate and complete information when creating
              an account
            </LegalListItem>
            <LegalListItem>
              One person or legal entity may maintain only one account
            </LegalListItem>
          </LegalList>
        </SectionCard>

        <SectionCard title='3. Cloud-Hosted Service Terms' titleLevel='h2'>
          <LegalEmphasis>
            This section applies only to users of a configured Cloud Service
          </LegalEmphasis>

          <SectionTitle>3.1 Service Availability and Uptime</SectionTitle>
          <LegalList>
            <LegalListItem>
              We strive to maintain 99.5% uptime for the Cloud Service on a
              monthly basis
            </LegalListItem>
            <LegalListItem>
              Scheduled maintenance will be announced at least 24 hours in
              advance when possible
            </LegalListItem>
            <LegalListItem>
              We reserve the right to temporarily suspend service for emergency
              maintenance
            </LegalListItem>
            <LegalListItem>
              No SLA credits or compensation are provided for downtime unless
              otherwise specified in a separate agreement
            </LegalListItem>
          </LegalList>

          <SectionTitle>3.2 Data Ownership and Responsibility</SectionTitle>
          <LegalList>
            <LegalListItem>
              <strong>Your Data:</strong> You retain ownership of all Content
              you create or upload
            </LegalListItem>
            <LegalListItem>
              <strong>Our Responsibility:</strong> We provide secure hosting,
              backup, and infrastructure management
            </LegalListItem>
            <LegalListItem>
              <strong>Data Portability:</strong> You can export your data at any
              time through our export features
            </LegalListItem>
            <LegalListItem>
              <strong>Data Retention:</strong> We retain your data for 90 days
              after account deletion to allow recovery
            </LegalListItem>
          </LegalList>

          <SectionTitle>3.3 Subscriptions and Billing</SectionTitle>
          <LegalList>
            <LegalListItem>
              Cloud Service subscriptions are billed monthly or annually in
              advance
            </LegalListItem>
            <LegalListItem>
              Subscription fees will automatically renew unless cancelled before
              the next billing cycle
            </LegalListItem>
            <LegalListItem>
              You may cancel your subscription at any time through your account
              settings
            </LegalListItem>
            <LegalListItem>
              Upon cancellation, you retain access until the end of your current
              billing period
            </LegalListItem>
            <LegalListItem>
              We may modify subscription prices with 30 days advance notice
            </LegalListItem>
            <LegalListItem>
              Refunds are considered on a case-by-case basis at our discretion
            </LegalListItem>
          </LegalList>

          <SectionTitle>3.4 Cloud Service Limitations</SectionTitle>
          <LegalList>
            <LegalListItem>
              Storage limits apply based on your subscription tier
            </LegalListItem>
            <LegalListItem>
              API rate limits may be enforced to ensure service stability
            </LegalListItem>
            <LegalListItem>
              We may suspend accounts that exceed reasonable usage limits
            </LegalListItem>
          </LegalList>
        </SectionCard>

        <SectionCard title='4. Self-Hosted Service Terms' titleLevel='h2'>
          <LegalEmphasis>
            This section applies to users deploying dydan on their own
            infrastructure
          </LegalEmphasis>

          <SectionTitle>4.1 Open Source License</SectionTitle>
          <LegalList>
            <LegalListItem>
              The Self-Hosted Service is provided under the MIT License
            </LegalListItem>
            <LegalListItem>
              You may modify, distribute, and use the software for any purpose
            </LegalListItem>
            <LegalListItem>
              Attribution to dydan must be maintained in derivative works
            </LegalListItem>
            <LegalListItem>
              No warranty or support is provided for self-hosted deployments
            </LegalListItem>
          </LegalList>

          <SectionTitle>4.2 User Responsibility</SectionTitle>
          <LegalList>
            <LegalListItem>
              <strong>Infrastructure:</strong> You are solely responsible for
              hosting, maintenance, security, and backups
            </LegalListItem>
            <LegalListItem>
              <strong>Data Protection:</strong> You are the data controller and
              responsible for compliance with applicable laws
            </LegalListItem>
            <LegalListItem>
              <strong>Updates:</strong> You are responsible for applying
              security updates and patches
            </LegalListItem>
            <LegalListItem>
              <strong>Support:</strong> No technical support is provided for
              self-hosted installations
            </LegalListItem>
          </LegalList>

          <SectionTitle>4.3 Limitation of Our Responsibility</SectionTitle>
          <LegalList>
            <LegalListItem>
              We provide no guarantees about the performance or security of
              self-hosted deployments
            </LegalListItem>
            <LegalListItem>
              We are not responsible for any data loss, security breaches, or
              service interruptions in self-hosted environments
            </LegalListItem>
            <LegalListItem>
              Technical support is limited to community forums and documentation
            </LegalListItem>
          </LegalList>
        </SectionCard>

        <SectionCard title='5. Acceptable Use Policy' titleLevel='h2'>
          <LegalEmphasis>
            Applies to both Cloud and Self-Hosted Services
          </LegalEmphasis>
          <SectionTitle>You may not use our services to:</SectionTitle>
          <LegalList>
            <LegalListItem>
              Violate any applicable laws or regulations
            </LegalListItem>
            <LegalListItem>
              Infringe on intellectual property rights
            </LegalListItem>
            <LegalListItem>
              Transmit malicious code or conduct security attacks
            </LegalListItem>
            <LegalListItem>Harass, abuse, or harm other users</LegalListItem>
            <LegalListItem>
              Distribute spam or unwanted communications
            </LegalListItem>
            <LegalListItem>
              Attempt to reverse engineer our proprietary systems (Cloud
              Service)
            </LegalListItem>
            <LegalListItem>
              Resell or redistribute the service without permission
            </LegalListItem>
          </LegalList>
        </SectionCard>

        <SectionCard title='6. Content and Data' titleLevel='h2'>
          <SectionTitle>6.1 Your Content Rights</SectionTitle>
          <LegalList>
            <LegalListItem>
              You retain ownership of all Content you create
            </LegalListItem>
            <LegalListItem>
              You grant us the necessary rights to operate the service (Cloud
              Service only)
            </LegalListItem>
            <LegalListItem>
              You are responsible for ensuring you have rights to any Content
              you upload
            </LegalListItem>
          </LegalList>

          <SectionTitle>6.2 Content Restrictions</SectionTitle>
          <LegalList>
            <LegalListItem>
              Content must not violate any laws or third-party rights
            </LegalListItem>
            <LegalListItem>
              Content must not contain malicious code or harmful materials
            </LegalListItem>
            <LegalListItem>
              We may remove Content that violates these Terms (Cloud Service
              only)
            </LegalListItem>
          </LegalList>
        </SectionCard>

        <SectionCard title='7. Privacy and Security' titleLevel='h2'>
          <LegalList>
            <LegalListItem>
              Your privacy is important to us - please review our Privacy Policy
            </LegalListItem>
            <LegalListItem>
              We implement industry-standard security measures (Cloud Service)
            </LegalListItem>
            <LegalListItem>
              You are responsible for security in self-hosted deployments
            </LegalListItem>
            <LegalListItem>
              Report security vulnerabilities through the dydan support channel
            </LegalListItem>
          </LegalList>
        </SectionCard>

        <SectionCard title='8. Intellectual Property' titleLevel='h2'>
          <LegalList>
            <LegalListItem>
              The dydan name, logo, and proprietary features are our
              intellectual property
            </LegalListItem>
            <LegalListItem>
              The open-source codebase is licensed under MIT License
            </LegalListItem>
            <LegalListItem>
              You may not use our trademarks without written permission
            </LegalListItem>
          </LegalList>
        </SectionCard>

        <SectionCard title='9. Third-Party Integrations' titleLevel='h2'>
          <LegalList>
            <LegalListItem>
              dydan integrates with third-party services (Telegram, Discord,
              webhooks, etc.)
            </LegalListItem>
            <LegalListItem>
              Your use of these integrations is subject to their respective
              terms
            </LegalListItem>
            <LegalListItem>
              We are not responsible for third-party service availability or
              functionality
            </LegalListItem>
          </LegalList>
        </SectionCard>

        <SectionCard title='10. Liability and Warranties' titleLevel='h2'>
          <SectionTitle>10.1 Disclaimer of Warranties</SectionTitle>
          <LegalParagraph>
            Our services are provided &quot;as is&quot; and &quot;as
            available&quot; without any warranty of any kind, express or
            implied, including but not limited to merchantability, fitness for a
            particular purpose, or non-infringement.
          </LegalParagraph>

          <SectionTitle>10.2 Cloud Service Liability</SectionTitle>
          <LegalList>
            <LegalListItem>
              Our total liability for the Cloud Service is limited to the amount
              you paid in the 12 months preceding the claim
            </LegalListItem>
            <LegalListItem>
              We are not liable for indirect, incidental, special, or
              consequential damages
            </LegalListItem>
            <LegalListItem>
              We maintain appropriate insurance and implement security best
              practices
            </LegalListItem>
          </LegalList>

          <SectionTitle>10.3 Self-Hosted Service Liability</SectionTitle>
          <LegalList>
            <LegalListItem>
              We provide no warranties or guarantees for self-hosted deployments
            </LegalListItem>
            <LegalListItem>
              Our liability is limited to the maximum extent permitted by law
            </LegalListItem>
            <LegalListItem>
              You assume all risks associated with self-hosting
            </LegalListItem>
          </LegalList>
        </SectionCard>

        <SectionCard title='11. Indemnification' titleLevel='h2'>
          <LegalParagraph>
            You agree to indemnify and hold us harmless from any claims,
            damages, or expenses arising from your use of our services,
            violation of these Terms, or infringement of any rights.
          </LegalParagraph>
        </SectionCard>

        <SectionCard title='12. Termination' titleLevel='h2'>
          <SectionTitle>12.1 Termination by You</SectionTitle>
          <LegalList>
            <LegalListItem>
              You may terminate your account at any time
            </LegalListItem>
            <LegalListItem>
              Cloud Service: Access continues until the end of your billing
              period
            </LegalListItem>
            <LegalListItem>
              Self-Hosted Service: You may stop using the software at any time
            </LegalListItem>
          </LegalList>

          <SectionTitle>12.2 Termination by Us</SectionTitle>
          <LegalList>
            <LegalListItem>
              We may terminate accounts that violate these Terms
            </LegalListItem>
            <LegalListItem>
              We may discontinue the Cloud Service with 90 days notice
            </LegalListItem>
            <LegalListItem>
              We will provide data export capabilities before termination when
              possible
            </LegalListItem>
          </LegalList>
        </SectionCard>

        <SectionCard title='13. Changes to These Terms' titleLevel='h2'>
          <LegalList>
            <LegalListItem>
              We may update these Terms from time to time
            </LegalListItem>
            <LegalListItem>
              Material changes will be announced via email or in-app
              notification
            </LegalListItem>
            <LegalListItem>
              Continued use after changes constitutes acceptance of new Terms
            </LegalListItem>
            <LegalListItem>
              For significant changes, we may require explicit acceptance
            </LegalListItem>
          </LegalList>
        </SectionCard>

        <SectionCard title='14. Dispute Resolution' titleLevel='h2'>
          <LegalList>
            <LegalListItem>
              We encourage resolving disputes informally by contacting us first
            </LegalListItem>
            <LegalListItem>
              These Terms are governed by the laws of Delaware, United States
            </LegalListItem>
            <LegalListItem>
              Any disputes will be resolved in the courts of Delaware
            </LegalListItem>
            <LegalListItem>
              You may pursue small claims court for eligible disputes
            </LegalListItem>
          </LegalList>
        </SectionCard>

        <SectionCard title='15. Miscellaneous' titleLevel='h2'>
          <LegalList>
            <LegalListItem>
              If any provision is found unenforceable, the remainder remains in
              effect
            </LegalListItem>
            <LegalListItem>
              Our failure to enforce any right does not waive that right
            </LegalListItem>
            <LegalListItem>
              These Terms constitute the entire agreement between us
            </LegalListItem>
            <LegalListItem>
              We may assign these Terms; you may not without our consent
            </LegalListItem>
          </LegalList>
        </SectionCard>

        <SectionCard title={t('legal.contactUs')} titleLevel='h2'>
          <LegalParagraph>
            If you have questions about these Terms, please contact us:
          </LegalParagraph>
          <LegalList>
            <LegalListItem>
              <strong>{t('legal.email')}:</strong>{' '}
              <Link href={APP_SUPPORT_URL}>dydan support on GitHub</Link>
            </LegalListItem>
            <LegalListItem>
              <strong>{t('legal.support')}:</strong>{' '}
              <Link href={APP_SUPPORT_URL}>dydan support on GitHub</Link>
            </LegalListItem>
            <LegalListItem>
              <strong>{t('legal.address')}:</strong> Favoro LLC, [Address to be
              provided]
            </LegalListItem>
          </LegalList>
        </SectionCard>
      </Stack>

      <Divider sx={{ my: 4, borderColor: 'divider' }} />

      <Box>
        <Typography level='body-sm' sx={{ color: 'text.secondary', mb: 0.5 }}>
          <strong>
            {t('legal.lastUpdated', { date: TERMS_EFFECTIVE_DATE })}
          </strong>
        </Typography>
        <Typography level='body-sm' sx={{ color: 'text.secondary' }}>
          {t('legal.effectiveForNewUsers')}
        </Typography>
      </Box>
    </Box>
  )
}

export default TermsView
