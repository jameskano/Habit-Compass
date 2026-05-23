import { AppRouterProvider } from './app/providers/AppRouterProvider'
import { AppProviders } from './app/providers/AppProviders'

export default function App() {
  return (
    <AppProviders>
      <AppRouterProvider />
    </AppProviders>
  )
}
