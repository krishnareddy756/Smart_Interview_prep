/**
 * Speech Service for handling text-to-speech and speech recognition
 */

class SpeechService {
  constructor() {
    this.synthesis = window.speechSynthesis
    this.recognition = null
    this.currentUtterance = null
    this.isSupported = this.checkBrowserSupport()
    
    // Initialize speech recognition if available
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      this.recognition = new SpeechRecognition()
      this.setupRecognition()
    }
  }

  /**
   * Check browser support for speech APIs
   * @returns {Object} Support status for different speech features
   */
  checkBrowserSupport() {
    return {
      synthesis: 'speechSynthesis' in window,
      recognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
      mediaRecorder: 'MediaRecorder' in window
    }
  }

  /**
   * Setup speech recognition configuration
   */
  setupRecognition() {
    if (!this.recognition) return

    this.recognition.continuous = false
    this.recognition.interimResults = false
    this.recognition.lang = 'en-US'
    this.recognition.maxAlternatives = 1
  }

  /**
   * Speak text using text-to-speech
   * @param {string} text - Text to speak
   * @param {Object} options - Speech options
   * @returns {Promise<void>}
   */
  async speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isSupported.synthesis) {
        reject(new Error('Text-to-speech not supported in this browser'))
        return
      }

      // Stop any current speech
      this.stopSpeaking()

      this.currentUtterance = new SpeechSynthesisUtterance(text)
      
      // Configure utterance
      this.currentUtterance.rate = options.rate || 0.9
      this.currentUtterance.pitch = options.pitch || 1
      this.currentUtterance.volume = options.volume || 1
      this.currentUtterance.lang = options.lang || 'en-US'

      // Set voice if specified
      if (options.voice) {
        const voices = this.synthesis.getVoices()
        const selectedVoice = voices.find(voice => voice.name === options.voice)
        if (selectedVoice) {
          this.currentUtterance.voice = selectedVoice
        }
      }

      // Event handlers
      this.currentUtterance.onend = () => {
        this.currentUtterance = null
        resolve()
      }

      this.currentUtterance.onerror = (event) => {
        this.currentUtterance = null
        // Don't reject on 'interrupted' error, just resolve
        if (event.error === 'interrupted') {
          resolve()
        } else {
          reject(new Error(`Speech synthesis error: ${event.error}`))
        }
      }

      this.currentUtterance.onstart = () => {
        console.log('Speech started')
      }

      // Start speaking
      this.synthesis.speak(this.currentUtterance)
    })
  }

  /**
   * Stop current speech
   */
  stopSpeaking() {
    if (this.synthesis.speaking) {
      this.synthesis.cancel()
    }
    this.currentUtterance = null
  }

  /**
   * Check if currently speaking
   * @returns {boolean}
   */
  isSpeaking() {
    return this.synthesis.speaking
  }

  /**
   * Start speech recognition
   * @param {Object} options - Recognition options
   * @returns {Promise<string>} Recognized text
   */
  async startRecognition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isSupported.recognition) {
        reject(new Error('Speech recognition not supported in this browser'))
        return
      }

      if (!this.recognition) {
        reject(new Error('Speech recognition not initialized'))
        return
      }

      // Stop any existing recognition first
      try {
        this.recognition.stop()
      } catch (e) {
        // Ignore errors when stopping
      }

      // Configure recognition
      this.recognition.continuous = options.continuous || false
      this.recognition.interimResults = options.interimResults || false
      this.recognition.lang = options.lang || 'en-US'

      let finalTranscript = ''
      let isResolved = false

      // Event handlers
      this.recognition.onresult = (event) => {
        let interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        // Call progress callback if provided
        if (options.onProgress) {
          options.onProgress({
            final: finalTranscript,
            interim: interimTranscript,
            isFinal: event.results[event.results.length - 1].isFinal
          })
        }

        // Resolve when we have final results and not continuous mode
        if (finalTranscript && !options.continuous && !isResolved) {
          isResolved = true
          resolve(finalTranscript.trim())
        }
      }

      this.recognition.onerror = (event) => {
        if (!isResolved) {
          isResolved = true
          reject(new Error(`Speech recognition error: ${event.error}`))
        }
      }

      this.recognition.onend = () => {
        if (!isResolved) {
          isResolved = true
          resolve(finalTranscript.trim())
        }
      }

      this.recognition.onstart = () => {
        console.log('Speech recognition started')
        if (options.onStart) {
          options.onStart()
        }
      }

      // Start recognition
      try {
        this.recognition.start()
      } catch (error) {
        reject(new Error(`Failed to start speech recognition: ${error.message}`))
      }
    })
  }

  /**
   * Stop speech recognition
   */
  stopRecognition() {
    if (this.recognition) {
      this.recognition.stop()
    }
  }

  /**
   * Get available voices for text-to-speech
   * @returns {Array} Available voices
   */
  getVoices() {
    if (!this.isSupported.synthesis) return []
    
    return this.synthesis.getVoices().map(voice => ({
      name: voice.name,
      lang: voice.lang,
      gender: voice.name.toLowerCase().includes('female') ? 'female' : 'male',
      isDefault: voice.default
    }))
  }

  /**
   * Request microphone permission with mobile-specific handling
   * @returns {Promise<boolean>} Permission granted
   */
  async requestMicrophonePermission() {
    try {
      // Check if we're on mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      if (isMobile) {
        // On mobile, we need to request permission in response to user interaction
        console.log('Mobile device detected - requesting microphone permission')
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Mobile-specific constraints
          ...(isMobile && {
            sampleRate: 16000,
            channelCount: 1
          })
        }
      })
      
      // Stop the stream immediately as we just needed permission
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      console.error('Microphone permission denied:', error)
      
      // Provide more specific error messages for mobile
      if (error.name === 'NotAllowedError') {
        throw new Error('Microphone access denied. Please enable microphone permissions in your browser settings.')
      } else if (error.name === 'NotFoundError') {
        throw new Error('No microphone found. Please check your device settings.')
      } else if (error.name === 'NotSupportedError') {
        throw new Error('Microphone access not supported on this device.')
      }
      
      return false
    }
  }

  /**
   * Check if device is mobile
   * @returns {boolean} Is mobile device
   */
  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  /**
   * Get mobile-optimized speech settings
   * @returns {Object} Optimized settings for mobile
   */
  getMobileOptimizedSettings() {
    if (!this.isMobileDevice()) {
      return {}
    }

    return {
      synthesis: {
        rate: 0.8, // Slower rate for better mobile speaker quality
        pitch: 1.0,
        volume: 0.9
      },
      recognition: {
        continuous: false, // Better for mobile battery
        interimResults: true, // Show progress on mobile
        maxAlternatives: 1
      }
    }
  }

  /**
   * Record audio using MediaRecorder (fallback for speech recognition)
   * @param {number} maxDuration - Maximum recording duration in ms
   * @returns {Promise<Blob>} Audio blob
   */
  async recordAudio(maxDuration = 30000) {
    return new Promise(async (resolve, reject) => {
      if (!this.isSupported.mediaRecorder) {
        reject(new Error('Audio recording not supported in this browser'))
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        const audioChunks = []

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data)
        }

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
          stream.getTracks().forEach(track => track.stop())
          resolve(audioBlob)
        }

        mediaRecorder.onerror = (event) => {
          stream.getTracks().forEach(track => track.stop())
          reject(new Error(`Recording error: ${event.error}`))
        }

        // Start recording
        mediaRecorder.start()

        // Stop recording after maxDuration
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop()
          }
        }, maxDuration)

        // Return recorder instance for manual control
        return mediaRecorder

      } catch (error) {
        reject(new Error(`Failed to start recording: ${error.message}`))
      }
    })
  }

  /**
   * Test speech functionality
   * @returns {Promise<Object>} Test results
   */
  async testSpeechFunctionality() {
    const results = {
      synthesis: false,
      recognition: false,
      microphone: false,
      voices: []
    }

    // Test synthesis
    if (this.isSupported.synthesis) {
      try {
        await this.speak('Testing speech synthesis', { rate: 1.5 })
        results.synthesis = true
        results.voices = this.getVoices()
      } catch (error) {
        console.error('Synthesis test failed:', error)
      }
    }

    // Test microphone access
    try {
      results.microphone = await this.requestMicrophonePermission()
    } catch (error) {
      console.error('Microphone test failed:', error)
    }

    // Test recognition (if microphone is available)
    if (this.isSupported.recognition && results.microphone) {
      try {
        // Quick recognition test (will timeout after 2 seconds)
        const testPromise = this.startRecognition({ continuous: false })
        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve('timeout'), 2000))
        
        const result = await Promise.race([testPromise, timeoutPromise])
        results.recognition = result !== 'timeout'
        
        this.stopRecognition()
      } catch (error) {
        console.error('Recognition test failed:', error)
      }
    }

    return results
  }
}

// Create singleton instance
const speechService = new SpeechService()

export default speechService