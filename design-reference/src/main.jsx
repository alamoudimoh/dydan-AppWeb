import '@fontsource-variable/comfortaa'
import '@fontsource-variable/inter'
import '@fontsource-variable/ubuntu-sans'
import '@fontsource/cairo/400.css'
import '@fontsource/cairo/600.css'
import '@fontsource/cairo/700.css'
import '@fontsource/jetbrains-mono/400.css'
import './reference.css'

import React from 'react'
import ReactDOM from 'react-dom/client'

import ReferenceApp from './ReferenceApp.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ReferenceApp />
  </React.StrictMode>,
)
