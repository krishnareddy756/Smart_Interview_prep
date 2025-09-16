/**
 * Cross-browser compatibility tests for speech features
 */

import { setupSpeechMocks, cleanupSpeechMocks } from '../mocks/speechMocks'
import { SpeechSynthesisManager, SpeechRecognitionManager } from '../../services/speechService'

describe('Browser Compatibility', () => {
  afterEach(() => {
    cleanupSpeechMocks()
  })

  describe('Speech Synthesis Compatibility', () => {
    it('should detect speech synthesis support in modern browsers', () => {
      setupSpeechMocks()
      
      const manager = new SpeechSynthesisManager()
      expect(manager.isSupported()).toBe(true)
    })

    it('should handle missing speech synthesis API', () => {
      // Don't setup mocks to simulate unsupported browser
      const manager = new SpeechSynthesisManager()
      expect(manager.isSupported()).toBe(false)
    })

    it('should gracefully degrade when speech synthesis fails', async () => {
      const mocks = setupSpeechMocks()
      
      // Mock speak to throw error
      mocks.mockSpeechSynthesis.speak.mockImplementation(() => {
        throw new Error('Speech synthesis not available')
      })

      const manager = new SpeechSynthesisManager()
      
      // Should not throw error
      await expect(manager.speak('Test text')).resolves.toBeUndefined()
    })

    it('should work with different voice configurations', () => {
      const mocks = setupSpeechMocks()
      
      const manager = new SpeechSynthesisManager()
      const voices = manager.getVoices()
      
      expect(voices).toHaveLength(2)
      expect(voices[0].name).toBe('Test Voice 1')
      expect(voices[1].name).toBe('Test Voice 2')
    })

    it('should handle voice loading delays', async () => {
      const mocks = setupSpeechMocks()
      
      // Initially return empty voices
      mocks.mockSpeechSynthesis.getVoices.mockReturnValueOnce([])
      
      const manager = new SpeechSynthesisManager()
      
      // Should handle empty voices gracefully
      const initialVoices = manager.getVoices()
      expect(initialVoices).toHaveLength(0)
      
      // Simulate voices loading
      mocks.mockSpeechSynthesis.getVoices.mockReturnValue([
        { name: 'Loaded Voice', lang: 'en-US', default: true }
      ])
      
      // Trigger voices changed event
      if (mocks.mockSpeechSynthesis.onvoiceschanged) {
        mocks.mockSpeechSynthesis.onvoiceschanged()
      }
      
      const loadedVoices = manager.getVoices()
      expect(loadedVoices).toHaveLength(1)
    })
  })

  describe('Speech Recognition Compatibility', () => {
    it('should detect speech recognition support', () => {
      setupSpeechMocks()
      
      const manager = new SpeechRecognitionManager()
      expect(manager.isSupported()).toBe(true)
    })

    it('should handle missing speech recognition API', () => {
      // Test without mocks
      const manager = new SpeechRecognitionManager()
      expect(manager.isSupported()).toBe(false)
    })

    it('should prefer standard API over webkit', () => {
      // Setup both APIs
      const mocks = setupSpeechMocks()
      
      // Mock standard SpeechRecognition
      Object.defineProperty(window, 'SpeechRecognition', {
        writable: true,
        value: jest.fn(() => ({ ...mocks.mockSpeechRecognition, standard: true }))
      })
      
      const manager = new SpeechRecognitionManager()
      expect(manager.isSupported()).toBe(true)
    })

    it('should fallback to webkit API when standard is not available', () => {
      const mocks = setupSpeechMocks()
      
      // Remove standard API
      delete window.SpeechRecognition
      
      const manager = new SpeechRecognitionManager()
      expect(manager.isSupported()).toBe(true)
    })

    it('should handle permission denied errors', async () => {
      const mocks = setupSpeechMocks()
      
      const manager = new SpeechRecognitionManager()
      
      // Start recognition
      const promise = manager.startListening()
      
      // Simulate permission denied
      mocks.simulateSpeechRecognitionError('not-allowed')
      
      await expect(promise).rejects.toThrow('not-allowed')
    })

    it('should handle network errors gracefully', async () => {
      const mocks = setupSpeechMocks()
      
      const manager = new SpeechRecognitionManager()
      
      const promise = manager.startListening()
      
      // Simulate network error
      mocks.simulateSpeechRecognitionError('network')
      
      await expect(promise).rejects.toThrow('network')
    })
  })

  describe('MediaRecorder Compatibility', () => {
    it('should detect MediaRecorder support', () => {
      setupSpeechMocks()
      
      expect(typeof window.MediaRecorder).toBe('function')
    })

    it('should handle missing MediaRecorder API', () => {
      // Test without MediaRecorder
      expect(window.MediaRecorder).toBeUndefined()
    })

    it('should check supported MIME types', () => {
      setupSpeechMocks()
      
      // Mock isTypeSupported
      window.MediaRecorder.isTypeSupported = jest.fn((type) => {
        return ['audio/webm', 'audio/mp4'].includes(type)
      })
      
      expect(window.MediaRecorder.isTypeSupported('audio/webm')).toBe(true)
      expect(window.MediaRecorder.isTypeSupported('audio/wav')).toBe(false)
    })
  })

  describe('getUserMedia Compatibility', () => {
    it('should detect getUserMedia support', () => {
      setupSpeechMocks()
      
      expect(navigator.mediaDevices?.getUserMedia).toBeDefined()
    })

    it('should handle missing getUserMedia API', () => {
      // Test without getUserMedia
      expect(navigator.mediaDevices?.getUserMedia).toBeUndefined()
    })

    it('should handle permission denied for microphone', async () => {
      const mocks = setupSpeechMocks()
      
      mocks.mockGetUserMedia.mockRejectedValue(
        new Error('Permission denied')
      )
      
      await expect(
        navigator.mediaDevices.getUserMedia({ audio: true })
      ).rejects.toThrow('Permission denied')
    })

    it('should handle device not found errors', async () => {
      const mocks = setupSpeechMocks()
      
      mocks.mockGetUserMedia.mockRejectedValue(
        new Error('Requested device not found')
      )
      
      await expect(
        navigator.mediaDevices.getUserMedia({ audio: true })
      ).rejects.toThrow('Requested device not found')
    })
  })

  describe('Feature Detection', () => {
    it('should provide comprehensive feature detection', () => {
      setupSpeechMocks()
      
      const features = {
        speechSynthesis: 'speechSynthesis' in window,
        speechRecognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
        mediaRecorder: 'MediaRecorder' in window,
        getUserMedia: !!(navigator.mediaDevices?.getUserMedia)
      }
      
      expect(features.speechSynthesis).toBe(true)
      expect(features.speechRecognition).toBe(true)
      expect(features.mediaRecorder).toBe(true)
      expect(features.getUserMedia).toBe(true)
    })

    it('should detect partial support scenarios', () => {
      // Setup only some features
      Object.defineProperty(window, 'speechSynthesis', {
        writable: true,
        value: {}
      })
      
      const features = {
        speechSynthesis: 'speechSynthesis' in window,
        speechRecognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
        mediaRecorder: 'MediaRecorder' in window,
        getUserMedia: !!(navigator.mediaDevices?.getUserMedia)
      }
      
      expect(features.speechSynthesis).toBe(true)
      expect(features.speechRecognition).toBe(false)
      expect(features.mediaRecorder).toBe(false)
      expect(features.getUserMedia).toBe(false)
    })
  })

  describe('Fallback Strategies', () => {
    it('should provide text-only fallback when speech is not supported', () => {
      // No speech mocks - simulating unsupported browser
      
      const synthManager = new SpeechSynthesisManager()
      const recManager = new SpeechRecognitionManager()
      
      expect(synthManager.isSupported()).toBe(false)
      expect(recManager.isSupported()).toBe(false)
      
      // Should not throw when attempting to use unsupported features
      expect(() => synthManager.speak('test')).not.toThrow()
      expect(() => recManager.startListening()).not.toThrow()
    })

    it('should handle mixed support scenarios', () => {
      // Setup only speech synthesis
      Object.defineProperty(window, 'speechSynthesis', {
        writable: true,
        value: {
          speak: jest.fn(),
          cancel: jest.fn(),
          getVoices: jest.fn(() => [])
        }
      })
      
      Object.defineProperty(window, 'SpeechSynthesisUtterance', {
        writable: true,
        value: jest.fn(() => ({
          addEventListener: jest.fn(),
          removeEventListener: jest.fn()
        }))
      })
      
      const synthManager = new SpeechSynthesisManager()
      const recManager = new SpeechRecognitionManager()
      
      expect(synthManager.isSupported()).toBe(true)
      expect(recManager.isSupported()).toBe(false)
    })
  })

  describe('Error Recovery', () => {
    it('should recover from temporary speech synthesis failures', async () => {
      const mocks = setupSpeechMocks()
      
      const manager = new SpeechSynthesisManager()
      
      // First call fails
      mocks.mockSpeechSynthesis.speak.mockImplementationOnce(() => {
        throw new Error('Temporary failure')
      })
      
      // Second call succeeds
      mocks.mockSpeechSynthesis.speak.mockImplementationOnce(() => {
        // Success
      })
      
      // Should handle first failure gracefully
      await expect(manager.speak('test')).resolves.toBeUndefined()
      
      // Should work on retry
      await expect(manager.speak('test')).resolves.toBeUndefined()
    })

    it('should handle speech recognition restart after errors', async () => {
      const mocks = setupSpeechMocks()
      
      const manager = new SpeechRecognitionManager()
      
      // Start listening
      let promise = manager.startListening()
      
      // Simulate error
      mocks.simulateSpeechRecognitionError('audio-capture')
      
      await expect(promise).rejects.toThrow('audio-capture')
      
      // Should be able to start again
      promise = manager.startListening()
      
      // This time succeed
      mocks.simulateSpeechRecognitionResult('Hello world')
      
      await expect(promise).resolves.toBe('Hello world')
    })
  })
})