import { renderHook, act } from '@testing-library/react'
import { useClipboard } from '../useClipboard'

describe('useClipboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('should copy text to clipboard successfully', async () => {
    const { result } = renderHook(() => useClipboard())
    
    await act(async () => {
      const success = await result.current.copyToClipboard('test text')
      expect(success).toBe(true)
    })
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text')
    expect(result.current.copied).toBe(true)
    expect(result.current.error).toBe(null)
  })

  test('should reset copied state after timeout', async () => {
    const { result } = renderHook(() => useClipboard())
    
    await act(async () => {
      await result.current.copyToClipboard('test text')
    })
    
    expect(result.current.copied).toBe(true)
    
    act(() => {
      jest.advanceTimersByTime(2000)
    })
    
    expect(result.current.copied).toBe(false)
  })

  test('should handle clipboard API failure', async () => {
    navigator.clipboard.writeText.mockRejectedValueOnce(new Error('Clipboard failed'))
    
    const { result } = renderHook(() => useClipboard())
    
    await act(async () => {
      const success = await result.current.copyToClipboard('test text')
      expect(success).toBe(false)
    })
    
    expect(result.current.error).toBe('Failed to copy to clipboard')
    expect(result.current.copied).toBe(false)
  })

  test('should fallback to execCommand when clipboard API unavailable', async () => {
    // Mock clipboard API as unavailable
    const originalClipboard = navigator.clipboard
    delete navigator.clipboard
    
    const { result } = renderHook(() => useClipboard())
    
    await act(async () => {
      const success = await result.current.copyToClipboard('test text')
      expect(success).toBe(true)
    })
    
    expect(document.execCommand).toHaveBeenCalledWith('copy')
    
    // Restore clipboard API
    navigator.clipboard = originalClipboard
  })

  test('should reset state correctly', () => {
    const { result } = renderHook(() => useClipboard())
    
    act(() => {
      result.current.resetState()
    })
    
    expect(result.current.copied).toBe(false)
    expect(result.current.error).toBe(null)
  })

  test('should detect clipboard support correctly', () => {
    const { result } = renderHook(() => useClipboard())
    
    expect(result.current.isSupported).toBe(true)
    
    // Test when both APIs are unavailable
    const originalClipboard = navigator.clipboard
    const originalExecCommand = document.execCommand
    
    delete navigator.clipboard
    delete document.execCommand
    
    const { result: result2 } = renderHook(() => useClipboard())
    expect(result2.current.isSupported).toBe(false)
    
    // Restore APIs
    navigator.clipboard = originalClipboard
    document.execCommand = originalExecCommand
  })
})