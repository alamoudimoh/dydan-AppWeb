import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import Logo from '../../Logo'

const PaymentCancelledView = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => navigate('/chores'), 5000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <main className='payment-status'>
      <section className='card payment-status__card' aria-live='polite'>
        <Logo />
        <h1>Payment has been cancelled</h1>
        <p>You will be redirected to the main page shortly.</p>
      </section>
    </main>
  )
}

export default PaymentCancelledView
