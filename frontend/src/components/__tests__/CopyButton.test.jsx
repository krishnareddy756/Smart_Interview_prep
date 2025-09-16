import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CopyButton, { CopyTextArea, CopyList } from '../CopyButton'
import { NotificationProvider } from '../NotificationSystem'
import * as clipboardUtils from '../../utils/clipboard'

// Mock clipboard utilities
jest.mock('../../utils/clipboard')

const theme = createTheme()

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    <NotificationProvider>
      {children}
    </NotificationProvider>
  </ThemeProvider>
)

describe('CopyButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Icon variant', () => {
    it('should render copy icon button', () => {
      render(
        <TestWrapper>
          <CopyButton text="Test text" variant="icon" />
        </TestWrapper>
      )

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('aria-label', 'Copy to clipboard')
    })

    it('should copy text when clicked', async () => {
      clipboardUtils.copyToClipboard.mockResolvedValue(true)

      render(
        <TestWrapper>
          <CopyButton text="Test text" variant="icon" showNotification={false} />
        </TestWrapper>
      )

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(clipboardUtils.copyToClipboard).toHaveBeenCalledWith('Test text')
      })
    })

    it('should show success state after successful copy', async () => {
      clipboardUtils.copyToClipboard.mockResolvedValue(true)

      render(
        <TestWrapper>
          <CopyButton text="Test text" variant="icon" showNotification={false} />
        </TestWrapper>
      )

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-label', 'Copied!')
      })
    })

    it('should show error state when copy fails', async () => {
      clipboardUtils.copyToClipboard.mockResolvedValue(false)

      render(
        <TestWrapper>
          <CopyButton text="Test text" variant="icon" showNotification={false} />
        </TestWrapper>
      )

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-label', 'Copy failed')
      })
    })

    it('should be disabled when no text provided', () => {
      render(
        <TestWrapper>
          <CopyButton text="" variant="icon" />
        </TestWrapper>
      )

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should be disabled when disabled prop is true', () => {
      render(
        <TestWrapper>
          <CopyButton text="Test text" variant="icon" disabled />
        </TestWrapper>
      )

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })
  })

  describe('Button variant', () => {
    it('should render button with label', () => {
      render(
        <TestWrapper>
          <CopyButton text="Test text" variant="button" label="Copy Text" />
        </TestWrapper>
      )

      const button = screen.getByRole('button', { name: /copy text/i })
      expect(button).toBeInTheDocument()
    })

    it('should show "Copied!" text after successful copy', async () => {
      clipboardUtils.copyToClipboard.mockResolvedValue(true)

      render(
        <TestWrapper>
          <CopyButton text="Test text" variant="button" label="Copy Text" showNotification={false} />
        </TestWrapper>
      )

      const button = screen.getByRole('button', { name: /copy text/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument()
      })
    })

    it('should show "Failed" text when copy fails', async () => {
      clipboardUtils.copyToClipboard.mockResolvedValue(false)

      render(
        <TestWrapper>
          <CopyButton text="Test text" variant="button" label="Copy Text" showNotification={false} />
        </TestWrapper>
      )

      const button = screen.getByRole('button', { name: /copy text/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /failed/i })).toBeInTheDocument()
      })
    })
  })

  describe('Error handling', () => {
    it('should handle clipboard API errors', async () => {
      const error = new Error('Clipboard not available')
      clipboardUtils.copyToClipboard.mockRejectedValue(error)

      render(
        <TestWrapper>
          <CopyButton text="Test text" variant="icon" showNotification={false} />
        </TestWrapper>
      )

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-label', 'Copy failed')
      })
    })
  })
})

describe('CopyTextArea', () => {
  it('should render text area with copy button', () => {
    render(
      <TestWrapper>
        <CopyTextArea text="Test content" label="Test Label" />
      </TestWrapper>
    )

    expect(screen.getByText('Test Label')).toBeInTheDocument()
    expect(screen.getByText('Test content')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should render without label', () => {
    render(
      <TestWrapper>
        <CopyTextArea text="Test content" />
      </TestWrapper>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should show line numbers when enabled', () => {
    const multilineText = 'Line 1\\nLine 2\\nLine 3'
    
    render(
      <TestWrapper>
        <CopyTextArea text={multilineText} showLineNumbers />
      </TestWrapper>
    )

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})

describe('CopyList', () => {
  const testItems = ['Item 1', 'Item 2', 'Item 3']

  it('should render list of items', () => {
    render(
      <TestWrapper>
        <CopyList items={testItems} title="Test List" />
      </TestWrapper>
    )

    expect(screen.getByText('Test List')).toBeInTheDocument()
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
    expect(screen.getByText('Item 3')).toBeInTheDocument()
  })

  it('should show individual copy buttons when enabled', () => {
    render(
      <TestWrapper>
        <CopyList items={testItems} showIndividualCopy />
      </TestWrapper>
    )

    const copyButtons = screen.getAllByRole('button')
    expect(copyButtons).toHaveLength(testItems.length + 1) // +1 for "Copy All" button
  })

  it('should show copy all button when enabled', () => {
    render(
      <TestWrapper>
        <CopyList items={testItems} showCopyAll />
      </TestWrapper>
    )

    expect(screen.getByRole('button', { name: /copy all/i })).toBeInTheDocument()
  })

  it('should render numbered list when enabled', () => {
    render(
      <TestWrapper>
        <CopyList items={testItems} numbered />
      </TestWrapper>
    )

    expect(screen.getByText('1. Item 1')).toBeInTheDocument()
    expect(screen.getByText('2. Item 2')).toBeInTheDocument()
    expect(screen.getByText('3. Item 3')).toBeInTheDocument()
  })

  it('should copy individual items', async () => {
    clipboardUtils.copyToClipboard.mockResolvedValue(true)

    render(
      <TestWrapper>
        <CopyList items={testItems} showIndividualCopy showNotification={false} />
      </TestWrapper>
    )

    const copyButtons = screen.getAllByRole('button')
    const firstItemCopyButton = copyButtons[1] // First button is "Copy All"
    
    fireEvent.click(firstItemCopyButton)

    await waitFor(() => {
      expect(clipboardUtils.copyToClipboard).toHaveBeenCalledWith('Item 1')
    })
  })

  it('should copy all items', async () => {
    clipboardUtils.copyToClipboard.mockResolvedValue(true)

    render(
      <TestWrapper>
        <CopyList items={testItems} showCopyAll showNotification={false} />
      </TestWrapper>
    )

    const copyAllButton = screen.getByRole('button', { name: /copy all/i })
    fireEvent.click(copyAllButton)

    await waitFor(() => {
      expect(clipboardUtils.copyToClipboard).toHaveBeenCalledWith('• Item 1\\n• Item 2\\n• Item 3')
    })
  })

  it('should copy numbered list format', async () => {
    clipboardUtils.copyToClipboard.mockResolvedValue(true)

    render(
      <TestWrapper>
        <CopyList items={testItems} numbered showCopyAll showNotification={false} />
      </TestWrapper>
    )

    const copyAllButton = screen.getByRole('button', { name: /copy all/i })
    fireEvent.click(copyAllButton)

    await waitFor(() => {
      expect(clipboardUtils.copyToClipboard).toHaveBeenCalledWith('1. Item 1\\n2. Item 2\\n3. Item 3')
    })
  })
})