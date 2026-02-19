import React, { Suspense, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';
import City from './City';
import Player from './Player';
import Enemy from './Enemy';
import Civilian from './Civilian';
import Vehicle from './Vehicle';
import Tank from './Tank';
import Helicopter from './Helicopter';
import Jet from './Jet';
import Hospital from './Hospital';
import Minimap from './Minimap';
import NavigationArrow from './NavigationArrow';
import UI from './UI';
import Controls from './Controls';
import '../styles/App.css';
import {
  generateHouseData,
  apartmentData,
  generateBuildingData,
  generateParkData,
  riverData
} from '../utils/CityData';

const Game = ({ gamePaused, onPause, onQuit }) => {
  const [health, setHealth] = useState(100);
  const [ammo, setAmmo] = useState(30);
  const [maxAmmo, setMaxAmmo] = useState(120);
  const [score, setScore] = useState(0);
  const [enemiesRemaining, setEnemiesRemaining] = useState(15);
  const [level, setLevel] = useState(1);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
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
  const [enemyData, setEnemyData] = useState([]); // For Minimap tracking
  const [civilianDeaths, setCivilianDeaths] = useState(0);
  const [carCooldown, setCarCooldown] = useState(false);

  const playerRef = useRef();
  const cameraRef = useRef();
  const sceneRef = useRef();
  const enemiesRef = useRef([]);
  const canvasRef = useRef();
  const deadEnemiesRef = useRef(new Set());
  const hospitalPos = useMemo(() => new THREE.Vector3(120, 0, -150), []);

  const weapons = useMemo(() => ({
    rifle: { name: 'Assault Rifle', damage: 35, fireRate: 150, ammoPerShot: 1, range: 200, spread: 0.01, auto: true, reloadTime: 2000 },
    pistol: { name: 'Pistol', damage: 20, fireRate: 500, ammoPerShot: 1, range: 100, spread: 0.05, auto: false, reloadTime: 1500 },
    sniper: { name: 'Sniper Rifle', damage: 100, fireRate: 2000, ammoPerShot: 1, range: 500, spread: 0.001, auto: false, reloadTime: 3000 }
  }), []);

  const initEnemies = useCallback((lvl) => {
    const count = 15 + (lvl - 1) * 5;
    setEnemiesRemaining(count);
    enemiesRef.current = Array(count).fill(null);
    deadEnemiesRef.current = new Set();
  }, []);

  const collisionObjects = useMemo(() => {
    const objects = [];
    generateHouseData().forEach(h => objects.push({ x: h.x, z: h.z, width: h.width, depth: h.depth }));
    generateBuildingData().forEach(b => objects.push({ x: b.x, z: b.z, width: b.width, depth: b.depth }));
    apartmentData.forEach(a => objects.push({ x: a.x, z: a.z, width: a.width, depth: a.depth }));
    return objects;
  }, []);

  const checkCollision = useCallback((x, z, radius) => {
    for (const obj of collisionObjects) {
      if (
        x > obj.x - obj.width / 2 - radius &&
        x < obj.x + obj.width / 2 + radius &&
        z > obj.z - obj.depth / 2 - radius &&
        z < obj.z + obj.depth / 2 + radius
      ) {
        return true;
      }
    }
    return false;
  }, [collisionObjects]);

  const handleReload = useCallback(() => {
    if (maxAmmo <= 0 || ammo === 30 || gamePaused || gameOver || isReloading) return;
    setIsReloading(true);
    setReloadProgress(0);
    setMessage("RELOADING...");

    const reloadTime = weapons[weapon].reloadTime;
    const steps = reloadTime / 50;
    let currentStep = 0;

    const reloadInterval = setInterval(() => {
      currentStep++;
      setReloadProgress((currentStep / steps) * 100);
      if (currentStep >= steps) {
        clearInterval(reloadInterval);
        const neededAmmo = 30 - ammo;
        const ammoToReload = Math.min(neededAmmo, maxAmmo);
        setAmmo(prev => prev + ammoToReload);
        setMaxAmmo(prev => Math.max(0, prev - ammoToReload));
        setIsReloading(false);
        setReloadProgress(0);
        setMessage(ammoToReload > 0 ? `RELOADED! +${ammoToReload} ammo` : "NO AMMO LEFT!");
        setTimeout(() => setMessage(''), 1000);
      }
    }, 50);
  }, [ammo, maxAmmo, gamePaused, gameOver, isReloading, weapon, weapons]);

  const handleSwitchWeapon = useCallback((weaponType) => {
    if (weapon === weaponType || gamePaused || gameOver || isReloading) return;
    setWeapon(weaponType);
    setMessage(`SWITCHED TO ${weapons[weaponType].name.toUpperCase()}`);
    setTimeout(() => setMessage(''), 1000);
  }, [weapon, gamePaused, gameOver, isReloading, weapons]);

  const togglePlayerMode = useCallback(() => {
    if (gamePaused || gameOver || isReloading || carCooldown) return;
    setCarCooldown(true);
    setTimeout(() => setCarCooldown(false), 1000);
    const newMode = playerMode === 'foot' ? 'car' : 'foot';
    setPlayerMode(newMode);
    setMessage(newMode === 'car' ? 'POLICE ENTERED' : 'EXITED VEHICLE');
    setTimeout(() => setMessage(''), 1500);
  }, [gamePaused, gameOver, isReloading, carCooldown, playerMode]);

  const enterTank = useCallback(() => {
    if (gamePaused || gameOver || isReloading || carCooldown) return;
    setCarCooldown(true);
    setTimeout(() => setCarCooldown(false), 1000);
    setPlayerMode('tank');
    setMessage('TANK COMMANDER ENTERED');
    setTimeout(() => setMessage(''), 1500);
  }, [gamePaused, gameOver, isReloading, carCooldown]);

  const enterHeli = useCallback(() => {
    if (gamePaused || gameOver || isReloading || carCooldown) return;
    setCarCooldown(true);
    setTimeout(() => setCarCooldown(false), 1000);
    setPlayerMode('heli');
    setMessage('HELICOPTER PILOT ENTERED');
    setTimeout(() => setMessage(''), 1500);
  }, [gamePaused, gameOver, isReloading, carCooldown]);

  const enterJet = useCallback(() => {
    if (gamePaused || gameOver || isReloading || carCooldown) return;
    setCarCooldown(true);
    setTimeout(() => setCarCooldown(false), 1000);
    setPlayerMode('jet');
    setMessage('JET PILOT ENTERED');
    setTimeout(() => setMessage(''), 1500);
  }, [gamePaused, gameOver, isReloading, carCooldown]);

  const handleEnemyKill = useCallback((index) => {
    if (deadEnemiesRef.current.has(index)) return;
    deadEnemiesRef.current.add(index);
    setEnemiesRemaining(prev => Math.max(0, prev - 1));
    setScore(prev => prev + 100);
    setMessage(`TERRORIST ELIMINATED! +100`);
    setTimeout(() => setMessage(''), 1500);
  }, []);

  const checkBulletHit = useCallback((bullet) => {
    if (!playerRef.current || !enemiesRef.current.length) return false;

    // Tank shell logic (Area of Effect)
    if (bullet.type === 'shell') {
      let hitAny = false;
      enemiesRef.current.forEach((enemy, index) => {
        if (!enemy || enemy.health <= 0) return;
        const enemyPos = enemy.getPosition?.() || (enemy.mesh ? enemy.mesh.position : null);
        if (!enemyPos) return;
        const distance = bullet.position.distanceTo(enemyPos);
        if (distance < 12) {
          hitAny = true;
          const damage = bullet.damage * (1 - distance / 12);
          const newHealth = enemy.takeDamage(damage);
          if (newHealth <= 0) handleEnemyKill(index);
        }
      });
      if (hitAny) {
        setHitMarkerActive(true);
        setTimeout(() => setHitMarkerActive(false), 200);
      }
      return hitAny;
    }

    // Normal bullet logic (Point hit)
    let hit = false;
    enemiesRef.current.forEach((enemy, index) => {
      if (hit || !enemy || enemy.health <= 0) return;
      const enemyPos = enemy.getPosition?.() || (enemy.mesh ? enemy.mesh.position : null);
      if (!enemyPos) return;

      const enemyHitPos = enemyPos.clone().add(new THREE.Vector3(0, 1, 0));
      const distanceToEnemy = bullet.position.distanceTo(enemyHitPos);

      if (distanceToEnemy < 1.8) {
        let damage = bullet.damage;
        if (bullet.position.distanceTo(enemyHitPos.clone().add(new THREE.Vector3(0, 0.6, 0))) < 0.8) {
          damage *= 2.5;
          setMessage("HEADSHOT! +150");
          setScore(prev => prev + 150);
        } else {
          setScore(prev => prev + 50);
        }

        const newHealth = enemy.takeDamage(damage);
        setHitMarkerActive(true);
        setTimeout(() => setHitMarkerActive(false), 200);
        if (newHealth <= 0) handleEnemyKill(index);
        hit = true;
      }
    });
    return hit;
  }, [handleEnemyKill]);

  const checkPlayerHit = useCallback((bullet) => {
    if (!playerRef.current || gameOver || gamePaused) return false;
    const playerPosition = playerRef.current.getPosition?.();
    const playerMesh = playerRef.current.getMesh?.();
    if (!playerPosition) return false;

    const playerHitPosition = playerMesh ? playerMesh.position.clone() : playerPosition.clone();
    playerHitPosition.y += (playerMode === 'foot' ? 1.6 : 2);
    const distance = bullet.position.distanceTo(playerHitPosition);
    // Refined hitboxes (was 1.5 and 2.0)
    const hitRadius = playerMode === 'foot' ? 0.8 : 1.5;

    if (distance < hitRadius) {
      let damage = bullet.damage;
      if (playerMode === 'car') damage *= 0.7;

      setHealth(prev => {
        const newHealth = Math.max(0, prev - damage);
        if (newHealth <= 0) {
          setMessage("MISSION FAILED! YOU HAVE BEEN ELIMINATED!");
          setGameOver(true);
          setLevel(1);
          setTimeout(() => onQuit?.(), 5000);
        } else {
          setMessage(`YOU'RE HIT! Health: ${newHealth}`);
          setTimeout(() => setMessage(''), 1000);
          document.body.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
          setTimeout(() => { document.body.style.backgroundColor = ''; }, 100);
          setHitMarkerActive(true);
          setTimeout(() => setHitMarkerActive(false), 200);
        }
        return newHealth;
      });
      return true;
    }
    return false;
  }, [gameOver, gamePaused, playerMode, onQuit]);

  const handleShoot = useCallback(() => {
    if (gamePaused || gameOver || ammo <= 0 || isReloading) {
      if (ammo <= 0 && !isReloading) handleReload();
      return;
    }
    if (playerRef.current && cameraRef.current) {
      setIsShooting(true);
      const newAmmo = Math.max(0, ammo - weapons[weapon].ammoPerShot);
      setAmmo(newAmmo);

      const camera = cameraRef.current;
      const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const startPos = playerRef.current.getPosition();

      if (playerMode === 'tank') {
        const shellId = Date.now();
        const newBullet = { id: shellId, position: startPos.clone(), direction: direction.clone(), speed: 80, damage: 200, range: 400, startPosition: startPos.clone(), type: 'shell' };
        setBullets(prev => [...prev, newBullet]);
        checkBulletHit(newBullet);
        setTimeout(() => setIsShooting(false), 100);
        return;
      }

      const spread = weapons[weapon].spread;
      direction.x += (Math.random() - 0.5) * spread;
      direction.y += (Math.random() - 0.5) * spread;
      direction.z += (Math.random() - 0.5) * spread;
      direction.normalize();

      const bullet = { position: camera.position.clone(), direction: direction, speed: 100, range: weapons[weapon].range, damage: weapons[weapon].damage, id: Date.now() + Math.random(), type: 'player', startPosition: camera.position.clone() };
      setBullets(prev => [...prev, bullet]);
      checkBulletHit(bullet);
      setTimeout(() => setIsShooting(false), 100);
      if (newAmmo === 0 && maxAmmo > 0 && !isReloading) setTimeout(handleReload, 300);
    }
  }, [gamePaused, gameOver, ammo, isReloading, playerMode, weapon, weapons, maxAmmo, handleReload, checkBulletHit]);

  const handleEnemyShoot = useCallback((enemyPosition, direction) => {
    const bullet = {
      position: enemyPosition.clone(),
      startPosition: enemyPosition.clone(), // Fix for bullet expiry
      direction: direction.clone(),
      speed: 50,
      range: 100,
      damage: 5, // Reduced damage from 10 to 5
      id: Date.now() + Math.random(),
      type: 'enemy'
    };
    setEnemyBullets(prev => [...prev, bullet]);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gamePaused || gameOver || isReloading) return;
      switch (e.key.toLowerCase()) {
        case 'e': if (playerMode === 'car' && !carCooldown) togglePlayerMode(); break;
        case 'r': handleReload(); break;
        case '1': handleSwitchWeapon('rifle'); break;
        case '2': handleSwitchWeapon('pistol'); break;
        case '3': handleSwitchWeapon('sniper'); break;
        case 'c': togglePlayerMode(); break;
        case 'escape': onPause(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gamePaused, gameOver, isReloading, playerMode, carCooldown, togglePlayerMode, handleReload, handleSwitchWeapon, onPause]);

  useEffect(() => {
    const healInterval = setInterval(() => {
      if (gamePaused || gameOver || health >= 100) return;
      if (playerRef.current) {
        if (playerRef.current.position.distanceTo(hospitalPos) < 20) {
          setHealth(prev => Math.min(100, prev + 5));
          setMessage('HEALING...');
          setTimeout(() => setMessage(''), 500);
        }
      }
    }, 1000);
    return () => clearInterval(healInterval);
  }, [gamePaused, gameOver, health, hospitalPos]);

  useEffect(() => {
    const trackEnemies = setInterval(() => {
      if (gamePaused) return;
      setEnemyData(enemiesRef.current
        .filter(e => e && e.health > 0)
        .map(e => ({ position: e.getPosition?.() || (e.mesh ? e.mesh.position.clone() : null), health: e.health }))
        .filter(e => e.position));
    }, 500);
    return () => clearInterval(trackEnemies);
  }, [gamePaused]);

  useEffect(() => {
    const updateGame = () => {
      if (gamePaused || gameOver) return;

      // Update player bullets
      setBullets(prev => prev.filter(bullet => {
        bullet.position.add(bullet.direction.clone().multiplyScalar(bullet.speed * 0.016));

        // Check for hit
        const hit = checkBulletHit(bullet);
        if (hit) return false;

        // Check for range
        const traveled = bullet.position.distanceTo(bullet.startPosition || bullet.position);
        return traveled < bullet.range;
      }));

      // Update enemy bullets
      setEnemyBullets(prev => prev.filter(bullet => {
        bullet.position.add(bullet.direction.clone().multiplyScalar(bullet.speed * 0.016));

        // Check for hit on player
        const hit = checkPlayerHit(bullet);
        if (hit) return false;

        // Check for range
        const traveled = bullet.position.distanceTo(bullet.startPosition || bullet.position);
        return traveled < bullet.range;
      }));
    };
    const interval = setInterval(updateGame, 16);
    return () => clearInterval(interval);
  }, [gamePaused, gameOver, checkBulletHit, checkPlayerHit]);

  useEffect(() => {
    if (enemiesRemaining === 0 && !gameOver && !isLevelingUp) {
      setIsLevelingUp(true);
      setMessage(`LEVEL ${level} COMPLETE! PREPARING LEVEL ${level + 1}...`);
      const timer = setTimeout(() => {
        const nextLevel = level + 1;
        setLevel(nextLevel);
        initEnemies(nextLevel);
        setIsLevelingUp(false);
        setMessage(`LEVEL ${nextLevel} START!`);
        setTimeout(() => setMessage(''), 2000);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [enemiesRemaining, gameOver, isLevelingUp, level, initEnemies]);

  useEffect(() => {
    initEnemies(level);
  }, [initEnemies, level]);

  if (gameOver) {
    return (
      <div className="game-over-screen">
        <div className="game-over-content">
          <h1>{health <= 0 ? "MISSION FAILED" : "MISSION ACCOMPLISHED"}</h1>
          <div className="game-over-stats">
            <p>Final Score: <span className="score-value">{score}</span></p>
            <p>Enemies Eliminated: <span className="stat-value">{15 + (level - 1) * 5 - enemiesRemaining}</span></p>
            <p>Civilians Saved: <span className="stat-value">{civiliansCount}/50</span></p>
            <p>Ammo Used: <span className="stat-value">{120 - maxAmmo}</span></p>
          </div>
          <div className="game-over-buttons">
            <button className="menu-button" onClick={() => window.location.reload()}>PLAY AGAIN</button>
            <button className="menu-button quit-button" onClick={onQuit}>MAIN MENU</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <Canvas shadows camera={{ position: [100, 2, 0], fov: 75 }} ref={sceneRef} onCreated={({ gl }) => { canvasRef.current = gl.domElement; }}>
        <color attach="background" args={['#87CEEB']} />
        <fog attach="fog" args={['#87CEEB', 50, 400]} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[100, 100, 50]} intensity={1.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-far={500} shadow-camera-left={-200} shadow-camera-right={200} shadow-camera-top={200} shadow-camera-bottom={-200} />
        <Suspense fallback={null}>
          <City />
          <Player ref={playerRef} mode={playerMode} speed={carSpeed} onSpeedChange={setCarSpeed} cameraRef={cameraRef} gamePaused={gamePaused} onToggleMode={togglePlayerMode} checkCollision={checkCollision} />
          {Array.from({ length: 15 + (level - 1) * 5 }).map((_, i) => (
            <Enemy key={`enemy-level-${level}-${i}`} index={i} playerRef={playerRef} onShoot={handleEnemyShoot} checkCollision={checkCollision} ref={el => { enemiesRef.current[i] = el; }} />
          ))}
          {Array.from({ length: 50 }).map((_, i) => (
            <Civilian key={`civilian-${i}`} index={i} playerRef={playerRef} enemiesRef={enemiesRef} onKilled={() => {
              setCiviliansCount(prev => prev - 1);
              setCivilianDeaths(prev => prev + 1);
              if (civilianDeaths + 1 > 25) {
                setMessage("MISSION FAILED! TOO MANY CIVILIANS KILLED!");
                setGameOver(true);
                setLevel(1);
              }
            }} />
          ))}
          {Array.from({ length: 20 }).map((_, i) => (<Vehicle key={`civilian-car-${i}`} index={i} type="civilian" />))}
          {Array.from({ length: 10 }).map((_, i) => (<Vehicle key={`ai-car-${i}`} index={i} type="ai" />))}
          {level >= 2 && playerMode === 'foot' && (<Tank position={[20, 0, 20]} onEnter={enterTank} />)}
          {level >= 3 && playerMode === 'foot' && (<Helicopter position={[-20, 0, -20]} onEnter={enterHeli} />)}
          {level >= 4 && playerMode === 'foot' && (<Jet position={[100, 0, 100]} onEnter={enterJet} />)}
          <Hospital position={hospitalPos} />
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
          <Sky sunPosition={[100, 20, 100]} turbidity={0.5} rayleigh={0.5} mieCoefficient={0.005} mieDirectionalG={0.8} />
          <NavigationArrow
            playerPos={playerRef.current ? playerRef.current.getPosition() : new THREE.Vector3()}
            enemies={enemyData}
            playerMode={playerMode}
          />
        </Suspense>
      </Canvas>
      <Minimap playerPos={playerRef.current ? playerRef.current.getPosition() : new THREE.Vector3()} enemies={enemyData} hospitalPos={hospitalPos} playerRotation={playerRef.current ? playerRef.current.getRotation().y : 0} />
      <UI health={health} ammo={ammo} maxAmmo={maxAmmo} score={score} enemiesRemaining={enemiesRemaining} civiliansCount={civiliansCount} visibleEnemies={visibleEnemies} weapon={weapons[weapon].name} playerMode={playerMode} carSpeed={carSpeed} location={location} message={message} onPause={onPause} onQuit={onQuit} weaponSpread={weapons[weapon].spread} isShooting={isShooting} isReloading={isReloading} reloadProgress={reloadProgress} level={level} />
      <Controls onShoot={handleShoot} playerMode={playerMode} gamePaused={gamePaused} />
      <div className="crosshair">
        <div className="crosshair-dot" />
        <div className="crosshair-line horizontal" />
        <div className="crosshair-line vertical" />
        {isShooting && <div className="muzzle-flash" />}
      </div>
      <div className={`hit-marker ${hitMarkerActive ? 'active' : ''}`} />
      {weapon === 'sniper' && playerMode === 'foot' && (<div className="sniper-scope"> <div className="scope-line-v" /> <div className="scope-line-h" /> <div className="scope-center" /> </div>)}
      {isReloading && (
        <div className="reload-overlay">
          <div className="reload-progress-container">
            <div className="reload-progress-bar" style={{ width: `${reloadProgress}%` }} />
            <div className="reload-text">RELOADING {weapons[weapon].name}...</div>
          </div>
        </div>
      )}
      {damageDebug && (<div className="debug-info">{damageDebug}</div>)}
      {!gamePaused && (
        <div className="movement-instructions">
          <div className="instruction-row">
            <span className="instruction-key">WASD</span><span className="instruction-action">Move</span>
            <span className="instruction-key">Mouse</span><span className="instruction-action">Look Around</span>
          </div>
          <div className="instruction-row">
            <span className="instruction-key">Space</span><span className="instruction-action">Jump/Shoot</span>
            <span className="instruction-key">C</span><span className="instruction-action">Enter Car</span>
            <span className="instruction-key">E</span><span className="instruction-action">Exit Car</span>
          </div>
          <div className="instruction-row">
            <span className="instruction-key">R</span><span className="instruction-action">Reload</span>
            <span className="instruction-key">1/2</span><span className="instruction-action">Switch Weapon</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;