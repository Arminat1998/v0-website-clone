// Client-side audio analysis using Web Audio API (FREE - no API calls needed)

export interface AudioAnalysisResult {
  genres: string[]
  tempo: string
  energy: string
  mood: string
  confidence: number
}

// Genre mapping based on audio characteristics
const genreProfiles = {
  // High energy, fast tempo genres
  House: { minTempo: 120, maxTempo: 130, energyMin: 0.6, bassHeavy: true },
  Techno: { minTempo: 125, maxTempo: 150, energyMin: 0.7, bassHeavy: true },
  EDM: { minTempo: 128, maxTempo: 140, energyMin: 0.75, bassHeavy: true },
  "Drum & Bass": { minTempo: 160, maxTempo: 180, energyMin: 0.7, bassHeavy: true },
  Trance: { minTempo: 130, maxTempo: 145, energyMin: 0.65, bassHeavy: false },

  // Medium energy genres
  Pop: { minTempo: 100, maxTempo: 130, energyMin: 0.5, bassHeavy: false },
  Dance: { minTempo: 115, maxTempo: 135, energyMin: 0.55, bassHeavy: false },
  "R&B": { minTempo: 60, maxTempo: 100, energyMin: 0.4, bassHeavy: true },
  "Hip-Hop": { minTempo: 80, maxTempo: 115, energyMin: 0.5, bassHeavy: true },
  Reggaeton: { minTempo: 85, maxTempo: 100, energyMin: 0.6, bassHeavy: true },

  // Lower energy genres
  Jazz: { minTempo: 60, maxTempo: 120, energyMin: 0.3, bassHeavy: false },
  Soul: { minTempo: 60, maxTempo: 100, energyMin: 0.35, bassHeavy: false },
  Lounge: { minTempo: 80, maxTempo: 120, energyMin: 0.25, bassHeavy: false },
  Chill: { minTempo: 70, maxTempo: 110, energyMin: 0.2, bassHeavy: false },

  // Rock genres
  Rock: { minTempo: 100, maxTempo: 140, energyMin: 0.6, bassHeavy: false },
  Indie: { minTempo: 90, maxTempo: 130, energyMin: 0.45, bassHeavy: false },

  // Latin genres
  Latin: { minTempo: 90, maxTempo: 130, energyMin: 0.55, bassHeavy: true },
  Salsa: { minTempo: 150, maxTempo: 250, energyMin: 0.6, bassHeavy: false },

  "hip-hop": { minTempo: 80, maxTempo: 115, energyMin: 0.5, bassHeavy: true },
  "r&b": { minTempo: 60, maxTempo: 100, energyMin: 0.4, bassHeavy: true },
  reggaeton: { minTempo: 85, maxTempo: 100, energyMin: 0.6, bassHeavy: true },
  house: { minTempo: 120, maxTempo: 130, energyMin: 0.6, bassHeavy: true },
  techno: { minTempo: 125, maxTempo: 150, energyMin: 0.7, bassHeavy: true },
  edm: { minTempo: 128, maxTempo: 140, energyMin: 0.75, bassHeavy: true },
  electronic: { minTempo: 120, maxTempo: 140, energyMin: 0.6, bassHeavy: true },
  pop: { minTempo: 100, maxTempo: 130, energyMin: 0.5, bassHeavy: false },
  dance: { minTempo: 115, maxTempo: 135, energyMin: 0.55, bassHeavy: false },
  jazz: { minTempo: 60, maxTempo: 120, energyMin: 0.3, bassHeavy: false },
  soul: { minTempo: 60, maxTempo: 100, energyMin: 0.35, bassHeavy: false },
  rock: { minTempo: 100, maxTempo: 140, energyMin: 0.6, bassHeavy: false },
  indie: { minTempo: 90, maxTempo: 130, energyMin: 0.45, bassHeavy: false },
  latin: { minTempo: 90, maxTempo: 130, energyMin: 0.55, bassHeavy: true },
  salsa: { minTempo: 150, maxTempo: 250, energyMin: 0.6, bassHeavy: false },
  lounge: { minTempo: 80, maxTempo: 120, energyMin: 0.25, bassHeavy: false },
  trance: { minTempo: 130, maxTempo: 145, energyMin: 0.65, bassHeavy: false },
}

export async function analyzeAudioFile(file: File): Promise<AudioAnalysisResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

        // Analyze the audio
        const analysis = analyzeAudioBuffer(audioBuffer)

        // Match to genres
        const matchedGenres = matchGenres(analysis)

        // Clean up
        audioContext.close()

        resolve({
          genres: matchedGenres,
          tempo: analysis.estimatedTempo,
          energy: analysis.energyLevel,
          mood: analysis.mood,
          confidence: analysis.confidence,
        })
      } catch (error) {
        console.error("[v0] Audio analysis error:", error)
        // Fallback: analyze filename for genre hints
        const fallbackResult = analyzeFilename(file.name)
        resolve(fallbackResult)
      }
    }

    reader.onerror = () => {
      // Fallback to filename analysis
      const fallbackResult = analyzeFilename(file.name)
      resolve(fallbackResult)
    }

    reader.readAsArrayBuffer(file)
  })
}

function analyzeAudioBuffer(audioBuffer: AudioBuffer) {
  const channelData = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate

  // Calculate RMS energy
  let sumSquares = 0
  for (let i = 0; i < channelData.length; i++) {
    sumSquares += channelData[i] * channelData[i]
  }
  const rms = Math.sqrt(sumSquares / channelData.length)
  const normalizedEnergy = Math.min(rms * 3, 1) // Normalize to 0-1

  // Estimate tempo using zero-crossing rate and peak detection
  const tempo = estimateTempo(channelData, sampleRate)

  // Analyze frequency content for bass detection
  const bassHeavy = analyzeBassContent(channelData, sampleRate)

  // Determine energy level
  let energyLevel: string
  if (normalizedEnergy > 0.7) {
    energyLevel = "High"
  } else if (normalizedEnergy > 0.4) {
    energyLevel = "Medium"
  } else {
    energyLevel = "Low"
  }

  // Determine mood based on energy and tempo
  let mood: string
  if (tempo > 120 && normalizedEnergy > 0.6) {
    mood = "Energetic"
  } else if (tempo > 100 && normalizedEnergy > 0.4) {
    mood = "Upbeat"
  } else if (tempo < 90 && normalizedEnergy < 0.4) {
    mood = "Relaxed"
  } else {
    mood = "Moderate"
  }

  return {
    estimatedTempo: `${tempo} BPM`,
    energyLevel,
    mood,
    normalizedEnergy,
    tempo,
    bassHeavy,
    confidence: 0.7,
  }
}

function estimateTempo(channelData: Float32Array, sampleRate: number): number {
  // Simple tempo estimation using autocorrelation
  const bufferSize = Math.min(channelData.length, sampleRate * 10) // Analyze up to 10 seconds
  const minBPM = 60
  const maxBPM = 180

  // Calculate energy envelope
  const hopSize = Math.floor(sampleRate / 100) // 10ms hops
  const energyEnvelope: number[] = []

  for (let i = 0; i < bufferSize - hopSize; i += hopSize) {
    let energy = 0
    for (let j = 0; j < hopSize; j++) {
      energy += Math.abs(channelData[i + j])
    }
    energyEnvelope.push(energy / hopSize)
  }

  // Count peaks in energy envelope
  let peakCount = 0
  const threshold = Math.max(...energyEnvelope) * 0.5

  for (let i = 1; i < energyEnvelope.length - 1; i++) {
    if (
      energyEnvelope[i] > threshold &&
      energyEnvelope[i] > energyEnvelope[i - 1] &&
      energyEnvelope[i] > energyEnvelope[i + 1]
    ) {
      peakCount++
    }
  }

  // Estimate BPM from peak count
  const durationInSeconds = bufferSize / sampleRate
  const estimatedBPM = (peakCount / durationInSeconds) * 60

  // Clamp to reasonable range and adjust for common tempos
  let tempo = Math.max(minBPM, Math.min(maxBPM, estimatedBPM))

  // If tempo seems off, try to fit to common dance music tempos
  if (tempo < 100) {
    tempo = tempo * 2 // Might be counting half-beats
  }
  if (tempo > 160) {
    tempo = tempo / 2 // Might be counting double-beats
  }

  return Math.round(tempo)
}

function analyzeBassContent(channelData: Float32Array, sampleRate: number): boolean {
  // Simple low-frequency energy analysis
  // For real implementation, you'd use FFT

  // Calculate average absolute value (crude energy measure)
  let totalEnergy = 0
  for (let i = 0; i < Math.min(channelData.length, sampleRate * 5); i++) {
    totalEnergy += Math.abs(channelData[i])
  }

  // If energy is high and consistent, likely bass-heavy
  const avgEnergy = totalEnergy / Math.min(channelData.length, sampleRate * 5)
  return avgEnergy > 0.15
}

function matchGenres(analysis: {
  tempo: number
  normalizedEnergy: number
  bassHeavy: boolean
  confidence: number
}): string[] {
  const matches: { genre: string; score: number }[] = []

  for (const [genre, profile] of Object.entries(genreProfiles)) {
    let score = 0

    // Check tempo match
    if (analysis.tempo >= profile.minTempo && analysis.tempo <= profile.maxTempo) {
      score += 40
    } else {
      // Partial score for close tempos
      const tempoDistance = Math.min(
        Math.abs(analysis.tempo - profile.minTempo),
        Math.abs(analysis.tempo - profile.maxTempo),
      )
      if (tempoDistance < 20) {
        score += 20 - tempoDistance
      }
    }

    // Check energy match
    if (analysis.normalizedEnergy >= profile.energyMin) {
      score += 30
    } else {
      const energyDiff = profile.energyMin - analysis.normalizedEnergy
      if (energyDiff < 0.2) {
        score += 15
      }
    }

    // Check bass match
    if (analysis.bassHeavy === profile.bassHeavy) {
      score += 30
    }

    if (score > 40) {
      matches.push({ genre, score })
    }
  }

  // Sort by score and return top genres
  matches.sort((a, b) => b.score - a.score)

  const topGenres = matches.slice(0, 3).map((m) => m.genre.toLowerCase())

  // Return lowercase genres, or fallback genres if no good matches
  if (topGenres.length === 0) {
    // Default based on general characteristics
    if (analysis.tempo > 120 && analysis.normalizedEnergy > 0.5) {
      return ["house", "dance", "edm"]
    } else if (analysis.tempo > 100) {
      return ["pop", "dance"]
    } else {
      return ["lounge", "chill", "jazz"]
    }
  }

  return topGenres
}

function analyzeFilename(filename: string): AudioAnalysisResult {
  const lowerName = filename.toLowerCase()

  // Check for genre keywords in filename
  const genreKeywords: Record<string, string[]> = {
    house: ["house", "deep house", "tech house"],
    techno: ["techno", "minimal"],
    edm: ["edm", "electro", "electronic"],
    trance: ["trance", "uplifting"],
    pop: ["pop", "chart", "top 40"],
    "hip-hop": ["hip hop", "hiphop", "rap", "trap"],
    "r&b": ["r&b", "rnb", "soul"],
    jazz: ["jazz", "swing"],
    rock: ["rock", "indie", "alternative"],
    latin: ["latin", "reggaeton", "salsa", "bachata"],
    dance: ["dance", "club", "party"],
    "drum & bass": ["dnb", "drum and bass", "jungle"],
  }

  const foundGenres: string[] = []

  for (const [genre, keywords] of Object.entries(genreKeywords)) {
    for (const keyword of keywords) {
      if (lowerName.includes(keyword)) {
        foundGenres.push(genre)
        break
      }
    }
  }

  // Default genres if nothing found (lowercase)
  if (foundGenres.length === 0) {
    foundGenres.push("house", "dance", "pop")
  }

  return {
    genres: foundGenres.slice(0, 3),
    tempo: "Unknown",
    energy: "Medium",
    mood: "Upbeat",
    confidence: 0.5,
  }
}
