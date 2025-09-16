import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import ModeSelector from '../ModeSelector'

const theme = createTheme()

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
)

describe('ModeSelector', () => {
  const mockOnModeSelect = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const defaultSpeechSupport = {
    synthesis: true,
    recognition: true
  }

  it('should render both mode options', () => {
    render(
      <TestWrapper>
        <ModeSelector onModeSelect={mockOnModeSelect} speechSupport={defaultSpeechSupport} />
      </TestWrapper>
    )

    expect(screen.getByText('Text-Only Mode')).toBeInTheDocument()
    expect(screen.getByText('Interactive Interview')).toBeInTheDocument()
  })

  it('should render mode descriptions', () => {
    render(
      <TestWrapper>
        <ModeSelector onModeSelect={mockOnModeSelect} speechSupport={defaultSpeechSupport} />
      </TestWrapper>
    )

    expect(screen.getByText('Practice with written questions and text answers')).toBeInTheDocument()
    expect(screen.getByText('Realistic interview simulation with speech')).toBeInTheDocument()
  })

  it('should show features for each mode', () => {
    render(
      <TestWrapper>
        <ModeSelector onModeSelect={mockOnModeSelect} speechSupport={defaultSpeechSupport} />
      </TestWrapper>
    )

    // Text mode features
    expect(screen.getByText('Read questions at your own pace')).toBeInTheDocument()
    expect(screen.getByText('Type your answers')).toBeInTheDocument()
    expect(screen.getByText('No microphone required')).toBeInTheDocument()

    // Interactive mode features
    expect(screen.getByText('Questions read aloud')).toBeInTheDocument()
    expect(screen.getByText('Voice answer recording')).toBeInTheDocument()
    expect(screen.getByText('Real-time transcription')).toBeInTheDocument()
  })

  it('should call onModeSelect when text mode is selected', () => {
    render(
      <TestWrapper>
        <ModeSelector onModeSelect={mockOnModeSelect} speechSupport={defaultSpeechSupport} />
      </TestWrapper>
    )

    const textModeButton = screen.getByRole('button', { name: /start text-only mode/i })
    fireEvent.click(textModeButton)

    expect(mockOnModeSelect).toHaveBeenCalledWith('text')
  })

  it('should call onModeSelect when interactive mode is selected', () => {
    render(
      <TestWrapper>
        <ModeSelector onModeSelect={mockOnModeSelect} speechSupport={defaultSpeechSupport} />
      </TestWrapper>
    )

    const interactiveModeButton = screen.getByRole('button', { name: /start interactive interview/i })
    fireEvent.click(interactiveModeButton)

    expect(mockOnModeSelect).toHaveBeenCalledWith('interactive')
  })

  it('should show warning when speech synthesis is not supported', () => {
    const limitedSpeechSupport = {
      synthesis: false,
      recognition: true
    }

    render(
      <TestWrapper>
        <ModeSelector onModeSelect={mockOnModeSelect} speechSupport={limitedSpeechSupport} />
      </TestWrapper>
    )

    expect(screen.getByText(/text-to-speech not supported/i)).toBeInTheDocument()
  })

  it('should show warning when speech recognition is not supported', () => {
    const limitedSpeechSupport = {
      synthesis: true,
      recognition: false
    }

    render(
      <TestWrapper>
        <ModeSelector onModeSelect={mockOnModeSelect} speechSupport={limitedSpeechSupport} />
      </TestWrapper>
    )

    expect(screen.getByText(/speech recognition not supported/i)).toBeInTheDocument()
  })

  it('should disable interactive mode when no speech support', () => {
    const noSpeechSupport = {
      synthesis: false,
      recognition: false
    }

    render(
      <TestWrapper>
        <ModeSelector onModeSelect={mockOnModeSelect} speechSupport={noSpeechSupport} />
      </TestWrapper>
    )

    const interactiveModeButton = screen.getByRole('button', { name: /start interactive interview/i })
    expect(interactiveModeButton).toBeDisabled()
  })

  it('should show requirements for interactive mode', () => {
    render(
      <TestWrapper>
        <ModeSelector onModeSelect={mockOnModeSelect} speechSupport={defaultSpeechSupport} />
      </TestWrapper>
    )

    expect(screen.getByText('Microphone access required')).toBeInTheDocument()
    expect(screen.getByText('Modern browser needed')).toBeInTheDocument()
    expect(screen.getByText('Quiet environment recommended')).toBeInTheDocument()
  })

  it('should show benefits for both modes', () => {
    render(
      <TestWrapper>
        <ModeSelector onModeSelect={mockOnModeSelect} speechSupport={defaultSpeechSupport} />
      </TestWrapper>
    )

    // Text mode benefits
    expect(screen.getByText('Perfect for quiet environments')).toBeInTheDocument()
    expect(screen.getByText('Great for detailed written responses')).toBeInTheDocument()

    // Interactive mode benefits
    expect(screen.getByText('Simulates real interview conditions')).toBeInTheDocument()
    expect(screen.getByText('Improves verbal communication')).toBeInTheDocument()
  })

  it('should render with proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <ModeSelector onModeSelect={mockOnModeSelect} speechSupport={defaultSpeechSupport} />
      </TestWrapper>
    )

    const textModeButton = screen.getByRole('button', { name: /start text-only mode/i })
    const interactiveModeButton = screen.getByRole('button', { name: /start interactive interview/i })

    expect(textModeButton).toBeInTheDocument()
    expect(interactiveModeButton).toBeInTheDocument()
  })

  it('should handle undefined speech support gracefully', () => {
    render(
      <TestWrapper>
        <ModeSelector onModeSelect={mockOnModeSelect} speechSupport={undefined} />
      </TestWrapper>
    )

    // Should still render both modes
    expect(screen.getByText('Text-Only Mode')).toBeInTheDocument()
    expect(screen.getByText('Interactive Interview')).toBeInTheDocument()

    // Interactive mode should be disabled
    const interactiveModeButton = screen.getByRole('button', { name: /start interactive interview/i })
    expect(interactiveModeButton).toBeDisabled()
  })

  it('should show tip message', () => {
    render(
      <TestWrapper>
        <ModeSelector onModeSelect={mockOnModeSelect} speechSupport={defaultSpeechSupport} />
      </TestWrapper>
    )

    expect(screen.getByText(/try both modes to see which one helps you practice more effectively/i)).toBeInTheDocument()
  })
})