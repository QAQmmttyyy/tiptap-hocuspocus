export interface User {
  name: string
  color: string
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

export interface StatusEvent {
  status: ConnectionStatus
} 