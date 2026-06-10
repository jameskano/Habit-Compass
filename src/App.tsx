import { AppRouterProvider } from './app/providers/AppRouterProvider'
import { AppProviders } from './app/providers/AppProviders'

const App = () => {
  return (
    <AppProviders>
      <AppRouterProvider />
    </AppProviders>
  )
}

export default App
