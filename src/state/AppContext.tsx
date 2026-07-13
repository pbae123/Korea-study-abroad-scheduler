import { createContext, useContext, useEffect, useReducer } from 'react'
import type { Dispatch, ReactNode } from 'react'
import type { AppState } from '../types'
import { appReducer } from './reducer'
import type { Action } from './reducer'
import { loadState, saveState } from './storage'

const StateContext = createContext<AppState | null>(null)
const DispatchContext = createContext<Dispatch<Action> | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  )
}

export function useAppState(): AppState {
  const state = useContext(StateContext)
  if (!state) throw new Error('useAppState must be used within AppProvider')
  return state
}

export function useAppDispatch(): Dispatch<Action> {
  const dispatch = useContext(DispatchContext)
  if (!dispatch) throw new Error('useAppDispatch must be used within AppProvider')
  return dispatch
}
