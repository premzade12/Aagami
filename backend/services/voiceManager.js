import axios from 'axios';
import Buffer from 'buffer';

// Coqui TTS voices for different languages
export const AVAILABLE_VOICES = {
  "en-US": { name: "Jenny", gender: "Female", language: "English" },
  "hi-IN": { name: "Aditi", gender: "Female", language: "Hindi" },
  "mr-IN": { name: "Priya", gender: "Female", language: "Marathi" }
};

export const getAvailableVoices = async () => {
  return Object.entries(AVAILABLE_VOICES).map(([id, info]) => ({
    voice_id: id,
    name: info.name,
    category: info.gender,
    description: `${info.gender} - ${info.language}`
  }));
};

export const generateSpeechWithVoice = async (text, voiceId = "en-US", language = 'en-US') => {
  console.log('🔊 generateSpeechWithVoice called with:', { text, language });
  
  try {
    // Use ElevenLabs for young, smooth female voices
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    
    if (!ELEVENLABS_API_KEY) {
      console.log('❌ ElevenLabs API key not found');
      throw new Error('No ElevenLabs API key');
    }
    
    // Young, smooth female voices from ElevenLabs
    const elevenLabsVoices = {
      'en-US': 'EXAVITQu4vr4xnSDxMaL', // Bella - Young, smooth female
      'hi-IN': 'pNInz6obpgDQGcFmaJgB', // Adam - Can handle Hindi with young tone
      'mr-IN': 'pNInz6obpgDQGcFmaJgB'  // Fallback to Adam for Marathi
    };
    
    const selectedVoiceId = elevenLabsVoices[language] || elevenLabsVoices['en-US'];
    console.log(`🎤 Using ElevenLabs young female voice: ${selectedVoiceId}`);
    
    // ElevenLabs API call with teenage voice settings
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
      {
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.3,        // Lower for more youthful variation
          similarity_boost: 0.9, // High similarity
          style: 0.4,           // More expressive/youthful
          use_speaker_boost: true
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        responseType: 'arraybuffer',
        timeout: 15000
      }
    );
    
    // Convert to base64 data URL
    const audioBuffer = Buffer.from(response.data);
    const base64Audio = audioBuffer.toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
    
    console.log('✅ ElevenLabs young female voice generated successfully');
    return audioUrl;
    
  } catch (error) {
    console.error('❌ ElevenLabs TTS failed:', error.message);
    
    // Fallback to ResponsiveVoice with young female voice
    try {
      const encodedText = encodeURIComponent(text.substring(0, 200));
      const voiceNames = {
        'en-US': 'US English Female',
        'hi-IN': 'Hindi Female',
        'mr-IN': 'Hindi Female'
      };
      
      const voiceName = voiceNames[language] || 'US English Female';
      const audioUrl = `https://responsivevoice.org/responsivevoice/getvoice.php?t=${encodedText}&tl=${language}&sv=${encodeURIComponent(voiceName)}&pitch=1.2&rate=1.1&vol=0.9`;
      
      console.log(`🎤 Using ResponsiveVoice young female fallback`);
      return audioUrl;
    } catch (fallbackError) {
      console.error('❌ All TTS services failed');
      return null;
    }
  }
};

export default { getAvailableVoices, generateSpeechWithVoice, AVAILABLE_VOICES };