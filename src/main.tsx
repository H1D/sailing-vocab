import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const VALID_HASHES = ['#search', '#flashcards', '#quiz', '#cheatsheet']
if (!VALID_HASHES.includes(window.location.hash)) {
  window.history.replaceState(null, '', window.location.pathname + '#search')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
