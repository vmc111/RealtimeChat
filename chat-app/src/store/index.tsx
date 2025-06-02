import { createContext, useContext, useRef } from 'react'

import AuthStore from './AuthStore'
import ChatStore from './ChatStore'

interface RootStore {
  authStore: AuthStore
  chatStore: ChatStore
}

const StoreContext = createContext<RootStore | null>(null)

const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const store = useRef<RootStore>({
    authStore: AuthStore.create(),
    chatStore: ChatStore.create(),
  })
  return <StoreContext.Provider value={store.current}>{children}</StoreContext.Provider>
}

const useStore = () => {
  const store = useContext(StoreContext)
  if (!store) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return store
}

export { StoreContext, useStore, StoreProvider }
