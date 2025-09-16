import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import QuestionCard from '../QuestionCard'

const theme = createTheme()

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  )
}

describe('QuestionCard', () => {
  const mockQuestion = {
    id: '1',
    type: 'role',
    text: 'What is your experience with React?'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders question text correctly', () => {
    renderWithTheme(
      <QuestionCard question={mockQuestion} index={0} total={5} />
    )
    
    expect(screen.getByText('What is your experience with React?')).toBeInTheDocument()
  })

  test('displays correct question type chip', () => {
    renderWithTheme(
      <QuestionCard question={mockQuestion} index={0} total={5} />
    )
    
    expect(screen.getByText('Technical')).toBeInTheDocument()
  })

  test('shows question number when provided', () => {
    renderWithTheme(
      <QuestionCard question={mockQuestion} index={2} total={5} />
    )
    
    expect(screen.getByText('3 of 5')).toBeInTheDocument()
  })

  test('displays different chips for different question types', () => {
    const introQuestion = { ...mockQuestion, type: 'intro' }
    const { rerender } = renderWithTheme(
      <QuestionCard question={introQuestion} index={0} total={5} />
    )
    
    expect(screen.getByText('Introduction')).toBeInTheDocument()
    
    const behavioralQuestion = { ...mockQuestion, type: 'openEnded' }
    rerender(
      <ThemeProvider theme={theme}>
        <QuestionCard question={behavioralQuestion} index={0} total={5} />
      </ThemeProvider>
    )
    
    expect(screen.getByText('Behavioral')).toBeInTheDocument()
  })

  test('copy button works correctly', async () => {
    renderWithTheme(
      <QuestionCard question={mockQuestion} index={0} total={5} />
    )
    
    const copyButton = screen.getByLabelText(/copy question/i)
    fireEvent.click(copyButton)
    
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockQuestion.text)
    })
  })

  test('speech button triggers speech synthesis', async () => {
    renderWithTheme(
      <QuestionCard question={mockQuestion} index={0} total={5} />
    )
    
    const speakButton = screen.getByLabelText(/read question aloud/i)
    fireEvent.click(speakButton)
    
    await waitFor(() => {
      expect(global.speechSynthesis.speak).toHaveBeenCalled()
    })
  })

  test('hides actions when showActions is false', () => {
    renderWithTheme(
      <QuestionCard 
        question={mockQuestion} 
        index={0} 
        total={5} 
        showActions={false}
      />
    )
    
    expect(screen.queryByLabelText(/copy question/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/read question aloud/i)).not.toBeInTheDocument()
  })

  test('handles long question text appropriately', () => {
    const longQuestion = {
      ...mockQuestion,
      text: 'This is a very long question that should still be displayed properly and maintain good readability even when the text content is quite extensive and spans multiple lines in the component.'
    }
    
    renderWithTheme(
      <QuestionCard question={longQuestion} index={0} total={5} />
    )
    
    expect(screen.getByText(longQuestion.text)).toBeInTheDocument()
  })
})