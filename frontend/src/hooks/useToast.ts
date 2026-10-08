import { useContext } from 'react'
import { ToastContext } from '../components/Toast/toastContext'

export function useToast() {
  return useContext(ToastContext)
}
