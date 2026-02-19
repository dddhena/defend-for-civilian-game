import { useState } from 'react';
import { KeyboardControls } from '@react-three/drei';
// @ts-ignore
import Game from './components/Game';
import './styles/App.css';

// Define keyboard controls mapping
const keyboardMap = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'shoot', keys: ['Mouse0', 'Space'] },
  { name: 'reload', keys: ['KeyR'] },
  { name: 'weapon1', keys: ['Digit1'] },
  { name: 'weapon2', keys: ['Digit2'] },
  { name: 'toggleMode', keys: ['KeyC'] },
  { name: 'pause', keys: ['Escape'] }
];

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gamePaused, setGamePaused] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const startGame = () => {
    setGameStarted(true);
    setGamePaused(false);
  };

  const pauseGame = () => {
    setGamePaused(!gamePaused);
  };

  const quitGame = () => {
    setGameStarted(false);
    setGamePaused(false);
  };

  return (
    <KeyboardControls map={keyboardMap}>
      <div className="App">
        {!gameStarted ? (
          <div className="main-menu">
            <div className="menu-content">
              <h1 className="game-title">SMART CITY SIEGE</h1>
              <p className="game-subtitle">Police vs Terrorists - Protect the City</p>
              
              <div className="menu-buttons">
                <button className="menu-button" onClick={startGame}>
                  START MISSION
                </button>
                <button className="menu-button" onClick={() => setShowInstructions(!showInstructions)}>
                  {showInstructions ? 'BACK' : 'HOW TO PLAY'}
                </button>
                <button className="menu-button" onClick={() => setShowControls(!showControls)}>
                  {showControls ? 'BACK' : 'CONTROLS SETUP'}
                </button>
                <button className="menu-button quit-button" onClick={() => window.location.reload()}>
                  QUIT GAME
                </button>
              </div>

              {showInstructions && (
                <div className="menu-section">
                  <h3>Mission Objectives:</h3>
                  <ul>
                    <li>Eliminate all 15 terrorists</li>
                    <li>Protect civilians (do not harm them!)</li>
                    <li>Use different city districts strategically</li>
                    <li>Switch between foot and vehicle modes</li>
                    <li>Complete the mission with minimal civilian casualties</li>
                  </ul>
                  <p className="hint">Enemies can only shoot you if they can see you! Use cover wisely.</p>
                </div>
              )}

              {showControls && (
                <div className="menu-section controls-section">
                  <h3>Customize Your Controls</h3>
                  <p>Choose your preferred control scheme for the best gaming experience</p>
                  
                  <div className="control-options">
                    <div className="control-group">
                      <h4>Movement Controls:</h4>
                      <div className="control-buttons">
                        <button className="control-button active">WASD Keys</button>
                        <button className="control-button">Arrow Keys</button>
                      </div>
                    </div>
                    
                    <div className="control-group">
                      <h4>Shooting Controls:</h4>
                      <div className="control-buttons">
                        <button className="control-button active">Mouse Click</button>
                        <button className="control-button">Space Bar</button>
                      </div>
                    </div>
                    
                    <div className="control-group">
                      <h4>Camera/Look Controls:</h4>
                      <div className="control-buttons">
                        <button className="control-button active">Mouse Move</button>
                        <button className="control-button">IJKL Keys</button>
                      </div>
                    </div>
                  </div>
                  
                  <button className="save-button" onClick={() => setShowControls(false)}>
                    SAVE & CONTINUE
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Game 
            gamePaused={gamePaused}
            onPause={pauseGame}
            onQuit={quitGame}
          />
        )}
      </div>
    </KeyboardControls>
  );
}

export default App;