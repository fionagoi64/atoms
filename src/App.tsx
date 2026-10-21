import React, { useState, useEffect, useCallback } from 'react'
import { AtmosCanvas } from './components/AtmosCanvas'
import { IntroScreen } from './components/IntroScreen'
import { FlightHUD } from './components/FlightHUD'
import { AboutModal } from './components/AboutModal'
import { OutroScreen } from './components/OutroScreen'
import gsap from 'gsap'

export const App: React.FC = () => {
  const [isExploring, setIsExploring] = useState(false)
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const [isEnded, setIsEnded] = useState(false)
  const [isOutroVisible, setIsOutroVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const [completion, setCompletion] = useState(0)
  const [seekRatio, setSeekRatio] = useState<number | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1
    const y = -(e.clientY / window.innerHeight) * 2 + 1
    setMousePos({ x, y })
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])

  const handleStartExplore = () => {
    setIsExploring(true)
  }

  const handleProgressChange = useCallback((prog: number, comp: number) => {
    setProgress(prog)
    setCompletion(comp)
    if (prog >= 0.95 && !isEnded) {
      setIsEnded(true)
    }
  }, [isEnded])

  const handleSeek = (ratio: number) => {
    setSeekRatio(ratio)
  }

  // Atmos Ending Restart Flow: Fades body to white/transparent and reloads page
  const handleRestart = () => {
    gsap.to(document.body, {
      opacity: 0,
      duration: 1.0,
      ease: 'none',
      onComplete: () => {
        window.location.reload()
      }
    })
  }

  const handleResetFlight = () => {
    setIsExploring(false)
    setIsAboutOpen(false)
    setIsEnded(false)
    setIsOutroVisible(false)
    setSeekRatio(0)
  }

  return (
    <div className="relative w-full h-screen overflow-hidden select-none">
      {/* 3D WebGL Flight Canvas with Exact Atmos Physics & Slipstream */}
      <AtmosCanvas
        isExploring={isExploring}
        isAboutOpen={isAboutOpen}
        mousePos={mousePos}
        seekRatio={seekRatio}
        onProgressChange={handleProgressChange}
        onExploreStart={handleStartExplore}
        onEndReached={() => setIsOutroVisible(true)}
      />

      {/* Intro Landing Screen & Title */}
      <IntroScreen
        isExploring={isExploring}
        onExplore={handleStartExplore}
        onReset={handleResetFlight}
      />

      {/* Top Controls, Hint & 2px Scrollbar */}
      <FlightHUD
        progress={progress}
        completion={completion}
        isExploring={isExploring}
        isAboutOpen={isAboutOpen}
        isEnded={isEnded}
        onOpenAbout={() => setIsAboutOpen(true)}
        onSeek={handleSeek}
      />

      {/* Authentic Outro Ending Screen */}
      <OutroScreen
        isVisible={isOutroVisible}
        onRestart={handleRestart}
      />

      {/* About & Aviation References Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  )
}

export default App
