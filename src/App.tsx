import { useState } from 'react'
import './App.css'
import BackgroundCanvas from './canvas/BackgroundCanvas'
import LoadingScreen from './components/LoadingScreen'
import GreetingCard from './components/GreetingCard'
import SpringGarden from './components/SpringGarden'
import CakeBuilder from './components/CakeBuilder'
import Wishes from './components/Wishes'
import FinalScreen from './components/FinalScreen'

function App() {
  const [loaded, setLoaded] = useState(false)

  return (
    <>
      <BackgroundCanvas />
      {!loaded && <LoadingScreen onComplete={() => setLoaded(true)} />}
      {loaded && (
        <div className="app">
          <GreetingCard />
          <SpringGarden />
          <CakeBuilder />
          <Wishes />
          <FinalScreen />
        </div>
      )}
    </>
  )
}

export default App
