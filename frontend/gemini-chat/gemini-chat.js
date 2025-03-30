// Chef Chat Widget Module
const ChefChat = {
    // Properties
    container: null,
    chatButton: null,
    speechBubble: null,
    isRecording: false,
    recognition: null,
    synth: window.speechSynthesis,
    selectedVoice: null,
    speaking: false,
    currentSpeech: null,

    // Initialize the chat
    init() {
        console.log('Initializing Chef Chat...'); // Debug log
        
        if (this.isInitialized) {
            console.log('Already initialized, skipping...'); // Debug log
            return;
        }

        // Get existing container if it exists
        this.container = document.getElementById('chef-chat-container');
        
        if (!this.container) {
            console.log('Creating new container...'); // Debug log
            // Create container
            this.container = document.createElement('div');
            this.container.id = 'chef-chat-container';
            this.container.innerHTML = `
                <button class="chef-chat-button" title="Click to start/stop recording">
                    <svg class="chef-hat-icon" viewBox="0 0 512 512" width="24" height="24">
                        <path fill="currentColor" d="M425.5 125.3c0-44.5-36.1-80.6-80.6-80.6-16.6 0-32 5-44.9 13.5C284.7 22.3 249.2 0 208.8 0c-40.4 0-75.9 22.3-91.2 58.2-12.9-8.5-28.3-13.5-44.9-13.5-44.5 0-80.6 36.1-80.6 80.6 0 23.6 10.2 44.8 26.4 59.5v161.7c0 27.4 22.2 49.6 49.6 49.6h281.4c27.4 0 49.6-22.2 49.6-49.6V184.8c16.2-14.7 26.4-35.9 26.4-59.5z"/>
                    </svg>
                    <span>CHEF CHAT</span>
                </button>
                <div class="speech-bubble"></div>
            `;
            document.body.appendChild(this.container);
        }

        // Get references to elements
        this.chatButton = this.container.querySelector('.chef-chat-button');
        this.speechBubble = this.container.querySelector('.speech-bubble');

        console.log('Initializing speech recognition...'); // Debug log
        // Initialize speech recognition
        this.initializeSpeechRecognition();

        console.log('Adding styles...'); // Debug log
        // Add styles
        this.addStyles();

        console.log('Initializing event listeners...'); // Debug log
        // Initialize event listeners
        this.initializeEventListeners();

        this.isInitialized = true;
        console.log('Chef Chat initialization complete!'); // Debug log
    },

    // Initialize speech recognition
    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.handleSpeechInput(transcript);
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopRecording();
            };

            this.recognition.onend = () => {
                this.stopRecording();
            };
        } else {
            console.error('Speech recognition not supported');
        }
    },

    // Start recording
    startRecording() {
        if (!this.recognition) return;
        
        this.isRecording = true;
        this.chatButton.classList.add('recording');
        this.chatButton.title = 'Click to stop recording';
        this.speechBubble.textContent = 'Listening...';
        this.speechBubble.classList.add('show');
        this.recognition.start();
    },

    // Stop recording
    stopRecording() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        this.chatButton.classList.remove('recording');
        this.chatButton.title = 'Click to start recording';
        this.speechBubble.textContent = 'Processing...';
        this.recognition.stop();
    },

    // Toggle recording
    toggleRecording() {
        if (this.speaking) {
            // If currently speaking, stop it and start recording
            window.speechSynthesis.cancel();
            this.speaking = false;
            this.currentSpeech = null;
            // Clear the speech bubble
            this.speechBubble.classList.remove('show');
            setTimeout(() => {
                this.startRecording();
            }, 100); // Small delay to ensure clean transition
        } else if (!this.isRecording) {
            this.startRecording();
        } else {
            this.stopRecording();
        }
    },

    // Handle speech input
    async handleSpeechInput(transcript) {
        this.speechBubble.textContent = transcript;
        this.speechBubble.classList.add('show');
        this.isProcessing = true;

        try {
            console.log('Sending request to backend:', transcript); // Debug log
            const response = await fetch('https://ai-menu-backend.onrender.com/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Origin': window.location.origin
                },
                credentials: 'include',
                body: JSON.stringify({ 
                    message: transcript,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received response:', data); // Debug log

            if (!data || !data.message) {
                throw new Error('Invalid response format from server');
            }

            // Handle different response types
            if (data.type === 'navigation') {
                console.log('Navigation requested for product:', data.productId); // Debug log
                this.speechBubble.textContent = data.message;
                this.speakMessage(data.message);
                
                // Navigate after a short delay
                setTimeout(() => {
                    console.log('Navigating to:', `product.html?id=${data.productId}`); // Debug log
                    window.location.href = `product.html?id=${data.productId}`;
                }, 1500);
            } 
            else if (data.type === 'info_and_navigate') {
                console.log('Info and navigation requested for product:', data.productId); // Debug log
                this.speechBubble.textContent = data.message;
                this.speakMessage(data.message);
                
                // Navigate after a longer delay to allow for the info to be heard
                setTimeout(() => {
                    console.log('Navigating to:', `product.html?id=${data.productId}`); // Debug log
                    window.location.href = `product.html?id=${data.productId}`;
                }, 5000);
            }
            else {
                // Handle regular message
                this.speechBubble.textContent = data.message;
                this.speakMessage(data.message);
            }

            // Trigger the scrolling text animation
            window.dispatchEvent(new CustomEvent('gemini-response', {
                detail: { text: data.message }
            }));

        } catch (error) {
            console.error('Error in handleSpeechInput:', error);
            this.speechBubble.textContent = `Error: ${error.message}. Please try again.`;
            this.speechBubble.classList.add('show');
        } finally {
            // Auto-hide speech bubble after 4 seconds
            setTimeout(() => {
                this.speechBubble.classList.remove('show');
            }, 4000);
        }
    },

    // Speak message
    speakMessage(text) {
        if (this.speaking) {
            window.speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        if (this.selectedVoice) {
            utterance.voice = this.selectedVoice;
        }

        this.speaking = true;
        this.currentSpeech = utterance;

        utterance.onend = () => {
            this.speaking = false;
            this.currentSpeech = null;
            // Hide speech bubble when speech ends
            setTimeout(() => {
                this.speechBubble.classList.remove('show');
            }, 1000);
        };

        utterance.onstart = () => {
            this.speaking = true;
        };

        utterance.onerror = () => {
            this.speaking = false;
            this.currentSpeech = null;
        };

        window.speechSynthesis.speak(utterance);
    },

    // Add styles
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #chef-chat-container {
                position: fixed !important;
                top: 20px !important;
                left: 20px !important;
                z-index: 9999 !important;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            }

            .chef-chat-button {
                background: var(--accent) !important;
                color: #2C1810 !important;
                border: none !important;
                padding: 12px 24px !important;
                border-radius: 30px !important;
                cursor: pointer !important;
                font-weight: 600 !important;
                font-size: 16px !important;
                text-transform: uppercase !important;
                letter-spacing: 0.5px !important;
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
                transition: all 0.3s ease !important;
                box-shadow: 0 4px 15px rgba(212, 176, 140, 0.3) !important;
                width: 200px !important;
                height: 45px !important;
                justify-content: center !important;
                white-space: nowrap !important;
            }

            .chef-hat-icon {
                width: 24px !important;
                height: 24px !important;
                margin-right: 2px !important;
                flex-shrink: 0 !important;
            }

            .chef-chat-button span {
                font-family: 'Poppins', sans-serif !important;
                font-weight: 600 !important;
                margin-left: 2px !important;
            }

            .chef-chat-button:hover {
                background: #E5C9B3 !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 6px 20px rgba(212, 176, 140, 0.4) !important;
            }

            .chef-chat-button.recording {
                background: #E5C9B3 !important;
                animation: pulse 1.5s infinite !important;
                box-shadow: 0 0 0 0 rgba(212, 176, 140, 0.4) !important;
            }

            .speech-bubble {
                position: absolute !important;
                top: 60px !important;
                left: 0 !important;
                background: rgba(44, 24, 16, 0.95) !important;
                color: #D4B08C !important;
                padding: 15px 20px !important;
                border-radius: 15px !important;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2) !important;
                min-width: 250px !important;
                max-width: 400px !important;
                display: none !important;
                z-index: 9999 !important;
                font-size: 14px !important;
                line-height: 1.5 !important;
                transform: translateY(10px) !important;
                transition: all 0.3s ease !important;
                border: 1px solid rgba(212, 176, 140, 0.2) !important;
            }

            .speech-bubble::before {
                content: '' !important;
                position: absolute !important;
                top: -10px !important;
                left: 20px !important;
                border-left: 10px solid transparent !important;
                border-right: 10px solid transparent !important;
                border-bottom: 10px solid rgba(44, 24, 16, 0.95) !important;
            }

            .speech-bubble.show {
                display: block !important;
                transform: translateY(0) !important;
                animation: fadeIn 0.3s ease !important;
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes pulse {
                0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 176, 140, 0.4); }
                70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(212, 176, 140, 0); }
                100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(212, 176, 140, 0); }
            }
        `;
        document.head.appendChild(style);
    },

    // Initialize event listeners
    initializeEventListeners() {
        // Remove any existing event listeners
        this.chatButton.removeEventListener('click', this.toggleRecording.bind(this));
        
        // Add click event listener to the chat button
        this.chatButton.addEventListener('click', () => {
            console.log('Chat button clicked'); // Debug log
            this.toggleRecording();
        });

        // Add keyboard shortcut (Spacebar)
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isTyping) {
                e.preventDefault();
                this.toggleRecording();
            }
        });
    }
};

// Initialize Chef Chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    ChefChat.init();
}); 