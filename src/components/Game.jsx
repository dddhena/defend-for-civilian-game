import React, { Suspense, useState, useEffect, useRef } from 'react';

import { Canvas } from '@react-three/fiber';
import { Sky, Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';
import City from './City';
import Player from './Player';
import Enemy from './Enemy';
import Civilian from './Civilian';
import Vehicle from './Vehicle';
import UI from './UI';
import Controls from './Controls';
import '../styles/App.css';

const Game = ({ gamePaused, onPause, onQuit }) => {
  const [health, setHealth] = useState(100);
  const [ammo, setAmmo] = useState(30);
  const [maxAmmo, setMaxAmmo] = useState(120);
  const [score, setScore] = useState(0);
  const [enemiesRemaining, setEnemiesRemaining] = useState(15);
  const [civiliansCount, setCiviliansCount] = useState(50);
  const [playerMode, setPlayerMode] = useState('foot');
  const [carSpeed, setCarSpeed] = useState(0);
  const [visibleEnemies, setVisibleEnemies] = useState(0);
  const [weapon, setWeapon] = useState('rifle');
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState('Downtown District');
  const [bullets, setBullets] = useState([]);
  const [enemyBullets, setEnemyBullets] = useState([]);
  const [isShooting, setIsShooting] = useState(false);
  const [hitMarkerActive, setHitMarkerActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [damageDebug, setDamageDebug] = useState('');
  const [isReloading, setIsReloading] = useState(false);
  const [reloadProgress, setReloadProgress] = useState(0);
  
  const playerRef = useRef();
  const cameraRef = useRef();
  const sceneRef = useRef();
  const enemiesRef = useRef([]);
  const canvasRef = useRef();
  // Add state for civilian tracking
const [civilianDeaths, setCivilianDeaths] = useState(0);
// Add state for car entry/exit cooldown
const [carCooldown, setCarCooldown] = useState(false);


// Add E key handler for exiting car
useEffect(() => {
  const handleKeyDown = (e) => {
    if (gamePaused || gameOver || isReloading) return;

    switch(e.key.toLowerCase()) {
      case 'e': // E key to exit car
        if (playerMode === 'car' && !carCooldown) {
          togglePlayerMode();
        }
        break;
      // ... other key handlers ...
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [gamePaused, weapon, ammo, maxAmmo, gameOver, isReloading, playerMode, carCooldown]);
const Civilian = ({ index, playerRef, enemiesRef, onKilled }) => {
  // ... existing code ...
  
  // When civilian health reaches 0
  if (health <= 0 && state !== 'dead') {
    setState('dead');
    if (onKilled) {
      onKilled(); // Notify parent that civilian was killed
    }
    return null; // Don't render if dead
  }
  
  // ... rest of the component ...
};

// In Game.js, update the Civilian components
{Array.from({ length: 50 }).map((_, i) => (
  <Civilian 
    key={`civilian-${i}`} 
    index={i} 
    playerRef={playerRef}
    enemiesRef={enemiesRef}
    onKilled={() => {
      setCiviliansCount(prev => prev - 1);
      setCivilianDeaths(prev => prev + 1);
      
      // Check if too many civilians died
      if (civilianDeaths + 1 > 25) { // More than 50% killed
        setMessage("MISSION FAILED! TOO MANY CIVILIANS KILLED!");
        setGameOver(true);
      }
    }}
  />
))}

  const weapons = {
    rifle: { 
      name: 'Assault Rifle', 
      damage: 35, 
      fireRate: 150,
      ammoPerShot: 1, 
      range: 200, 
      spread: 0.01,
      auto: true,
      reloadTime: 2000 // 2 seconds reload time
    },
    pistol: { 
      name: 'Pistol', 
      damage: 20, 
      fireRate: 500, 
      ammoPerShot: 1, 
      range: 100, 
      spread: 0.05,
      auto: false,
      reloadTime: 1500 // 1.5 seconds reload time
    }
  };

  // Handle shooting
  const handleShoot = () => {
    if (gamePaused || gameOver || ammo <= 0 || isReloading) {
      if (ammo <= 0 && !isReloading) {
        // AUTO-RELOAD WHEN AMMO IS EMPTY
        handleReload();
      }
      return;
    }

    setIsShooting(true);
    const newAmmo = Math.max(0, ammo - weapons[weapon].ammoPerShot);
    setAmmo(newAmmo);

    // Get shooting direction from player's camera
    if (playerRef.current && cameraRef.current) {
      const camera = cameraRef.current;
      
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(camera.quaternion);
      
      const spread = weapons[weapon].spread;
      direction.x += (Math.random() - 0.5) * spread;
      direction.y += (Math.random() - 0.5) * spread;
      direction.z += (Math.random() - 0.5) * spread;
      direction.normalize();
      
      const bullet = {
        position: camera.position.clone(),
        direction: direction,
        speed: 100,
        range: weapons[weapon].range,
        damage: weapons[weapon].damage,
        id: Date.now() + Math.random(),
        type: 'player',
        startPosition: camera.position.clone()
      };
      
      setBullets(prev => [...prev, bullet]);
      
      // Immediately check for hits
      checkBulletHit(bullet);
      
      setTimeout(() => setIsShooting(false), 100);
      
      // Check if we need to auto-reload (last bullet fired)
      if (newAmmo === 0 && maxAmmo > 0 && !isReloading) {
        setTimeout(() => {
          handleReload();
        }, 300);
      }
    }
  };

  // FIXED: Simplified bullet hit detection using simple distance
  const checkBulletHit = (bullet) => {
    if (!playerRef.current || !enemiesRef.current.length) return;
    
    let hitDetected = false;
    
    // Check each enemy for hits
    enemiesRef.current.forEach((enemy, index) => {
      if (!enemy || !enemy.mesh || enemy.health <= 0) return;
      
      const enemyPosition = enemy.mesh.position.clone();
      enemyPosition.y += 1; // Center of enemy body
      
      // SIMPLE DISTANCE CHECK: Check if bullet is close to enemy
      const distanceToEnemy = bullet.position.distanceTo(enemyPosition);
      
      // If bullet is close enough to enemy, it's a hit
      if (distanceToEnemy < 1.5) {
        hitDetected = true;
        
        let damage = bullet.damage;
        
        // Check for headshot (aiming higher)
        const headPosition = enemyPosition.clone();
        headPosition.y += 0.8; // Head is above body center
        
        const distanceToHead = bullet.position.distanceTo(headPosition);
        if (distanceToHead < 0.8) { // Headshot radius
          damage *= 2.5;
          setHitMarkerActive(true);
          setMessage("HEADSHOT! +150");
          setTimeout(() => setMessage(''), 1500);
          setScore(prev => prev + 150);
        } else {
          setHitMarkerActive(true);
          setScore(prev => prev + 50);
        }
        
        // Apply damage through enemy's takeDamage method
        const newHealth = enemy.takeDamage(damage);
        
        if (newHealth <= 0) {
          setEnemiesRemaining(prev => {
            const newCount = Math.max(0, prev - 1);
            if (newCount === 0) {
              setTimeout(() => {
                setMessage("MISSION ACCOMPLISHED! ALL TERRORISTS ELIMINATED!");
                setGameOver(true);
              }, 1000);
            }
            return newCount;
          });
          setScore(prev => prev + 100);
          setMessage(`TERRORIST ELIMINATED! +100`);
          setTimeout(() => setMessage(''), 1500);
        }
        
        // Remove the bullet on hit
        setBullets(prev => prev.filter(b => b.id !== bullet.id));
        
        // Debug info
        setDamageDebug(`Hit enemy ${index} with ${damage} damage`);
        setTimeout(() => setDamageDebug(''), 1000);
      }
    });
    
    if (hitDetected) {
      setTimeout(() => setHitMarkerActive(false), 300);
    }
  };

  const handleEnemyShoot = (enemyPosition, direction) => {
    const bullet = {
      position: enemyPosition.clone(),
      direction: direction.clone(),
      speed: 50,
      range: 100,
      damage: 10,
      id: Date.now() + Math.random(),
      type: 'enemy'
    };
    
    setEnemyBullets(prev => [...prev, bullet]);
  };

  // Player hit detection
  // In Game.js, update the checkPlayerHit function:

// Player hit detection - FIXED
const checkPlayerHit = () => {
  if (!playerRef.current || gameOver || gamePaused) return;

  const playerPosition = playerRef.current.getPosition?.();
  const playerMesh = playerRef.current.getMesh?.();
  
  if (!playerPosition) return;

  enemyBullets.forEach((bullet, index) => {
    // Get the player's actual position for hit detection
    const playerHitPosition = playerMesh ? playerMesh.position.clone() : playerPosition.clone();
    
    // Adjust height based on player mode
    if (playerMode === 'foot') {
      playerHitPosition.y += 1.6; // Player standing height
    } else {
      playerHitPosition.y += 2; // Car center height
    }
    
    // Calculate distance from bullet to player
    const distance = bullet.position.distanceTo(playerHitPosition);
    
    // Hit radius based on player mode
    const hitRadius = playerMode === 'foot' ? 1.5 : 2.0;
    
    if (distance < hitRadius) {
      let damage = bullet.damage;
      
      // Player in car takes less damage (has armor)
      if (playerMode === 'car') {
        damage *= 0.7; // 30% damage reduction in car
      }
      
      setHealth(prev => {
        const newHealth = Math.max(0, prev - damage);
        
        if (newHealth <= 0) {
          setMessage("MISSION FAILED! YOU HAVE BEEN ELIMINATED!");
          setGameOver(true);
        } else {
          // Visual and audio feedback
          setMessage(`YOU'RE HIT! Health: ${newHealth}`);
          setTimeout(() => setMessage(''), 1000);
          
          // Screen flash effect
          document.body.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
          setTimeout(() => {
            document.body.style.backgroundColor = '';
          }, 100);
          
          // Add hit marker effect
          setHitMarkerActive(true);
          setTimeout(() => setHitMarkerActive(false), 200);
        }
        
        return newHealth;
      });
      
      // Remove the bullet that hit
      setEnemyBullets(prev => prev.filter(b => b.id !== bullet.id));
      
      // Debug log
      console.log(`Player hit! Damage: ${damage}, Distance: ${distance}`);
    }
  });
};

// Also, update the enemy bullet creation to be more effective:

// Update the bullet update interval to be more frequent:
useEffect(() => {
  const updateBullets = () => {
    if (gamePaused || gameOver) return;
    
    // Update player bullets
    setBullets(prev => 
      prev.filter(bullet => {
        bullet.position.add(bullet.direction.clone().multiplyScalar(bullet.speed * 0.016));
        const distance = bullet.position.distanceTo(bullet.startPosition || bullet.position);
        
        if (distance < bullet.range) {
          checkBulletHit(bullet);
          return true;
        }
        return false;
      })
    );
    
    // Update enemy bullets
    setEnemyBullets(prev => 
      prev.filter(bullet => {
        bullet.position.add(bullet.direction.clone().multiplyScalar(bullet.speed * 0.016));
        const distance = bullet.position.distanceTo(bullet.startPosition || bullet.position);
        
        // Check if bullet hits player
        checkPlayerHit();
        
        return distance < bullet.range;
      })
    );
  };

  const interval = setInterval(updateBullets, 16); // 60 FPS
  return () => clearInterval(interval);
}, [gamePaused, gameOver]);

// Add more frequent hit checking
useEffect(() => {
  const hitCheckInterval = setInterval(() => {
    if (!gamePaused && !gameOver) {
      checkPlayerHit();
    }
  }, 33); // 30 times per second
  
  return () => clearInterval(hitCheckInterval);
}, [enemyBullets, gameOver, gamePaused, playerMode]);

// Add visual feedback for player being hit
useEffect(() => {
  if (hitMarkerActive) {
    const crosshair = document.querySelector('.crosshair-dot');
    if (crosshair) {
      crosshair.style.backgroundColor = '#ff0000';
      crosshair.style.transform = 'scale(1.5)';
      
      setTimeout(() => {
        crosshair.style.backgroundColor = '#ffffff';
        crosshair.style.transform = 'scale(1)';
      }, 200);
    }
  }
}, [hitMarkerActive]);

// Update the Enemy.js to improve shooting accuracy:
// In Enemy.js attackBehavior function, adjust the shooting logic:

const attackBehavior = (playerPosition, delta, now) => {
  if (!playerPosition) return;
  
  // Look at player
  const lookDirection = new THREE.Vector3();
  lookDirection.subVectors(playerPosition, enemyRef.current.position);
  lookDirection.y = 0;
  
  if (lookDirection.length() > 0.1) {
    lookDirection.normalize();
    const targetRotation = Math.atan2(lookDirection.x, lookDirection.z);
    enemyRef.current.rotation.y = THREE.MathUtils.lerp(
      enemyRef.current.rotation.y,
      targetRotation,
      15 * delta // Faster rotation when attacking
    );
  }
  
  // Shoot at player - IMPROVED ACCURACY
  if (now - lastShot > shotDelay) {
    setLastShot(now);
    
    const shootDirection = new THREE.Vector3();
    shootDirection.subVectors(playerPosition, enemyRef.current.position);
    shootDirection.normalize();
    
    // Calculate distance to player
    const distance = enemyRef.current.position.distanceTo(playerPosition);
    
    // Improved accuracy calculation
    const playerMode = playerRef.current?.getMode?.();
    let baseInaccuracy = 0.03; // More accurate
    
    // Player in car is easier to hit at distance (larger target)
    if (playerMode === 'car') {
      baseInaccuracy = 0.02; // Even more accurate for cars
    }
    
    // Distance-based inaccuracy (less inaccuracy at close range)
    const distanceInaccuracy = Math.min(0.05, distance / 100 * 0.05);
    
    const inaccuracy = (baseInaccuracy + distanceInaccuracy);
    
    // Add slight inaccuracy
    shootDirection.x += (Math.random() - 0.5) * inaccuracy;
    shootDirection.y += (Math.random() - 0.5) * inaccuracy * 0.5;
    shootDirection.z += (Math.random() - 0.5) * inaccuracy;
    shootDirection.normalize();
    
    // Call parent to create bullet
    if (onShoot) {
      const bulletStart = enemyRef.current.position.clone();
      bulletStart.y += 1.5;
      onShoot(bulletStart, shootDirection);
    }
  }
  
  // Movement during attack
  const playerMode = playerRef.current?.getMode?.();
  const distance = enemyRef.current.position.distanceTo(playerPosition);
  
  if (playerMode === 'foot') {
    // Strafe around player
    if (distance < 10) {
      const strafeDirection = new THREE.Vector3();
      strafeDirection.crossVectors(lookDirection, new THREE.Vector3(0, 1, 0));
      strafeDirection.normalize();
      
      // Alternate strafing direction based on time
      const strafeSpeed = Math.sin(now * 2) * 0.5;
      enemyRef.current.position.add(strafeDirection.multiplyScalar(strafeSpeed * delta));
    }
  }
};

  // FIXED: Reload function with progress tracking
  // In Game.js, update the handleReload function:
const handleReload = () => {
  if (maxAmmo <= 0 || ammo === 30 || gamePaused || gameOver || isReloading) return;
  
  setIsReloading(true);
  setReloadProgress(0);
  setMessage("RELOADING...");
  
  const reloadTime = weapons[weapon].reloadTime;
  const intervalTime = 50;
  const steps = reloadTime / intervalTime;
  let currentStep = 0;
  
  const reloadInterval = setInterval(() => {
    currentStep++;
    const progress = (currentStep / steps) * 100;
    setReloadProgress(progress);
    
    if (currentStep >= steps) {
      clearInterval(reloadInterval);
      
      const neededAmmo = 30 - ammo;
      const ammoToReload = Math.min(neededAmmo, maxAmmo);
      
      setAmmo(prev => prev + ammoToReload);
      setMaxAmmo(prev => Math.max(0, prev - ammoToReload));
      setIsReloading(false);
      setReloadProgress(0);
      
      if (ammoToReload > 0) {
        setMessage(`RELOADED! +${ammoToReload} ammo`);
      } else {
        setMessage("NO AMMO LEFT!");
      }
      
      setTimeout(() => setMessage(''), 1000);
    }
  }, intervalTime);
};

// Add auto-reload when trying to shoot with empty magazine
useEffect(() => {
  const handleAutoReload = () => {
    if (ammo === 0 && maxAmmo > 0 && !isReloading && !gamePaused && !gameOver) {
      handleReload();
    }
  };

  // Check for auto-reload more frequently
  const autoReloadInterval = setInterval(handleAutoReload, 500);
  
  return () => clearInterval(autoReloadInterval);
}, [ammo, maxAmmo, isReloading, gamePaused, gameOver]);

  // Auto-reload when trying to shoot with empty magazine
  useEffect(() => {
    if (ammo === 0 && maxAmmo > 0 && !isReloading && !gamePaused && !gameOver) {
      const autoReloadTimer = setTimeout(() => {
        handleReload();
      }, 500);
      
      return () => clearTimeout(autoReloadTimer);
    }
  }, [ammo, maxAmmo, isReloading, gamePaused, gameOver]);

  const handleSwitchWeapon = (weaponType) => {
    if (weapon === weaponType || gamePaused || gameOver || isReloading) return;
    setWeapon(weaponType);
    setMessage(`SWITCHED TO ${weapons[weaponType].name.toUpperCase()}`);
    setTimeout(() => setMessage(''), 1000);
  };

  // Add state for car entry/exit cooldown
const togglePlayerMode = () => {
  if (gamePaused || gameOver || isReloading || carCooldown) return;
  
  // Set cooldown to prevent rapid switching
  setCarCooldown(true);
  setTimeout(() => setCarCooldown(false), 1000);
  
  const newMode = playerMode === 'foot' ? 'car' : 'foot';
  setPlayerMode(newMode);
  
  const message = newMode === 'car' 
    ? 'ENTERED POLICE CAR (Press E to exit)' 
    : 'EXITED VEHICLE';
  setMessage(message);
  setTimeout(() => setMessage(''), 1500);
};

// Add E key handler for exiting car
useEffect(() => {
  const handleKeyDown = (e) => {
    if (gamePaused || gameOver || isReloading) return;

    switch(e.key.toLowerCase()) {
      case 'e': // E key to exit car
        if (playerMode === 'car' && !carCooldown) {
          togglePlayerMode();
        }
        break;
      // ... other key handlers ...
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [gamePaused, weapon, ammo, maxAmmo, gameOver, isReloading, playerMode, carCooldown]);

  // Update bullets
  useEffect(() => {
    const updateBullets = () => {
      if (gamePaused || gameOver) return;
      
      // Update player bullets and check hits
      setBullets(prev => 
        prev.filter(bullet => {
          bullet.position.add(bullet.direction.clone().multiplyScalar(bullet.speed * 0.016));
          const distance = bullet.position.distanceTo(bullet.startPosition || bullet.position);
          
          // Check hit after movement
          if (distance < bullet.range) {
            checkBulletHit(bullet);
            return true;
          }
          return false;
        })
      );
      
      // Update enemy bullets
      setEnemyBullets(prev => 
        prev.filter(bullet => {
          bullet.position.add(bullet.direction.clone().multiplyScalar(bullet.speed * 0.016));
          const distance = bullet.position.distanceTo(bullet.startPosition || bullet.position);
          return distance < bullet.range;
        })
      );
    };

    const interval = setInterval(updateBullets, 16);
    return () => clearInterval(interval);
  }, [gamePaused, gameOver]);

  // Check for player hits
  useEffect(() => {
    const hitCheckInterval = setInterval(checkPlayerHit, 50);
    return () => clearInterval(hitCheckInterval);
  }, [enemyBullets, gameOver]);

  // Update visible enemies
  useEffect(() => {
    const updateVisibleEnemies = () => {
      if (!playerRef.current || gamePaused || gameOver) return;
      
      let visibleCount = 0;
      
      enemiesRef.current.forEach(enemy => {
        if (enemy && enemy.health > 0 && enemy.canSeePlayer) {
          visibleCount++;
        }
      });
      
      setVisibleEnemies(visibleCount);
    };
    
    const interval = setInterval(updateVisibleEnemies, 500);
    return () => clearInterval(interval);
  }, [gamePaused, gameOver]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gamePaused || gameOver || isReloading) return;

      switch(e.key.toLowerCase()) {
        case 'r':
          handleReload();
          break;
        case '1':
          handleSwitchWeapon('rifle');
          break;
        case '2':
          handleSwitchWeapon('pistol');
          break;
        case 'c':
          togglePlayerMode();
          break;
        case 'escape':
          onPause();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gamePaused, weapon, ammo, maxAmmo, gameOver, isReloading]);

  // Initialize enemies array
  useEffect(() => {
    enemiesRef.current = Array(15).fill(null);
  }, []);

  // Game over screen
  if (gameOver) {
    return (
      <div className="game-over-screen">
        <div className="game-over-content">
          <h1>{health <= 0 ? "MISSION FAILED" : "MISSION ACCOMPLISHED"}</h1>
          <div className="game-over-stats">
            <p>Final Score: <span className="score-value">{score}</span></p>
            <p>Enemies Eliminated: <span className="stat-value">{15 - enemiesRemaining}/15</span></p>
            <p>Civilians Saved: <span className="stat-value">{civiliansCount}/50</span></p>
            <p>Ammo Used: <span className="stat-value">{120 - maxAmmo}</span></p>
          </div>
          <div className="game-over-buttons">
            <button className="menu-button" onClick={() => window.location.reload()}>
              PLAY AGAIN
            </button>
            <button className="menu-button quit-button" onClick={onQuit}>
              MAIN MENU
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <Canvas
        shadows
        camera={{ position: [0, 2, 5], fov: 75 }}
        ref={sceneRef}
        onCreated={({ gl }) => {
          canvasRef.current = gl.domElement;
        }}
      >
        <color attach="background" args={['#0d1524']} />
        <fog attach="fog" args={['#0d1524', 10, 300]} />
        
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[50, 100, 50]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        
        <Suspense fallback={null}>
          <City />
          
          <Player 
            ref={playerRef}
            mode={playerMode}
            speed={carSpeed}
            onSpeedChange={setCarSpeed}
            cameraRef={cameraRef}
            gamePaused={gamePaused}
            onToggleMode={togglePlayerMode}
          />
          
          {/* Initialize enemies array properly */}
          {Array.from({ length: 15 }).map((_, i) => (
            <Enemy 
              key={`enemy-${i}`} 
              index={i} 
              playerRef={playerRef}
              onShoot={handleEnemyShoot}
              ref={el => {
                enemiesRef.current[i] = el;
              }}
            />
          ))}
          
          {Array.from({ length: 50 }).map((_, i) => (
            <Civilian key={`civilian-${i}`} index={i} />
          ))}
          
          {Array.from({ length: 20 }).map((_, i) => (
            <Vehicle key={`civilian-car-${i}`} index={i} type="civilian" />
          ))}
          
          {Array.from({ length: 10 }).map((_, i) => (
            <Vehicle key={`ai-car-${i}`} index={i} type="ai" />
          ))}
          
          {playerMode === 'car' && <Vehicle key="police-car" type="police" />}
          
          {/* Render bullets */}
          {bullets.map(bullet => (
            <mesh key={`player-bullet-${bullet.id}`} position={bullet.position.toArray()}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshBasicMaterial color="yellow" />
            </mesh>
          ))}
          
          {enemyBullets.map(bullet => (
            <mesh key={`enemy-bullet-${bullet.id}`} position={bullet.position.toArray()}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshBasicMaterial color="red" />
            </mesh>
          ))}
          
          <Sky sunPosition={[100, 20, 100]} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
        </Suspense>
      </Canvas>
      
      <UI
        health={health}
        ammo={ammo}
        maxAmmo={maxAmmo}
        score={score}
        enemiesRemaining={enemiesRemaining}
        civiliansCount={civiliansCount}
        visibleEnemies={visibleEnemies}
        weapon={weapons[weapon].name}
        playerMode={playerMode}
        carSpeed={carSpeed}
        location={location}
        message={message}
        onPause={onPause}
        onQuit={onQuit}
        weaponSpread={weapons[weapon].spread}
        isShooting={isShooting}
        isReloading={isReloading}
        reloadProgress={reloadProgress}
      />
      
      <Controls
        onShoot={handleShoot}
        playerMode={playerMode}
        gamePaused={gamePaused}
      />
      
      {/* Crosshair */}
      <div className="crosshair">
        <div className="crosshair-dot"></div>
        <div className="crosshair-line horizontal"></div>
        <div className="crosshair-line vertical"></div>
        {isShooting && <div className="muzzle-flash"></div>}
      </div>
      
      {/* Hit marker */}
      <div className={`hit-marker ${hitMarkerActive ? 'active' : ''}`}></div>
      
      {/* Reload progress bar */}
      {isReloading && (
        <div className="reload-overlay">
          <div className="reload-progress-container">
            <div 
              className="reload-progress-bar" 
              style={{ width: `${reloadProgress}%` }}
            ></div>
            <div className="reload-text">RELOADING {weapons[weapon].name}...</div>
          </div>
        </div>
      )}
      
      {/* Debug info (optional - remove in production) */}
      {damageDebug && (
        <div className="debug-info">
          {damageDebug}
        </div>
      )}
      
      {/* Movement instructions */}
      {!gamePaused && (
        <div className="movement-instructions">
          <div className="instruction-row">
            <span className="instruction-key">WASD</span>
            <span className="instruction-action">Move</span>
            <span className="instruction-key">Mouse</span>
            <span className="instruction-action">Look Around</span>
          </div>
          <div className="instruction-row">
            <span className="instruction-key">Space</span>
            <span className="instruction-action">Jump/Shoot</span>
            <span className="instruction-key">C</span>
            <span className="instruction-action">Enter Car</span>
            <span className="instruction-key">E</span>
            <span className="instruction-action">Exit Car</span>
          </div>
          <div className="instruction-row">
            <span className="instruction-key">R</span>
            <span className="instruction-action">Reload</span>
            <span className="instruction-key">1/2</span>
            <span className="instruction-action">Switch Weapon</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;