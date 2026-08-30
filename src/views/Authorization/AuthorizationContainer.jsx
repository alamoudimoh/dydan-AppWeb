const AuthCardContainer = ({ children }) => (
  <main className='auth-shell'>
    <div className='auth-shell__content'>
      <section className='card auth-card'>{children}</section>
    </div>
  </main>
)

export default AuthCardContainer
