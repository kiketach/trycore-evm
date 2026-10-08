import { useEffect, useState } from 'react'
import { errorMessage } from '../api/client'
import { getHealth } from '../api/health'

type Connection =
  | { state: 'checking' }
  | { state: 'connected' }
  | { state: 'failed'; reason: string }

export function BackendStatus() {
  const [connection, setConnection] = useState<Connection>({ state: 'checking' })

  useEffect(() => {
    let active = true
    getHealth()
      .then(() => {
        if (active) setConnection({ state: 'connected' })
      })
      .catch((error: unknown) => {
        if (active) setConnection({ state: 'failed', reason: errorMessage(error) })
      })
    return () => {
      active = false
    }
  }, [])

  if (connection.state === 'checking') {
    return <p className="status status--checking">Verificando conexión con el backend…</p>
  }
  if (connection.state === 'connected') {
    return <p className="status status--ok">Conectado al backend</p>
  }
  return (
    <p className="status status--error" role="alert">
      Sin conexión con el backend: {connection.reason}
    </p>
  )
}
