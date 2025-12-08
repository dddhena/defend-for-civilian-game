import React, { useEffect, useState } from 'react';
import { FaHeart, FaCrosshairs, FaCar, FaUserFriends, FaMapMarkerAlt, FaMousePointer } from 'react-icons/fa';

const UI = ({ 
  health, 
  ammo, 
  maxAmmo, 
  score, 
  enemiesRemaining, 
  civiliansCount,
  visibleEnemies,
  weapon,
  playerMode,
  carSpeed,
  location,
  message,
  onPause,
  onQuit,
  weaponSpread,
  isShooting,
  isMouseDown
}) => {
  const [showMessage, setShowMessage] = useState(false);
  const [notification, setNotification] = useState('');
  
  useEffect(() => {
    if (message) {
      setShowMessage(true);
      const timer = setTimeout(() => setShowMessage(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  const showTempNotification = (text) => {
    setNotification(text);
    setTimeout(() => setNotification(''), 3000);
  };

  return (
    <div className="ui-container">
      {/* Top-left HUD */}
      <div className="hud-panel">
        <h2 className="hud-title">POLICE OFFICER</h2>
        
        <div className="hud-item">
          <div className="hud-label">
            <FaHeart className="hud-icon" />
            <span>Health:</span>
          </div>
          <div className="hud-value">{Math.max(0, Math.floor(health))}</div>
        </div>
        
        <div className="health-bar-container">
          <div 
            className="health-bar" 
            style={{ width: `${health}%` }}
          ></div>
        </div>
        
        <div className="hud-item">
          <div className="hud-label">
            <FaCrosshairs className="hud-icon" />
            <span>Ammo:</span>
          </div>
          <div className="hud-value">{ammo}/{maxAmmo}</div>
        </div>
        
        <div className="ammo-bar-container">
          <div 
            className="ammo-bar" 
            style={{ width: `${(ammo / 30) * 100}%` }}
          ></div>
        </div>
        
        <div className="hud-item">
          <span>Weapon:</span>
          <span className="hud-value">{weapon}</span>
        </div>
        
        <div className="hud-item">
          <span>Mode:</span>
          <span className="hud-value">{playerMode === 'foot' ? 'On Foot' : 'In Vehicle'}</span>
        </div>
      </div>
      
      {/* Top-right counters */}
      <div className="counter-panel">
        <div className="counter-item enemy-counter">
          <div className="counter-label">TERRORISTS</div>
          <div className="counter-value">{enemiesRemaining}</div>
        </div>
        
        <div className="counter-item civilian-counter">
          <div className="counter-label">CIVILIANS</div>
          <div className="counter-value">{civiliansCount}</div>
        </div>
        
        <div className="counter-item visibility-counter">
          <div className="counter-label">VISIBLE ENEMIES</div>
          <div className="counter-value">{visibleEnemies}</div>
        </div>
      </div>
      
      {/* Score display */}
      <div className="score-display">
        <div className="score-label">SCORE</div>
        <div className="score-value">{score}</div>
      </div>
      
      {/* Location indicator */}
      <div className="location-indicator">
        <FaMapMarkerAlt className="location-icon" />
        <span className="location-text">{location}</span>
      </div>
      
      {/* Car speedometer */}
      {playerMode === 'car' && (
        <div className="speedometer">
          <div className="speedometer-label">SPEED</div>
          <div className="speedometer-value">{Math.round(Math.abs(carSpeed) * 20)} km/h</div>
          <div className="speedometer-hint">Use Arrow Keys to drive</div>
        </div>
      )}
      
      {/* Message display */}
      {showMessage && (
        <div className="message-display">
          {message}
        </div>
      )}
      
      {/* Mouse control status */}
      {playerMode === 'foot' && (
        <div className="mouse-control-status">
          <div className="status-item">
            <FaMousePointer className="status-icon" />
            <span className="status-text">Mouse Aim Active</span>
            <div className={`status-indicator ${isMouseDown ? 'active' : ''}`}></div>
          </div>
          <div className="status-hint">Move cursor to aim, click to shoot</div>
        </div>
      )}
      
      {/* Control buttons */}
      <div className="control-buttons">
        <button className="control-button pause-button" onClick={onPause}>
          PAUSE (ESC)
        </button>
        <button className="control-button quit-button" onClick={onQuit}>
          QUIT GAME
        </button>
        <button className="control-button mode-button" onClick={() => showTempNotification("Press C to toggle mode")}>
          {playerMode === 'foot' ? 'CAR MODE (C)' : 'FOOT MODE (C)'}
        </button>
      </div>
      
      {/* Mouse control instructions */}
      <div className="mouse-instructions">
        <div className="instruction-title">MOUSE CONTROLS</div>
        <div className="instruction-item">
          <span className="instruction-key">Move Mouse</span>
          <span className="instruction-action">Aim Weapon</span>
        </div>
        <div className="instruction-item">
          <span className="instruction-key">Left Click</span>
          <span className="instruction-action">Shoot</span>
        </div>
        <div className="instruction-item">
          <span className="instruction-key">Hold Click</span>
          <span className="instruction-action">Auto-fire</span>
        </div>
      </div>
    </div>
  );
};

export default UI;