import { Capacitor } from '@capacitor/core'

import Logo from '../../Logo'

const AuthShell = ({
  action,
  children,
  footer,
  logoSize = 48,
  showLogo = !Capacitor.isNativePlatform(),
  subtitle,
  title,
}) => (
  <main className='auth-shell'>
    <div className='auth-shell__content'>
      <section className='card auth-card'>
        {action && <div className='auth-card__action'>{action}</div>}
        {showLogo && (
          <div className='auth-card__logo'>
            <Logo size={`${logoSize}px`} />
          </div>
        )}
        {title && <h1 className='auth-card__title'>{title}</h1>}
        {subtitle && <p className='auth-card__subtitle'>{subtitle}</p>}
        <div className='auth-card__body'>{children}</div>
      </section>
      {footer && <div className='auth-shell__footer'>{footer}</div>}
    </div>
  </main>
)

export default AuthShell
