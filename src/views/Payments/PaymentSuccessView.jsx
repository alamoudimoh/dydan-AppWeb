import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import Logo from '../../Logo'

const PaymentSuccessView = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => navigate('/settings'), 5000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <main className='payment-status'>
      <section className='card payment-status__card' aria-live='polite'>
        <Logo />
        <h1>Payment Successful!</h1>
        <p>You will be redirected to the settings page shortly.</p>
      </section>
    </main>
  )
}

export default PaymentSuccessView
