/**
 * Mock implementations for Speech APIs used in testing
 */

// Mock SpeechSynthesis API
export const createMockSpeechSynthesis = () => {
  const mockUtterance = {
    text: '',
    voice: null,
    volume: 1,
    rate: 1,
    pitch: 1,
    lang: 'en-US',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    onstart: null,
    onend: null,
    onerror: null,
    onpause: null,
    onresume: null,
    onmark: null,
    onboundary: null
  }

  const mockSpeechSynthesis = {
    speaking: false,
    pending: false,
    paused: false,
    speak: jest.fn((utterance) => {
      mockSpeechSynthesis.speaking = true
      mockSpeechSynthesis.pending = false
      
      // Simulate speech start
      setTimeout(() => {
        if (utterance.onstart) utterance.onstart()
        utterance.addEventListener.mock.calls
          .filter(call => call[0] === 'start')
          .forEach(call => call[1]())
      }, 10)
      
      // Simulate speech end
      setTimeout(() => {
        mockSpeechSynthesis.speaking = false
        if (utterance.onend) utterance.onend()
        utterance.addEventListener.mock.calls
          .filter(call => call[0] === 'end')
          .forEach(call => call[1]())
      }, 100)
    }),
    cancel: jest.fn(() => {
      mockSpeechSynthesis.speaking = false
      mockSpeechSynthesis.pending = false
    }),
    pause: jest.fn(() => {
      mockSpeechSynthesis.paused = true
    }),
    resume: jest.fn(() => {
      mockSpeechSynthesis.paused = false
    }),
    getVoices: jest.fn(() => [
      {
        name: 'Test Voice 1',
        lang: 'en-US',
        gender: 'female',
        localService: true,
        default: true
      },
      {
        name: 'Test Voice 2',
        lang: 'en-GB',
        gender: 'male',
        localService: true,
        default: false
      }
    ]),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    onvoiceschanged: null
  }

  return { mockSpeechSynthesis, mockUtterance }
}

// Mock SpeechRecognition API
export const createMockSpeechRecognition = () => {
  const mockSpeechRecognition = {
    continuous: false,
    interimResults: false,
    lang: 'en-US',
    maxAlternatives: 1,
    serviceURI: '',
    grammars: null,
    start: jest.fn(() => {
      mockSpeechRecognition.started = true
      setTimeout(() => {
        if (mockSpeechRecognition.onstart) {
          mockSpeechRecognition.onstart()
        }
      }, 10)
    }),
    stop: jest.fn(() => {
      mockSpeechRecognition.started = false
      setTimeout(() => {
        if (mockSpeechRecognition.onend) {
          mockSpeechRecognition.onend()
        }
      }, 10)
    }),
    abort: jest.fn(() => {
      mockSpeechRecognition.started = false
      setTimeout(() => {
        if (mockSpeechRecognition.onend) {
          mockSpeechRecognition.onend()
        }
      }, 10)
    }),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    onstart: null,
    onend: null,
    onerror: null,
    onresult: null,
    onnomatch: null,
    onsoundstart: null,
    onsoundend: null,
    onspeechstart: null,
    onspeechend: null,
    onaudiostart: null,
    onaudioend: null,
    started: false
  }

  return mockSpeechRecognition
}

// Mock MediaRecorder API
export const createMockMediaRecorder = () => {
  const mockMediaRecorder = {
    state: 'inactive',
    mimeType: 'audio/webm',
    stream: null,
    start: jest.fn((timeslice) => {
      mockMediaRecorder.state = 'recording'
      setTimeout(() => {
        if (mockMediaRecorder.onstart) {
          mockMediaRecorder.onstart()
        }
      }, 10)
    }),
    stop: jest.fn(() => {
      mockMediaRecorder.state = 'inactive'
      setTimeout(() => {
        // Simulate dataavailable event
        if (mockMediaRecorder.ondataavailable) {
          const mockBlob = new Blob(['mock audio data'], { type: 'audio/webm' })
          mockMediaRecorder.ondataavailable({ data: mockBlob })
        }
        
        if (mockMediaRecorder.onstop) {
          mockMediaRecorder.onstop()
        }
      }, 10)
    }),
    pause: jest.fn(() => {
      mockMediaRecorder.state = 'paused'
      if (mockMediaRecorder.onpause) {
        mockMediaRecorder.onpause()
      }
    }),
    resume: jest.fn(() => {
      mockMediaRecorder.state = 'recording'
      if (mockMediaRecorder.onresume) {
        mockMediaRecorder.onresume()
      }
    }),
    requestData: jest.fn(() => {
      if (mockMediaRecorder.ondataavailable) {
        const mockBlob = new Blob(['mock audio data'], { type: 'audio/webm' })
        mockMediaRecorder.ondataavailable({ data: mockBlob })
      }
    }),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    onstart: null,
    onstop: null,
    onpause: null,
    onresume: null,
    ondataavailable: null,
    onerror: null
  }

  return mockMediaRecorder
}

// Mock getUserMedia
export const createMockGetUserMedia = () => {
  const mockStream = {
    id: 'mock-stream-id',
    active: true,
    getTracks: jest.fn(() => [
      {
        id: 'mock-audio-track',
        kind: 'audio',
        enabled: true,
        muted: false,
        stop: jest.fn()
      }
    ]),
    getAudioTracks: jest.fn(() => [
      {
        id: 'mock-audio-track',
        kind: 'audio',
        enabled: true,
        muted: false,
        stop: jest.fn()
      }
    ]),
    getVideoTracks: jest.fn(() => []),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    clone: jest.fn(() => mockStream)
  }

  return {
    mockGetUserMedia: jest.fn(() => Promise.resolve(mockStream)),
    mockStream
  }
}

// Utility to simulate speech recognition results
export const simulateSpeechRecognitionResult = (recognition, transcript, confidence = 0.9, isFinal = true) => {
  const mockEvent = {
    results: [
      [
        {
          transcript,
          confidence
        }
      ]
    ],
    resultIndex: 0,
    results: {
      0: [
        {
          transcript,
          confidence,
          isFinal
        }
      ],
      length: 1
    }
  }

  if (recognition.onresult) {
    recognition.onresult(mockEvent)
  }

  // Also trigger event listeners
  recognition.addEventListener.mock.calls
    .filter(call => call[0] === 'result')
    .forEach(call => call[1](mockEvent))
}

// Utility to simulate speech recognition error
export const simulateSpeechRecognitionError = (recognition, error = 'network') => {
  const mockErrorEvent = {
    error,
    message: `Speech recognition error: ${error}`
  }

  if (recognition.onerror) {
    recognition.onerror(mockErrorEvent)
  }

  recognition.addEventListener.mock.calls
    .filter(call => call[0] === 'error')
    .forEach(call => call[1](mockErrorEvent))
}

// Setup function to mock all speech APIs
export const setupSpeechMocks = () => {
  const { mockSpeechSynthesis, mockUtterance } = createMockSpeechSynthesis()
  const mockSpeechRecognition = createMockSpeechRecognition()
  const mockMediaRecorder = createMockMediaRecorder()
  const { mockGetUserMedia, mockStream } = createMockGetUserMedia()

  // Mock global objects
  Object.defineProperty(window, 'speechSynthesis', {
    writable: true,
    value: mockSpeechSynthesis
  })

  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    writable: true,
    value: jest.fn(() => ({ ...mockUtterance }))
  })

  Object.defineProperty(window, 'SpeechRecognition', {
    writable: true,
    value: jest.fn(() => ({ ...mockSpeechRecognition }))
  })

  Object.defineProperty(window, 'webkitSpeechRecognition', {
    writable: true,
    value: jest.fn(() => ({ ...mockSpeechRecognition }))
  })

  Object.defineProperty(window, 'MediaRecorder', {
    writable: true,
    value: jest.fn(() => ({ ...mockMediaRecorder }))
  })

  Object.defineProperty(navigator, 'mediaDevices', {
    writable: true,
    value: {
      getUserMedia: mockGetUserMedia
    }
  })

  return {
    mockSpeechSynthesis,
    mockSpeechRecognition,
    mockMediaRecorder,
    mockGetUserMedia,
    mockStream,
    simulateSpeechRecognitionResult: (transcript, confidence, isFinal) => 
      simulateSpeechRecognitionResult(mockSpeechRecognition, transcript, confidence, isFinal),
    simulateSpeechRecognitionError: (error) => 
      simulateSpeechRecognitionError(mockSpeechRecognition, error)
  }
}

// Cleanup function
export const cleanupSpeechMocks = () => {
  delete window.speechSynthesis
  delete window.SpeechSynthesisUtterance
  delete window.SpeechRecognition
  delete window.webkitSpeechRecognition
  delete window.MediaRecorder
  delete navigator.mediaDevices
}