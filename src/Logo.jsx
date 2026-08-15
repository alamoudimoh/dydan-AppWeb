import LogoSVG from '@/assets/logo.svg'
import { APP_DISPLAY_NAME } from '@/config/AppBranding'

const Logo = ({ size = '128px' }) => (
  <div className='logo'>
    <img
      src={LogoSVG}
      alt={APP_DISPLAY_NAME}
      width={size}
      height={size}
    />
  </div>
)
export default Logo
