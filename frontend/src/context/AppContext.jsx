import React, { createContext, useContext, useReducer } from 'react'

// Initial state
const initialState = {
  resumeData: null,
  questions: null,
  interviewSession: null,
  currentStep: 'upload', // upload, questions, interview, results
  loading: false,
  error: null
}

// Action types
export const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_RESUME_DATA: 'SET_RESUME_DATA',
  SET_QUESTIONS: 'SET_QUESTIONS',
  SET_CURRENT_STEP: 'SET_CURRENT_STEP',
  START_INTERVIEW: 'START_INTERVIEW',
  ADD_ANSWER: 'ADD_ANSWER',
  COMPLETE_INTERVIEW: 'COMPLETE_INTERVIEW',
  RESET_APP: 'RESET_APP'
}

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload, error: null }
    
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false }
    
    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null }
    
    case ActionTypes.SET_RESUME_DATA:
      return { 
        ...state, 
        resumeData: action.payload, 
        currentStep: 'questions',
        loading: false,
        error: null 
      }
    
    case ActionTypes.SET_QUESTIONS:
      return { 
        ...state, 
        questions: action.payload,
        loading: false,
        error: null 
      }
    
    case ActionTypes.SET_CURRENT_STEP:
      return { ...state, currentStep: action.payload }
    
    case ActionTypes.START_INTERVIEW:
      return {
        ...state,
        interviewSession: {
          id: Date.now().toString(),
          questions: action.payload.questions,
          answers: [],
          role: action.payload.role,
          level: action.payload.level,
          startTime: new Date(),
          currentQuestionIndex: 0,
          isActive: true
        },
        currentStep: 'interview'
      }
    
    case ActionTypes.ADD_ANSWER:
      return {
        ...state,
        interviewSession: {
          ...state.interviewSession,
          answers: [...state.interviewSession.answers, action.payload],
          currentQuestionIndex: state.interviewSession.currentQuestionIndex + 1
        }
      }
    
    case ActionTypes.COMPLETE_INTERVIEW:
      return {
        ...state,
        interviewSession: {
          ...state.interviewSession,
          endTime: new Date(),
          isActive: false,
          analysis: action.payload
        },
        currentStep: 'results'
      }
    
    case ActionTypes.RESET_APP:
      return initialState
    
    default:
      return state
  }
}

// Context
const AppContext = createContext()

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const value = {
    state,
    dispatch,
    // Helper functions
    setLoading: (loading) => dispatch({ type: ActionTypes.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: ActionTypes.SET_ERROR, payload: error }),
    clearError: () => dispatch({ type: ActionTypes.CLEAR_ERROR }),
    setResumeData: (data) => dispatch({ type: ActionTypes.SET_RESUME_DATA, payload: data }),
    setQuestions: (questions) => dispatch({ type: ActionTypes.SET_QUESTIONS, payload: questions }),
    setCurrentStep: (step) => dispatch({ type: ActionTypes.SET_CURRENT_STEP, payload: step }),
    startInterview: (data) => dispatch({ type: ActionTypes.START_INTERVIEW, payload: data }),
    addAnswer: (answer) => dispatch({ type: ActionTypes.ADD_ANSWER, payload: answer }),
    completeInterview: (analysis) => dispatch({ type: ActionTypes.COMPLETE_INTERVIEW, payload: analysis }),
    resetApp: () => dispatch({ type: ActionTypes.RESET_APP })
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

// Hook to use context
export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export default AppContext