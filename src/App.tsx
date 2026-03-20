import { useState } from 'react'
import './App.css'
import BackgroundCanvas from './canvas/BackgroundCanvas'
import LoadingScreen from './components/LoadingScreen'
import Envelope from './components/Envelope'
import Greeting from './components/Greeting'
import MamaMeter from './components/MamaMeter'
import DontPressButton from './components/DontPressButton'
import BalloonGame from './components/BalloonGame'
import CakeBuilder from './components/CakeBuilder'
import HugButton from './components/HugButton'
import FinalScreen from './components/FinalScreen'

function App() {
  const [loaded, setLoaded] = useState(false)

  return (
    <>
      <BackgroundCanvas />
      {!loaded && <LoadingScreen onComplete={() => setLoaded(true)} />}
      {loaded && (
        <div className="app">
          <Envelope />
          <Greeting />
          <MamaMeter />
          <DontPressButton />
          <BalloonGame />
          <CakeBuilder />

          <HugButton />
          <FinalScreen />
        </div>
      )}
    </>
  )
}

export default App
