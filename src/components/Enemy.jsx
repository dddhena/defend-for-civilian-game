import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const Enemy = forwardRef(({ index, playerRef, onShoot }, ref) => {
  const enemyRef = useRef();
  const { scene } = useThree();
  
  const [health, setHealth] = useState(100);
  const [state, setState] = useState('patrol');
  const [patrolTarget, setPatrolTarget] = useState(new THREE.Vector3());
  const [lastShot, setLastShot] = useState(0);
  const [canSeePlayer, setCanSeePlayer] = useState(false);
  const [lastSeenPlayer, setLastSeenPlayer] = useState(0);
  const [playerLastKnownPosition, setPlayerLastKnownPosition] = useState(null);
  
  const shotDelay = 1.0 + Math.random() * 2.0;
  const detectionRange = 80;
  const hearingRange = 40;
  const attackRange = 30;
  const wanderSpeed = 3;
  const chaseSpeed = 6;
  const fieldOfView = Math.PI / 2;

  // Use refs for values that need to be accessed in useFrame without triggering re-renders
  const stateRef = useRef('patrol');
  const canSeePlayerRef = useRef(false);
  const lastSeenPlayerRef = useRef(0);
  const playerLastKnownPositionRef = useRef(null);

  useImperativeHandle(ref, () => ({
    mesh: enemyRef.current,
    health,
    state: stateRef.current,
    canSeePlayer: canSeePlayerRef.current,
    position: enemyRef.current?.position,
    takeDamage: (amount) => {
      const newHealth = Math.max(0, health - amount);
      setHealth(newHealth);
      if (newHealth <= 0) {
        setState('dead');
        stateRef.current = 'dead';
      } else {
        setState('attack');
        stateRef.current = 'attack';
      }
      return newHealth;
    }
  }));

  useEffect(() => {
    const angle = (index / 15) * Math.PI * 2;
    const radius = 40 + Math.random() * 60;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    enemyRef.current.position.set(x, 1, z);
    setPatrolTarget(new THREE.Vector3(
      x + (Math.random() * 40 - 20),
      1,
      z + (Math.random() * 40 - 20)
    ));
  }, [index]);

  // ULTRA SIMPLIFIED: Player detection
  const canSeePlayerNow = () => {
    if (!enemyRef.current || !playerRef.current) return false;
    
    try {
      // Get player position
      const playerPosition = playerRef.current?.getPosition?.();
      if (!playerPosition) return false;
      
      const enemyPos = enemyRef.current.position.clone();
      const distance = enemyPos.distanceTo(playerPosition);
      
      // If player is within detection range, the enemy can "see" them
      // This is simplified to always detect if within range
      if (distance <= detectionRange) {
        // Check if there are major obstacles (very simple check)
        enemyPos.y += 1.5;
        const playerEyeLevel = playerPosition.clone();
        playerEyeLevel.y += (playerRef.current?.getMode?.() === 'car' ? 2 : 1.6);
        
        const directionToPlayer = new THREE.Vector3();
        directionToPlayer.subVectors(playerEyeLevel, enemyPos);
        directionToPlayer.normalize();
        
        const raycaster = new THREE.Raycaster(enemyPos, directionToPlayer, 0, distance + 5);
        
        // Only check for very large obstacles
        const obstacles = [];
        scene.traverse((obj) => {
          if (obj.isMesh && obj !== enemyRef.current) {
            // Check if object is a building or large structure
            const isLargeBuilding = 
              (obj.geometry?.parameters?.width > 10 || 
               obj.geometry?.parameters?.height > 10 ||
               obj.geometry?.parameters?.depth > 10) &&
              !obj.name?.includes('ground') &&
              !obj.name?.includes('road');
            
            if (isLargeBuilding) {
              obstacles.push(obj);
            }
          }
        });
        
        const intersects = raycaster.intersectObjects(obstacles, false);
        return intersects.length === 0;
      }
      
      return false;
    } catch (error) {
      console.error("Error in canSeePlayerNow:", error);
      return false;
    }
  };

  const canHearPlayer = () => {
    if (!enemyRef.current || !playerRef.current) return false;
    
    try {
      const playerPosition = playerRef.current?.getPosition?.();
      if (!playerPosition) return false;
      
      const distance = enemyRef.current.position.distanceTo(playerPosition);
      const playerMode = playerRef.current?.getMode?.();
      
      const effectiveHearingRange = playerMode === 'car' ? hearingRange * 1.5 : hearingRange;
      return distance <= effectiveHearingRange;
    } catch (error) {
      console.error("Error in canHearPlayer:", error);
      return false;
    }
  };

  useFrame((state, delta) => {
    if (!enemyRef.current || health <= 0) return;
    if (!playerRef.current) return;

    const now = Date.now() / 1000;
    const nowMs = Date.now();

    // Check senses
    const canSee = canSeePlayerNow();
    const canHear = canHearPlayer();
    
    // Update refs and state
    canSeePlayerRef.current = canSee;
    setCanSeePlayer(canSee);
    
    if (canSee) {
      lastSeenPlayerRef.current = nowMs;
      setLastSeenPlayer(nowMs);
      
      const playerPosition = playerRef.current?.getPosition?.();
      if (playerPosition) {
        const pos = playerPosition.clone();
        playerLastKnownPositionRef.current = pos;
        setPlayerLastKnownPosition(pos);
      }
    }

    if (health <= 0) {
      setState('dead');
      stateRef.current = 'dead';
      enemyRef.current.rotation.x = Math.PI / 2;
      return;
    }

    // Get player position
    const playerPosition = playerRef.current?.getPosition?.();
    if (!playerPosition) return;
    
    const distanceToPlayer = enemyRef.current.position.distanceTo(playerPosition);

    // SIMPLIFIED AGGRESSIVE BEHAVIOR LOGIC
    // Using refs to ensure immediate updates
    
    if (stateRef.current !== 'dead') {
      if (canSee && distanceToPlayer <= attackRange) {
        // Attack if player is visible and in range
        if (stateRef.current !== 'attack') {
          setState('attack');
          stateRef.current = 'attack';
          console.log(`Enemy ${index}: ATTACKING player!`);
        }
      } 
      else if ((canSee || canHear) && distanceToPlayer <= detectionRange) {
        // Chase if player is detected
        if (stateRef.current !== 'chase') {
          setState('chase');
          stateRef.current = 'chase';
          console.log(`Enemy ${index}: CHASING player!`);
        }
      }
      else if (stateRef.current === 'chase' || stateRef.current === 'attack') {
        // Lost contact - return to patrol
        if (nowMs - lastSeenPlayerRef.current > 5000) { // 5 seconds
          setState('patrol');
          stateRef.current = 'patrol';
          playerLastKnownPositionRef.current = null;
          console.log(`Enemy ${index}: Lost player, returning to patrol`);
        }
      }
    }

    // Behavior execution based on current state
    const currentState = stateRef.current;
    
    switch(currentState) {
      case 'patrol':
        patrolBehavior(delta);
        break;
        
      case 'chase':
        const chaseTarget = playerPosition || playerLastKnownPositionRef.current;
        if (chaseTarget) {
          chaseBehavior(chaseTarget, delta);
        } else {
          patrolBehavior(delta);
        }
        break;
        
      case 'attack':
        attackBehavior(playerPosition, delta, now);
        break;
        
      case 'dead':
        // Do nothing
        break;
        
      default:
        patrolBehavior(delta);
    }

    // Keep enemy on ground
    enemyRef.current.position.y = 1;
  });

  const patrolBehavior = (delta) => {
    const directionToTarget = new THREE.Vector3();
    directionToTarget.subVectors(patrolTarget, enemyRef.current.position);
    
    if (directionToTarget.length() < 2) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 15 + Math.random() * 25;
      setPatrolTarget(new THREE.Vector3(
        enemyRef.current.position.x + Math.cos(angle) * radius,
        1,
        enemyRef.current.position.z + Math.sin(angle) * radius
      ));
    } else {
      directionToTarget.normalize();
      enemyRef.current.position.add(directionToTarget.multiplyScalar(wanderSpeed * delta));
      
      const targetRotation = Math.atan2(directionToTarget.x, directionToTarget.z);
      enemyRef.current.rotation.y = THREE.MathUtils.lerp(
        enemyRef.current.rotation.y,
        targetRotation,
        5 * delta
      );
    }
  };

  const chaseBehavior = (targetPosition, delta) => {
    if (!targetPosition) return;
    
    const chaseDirection = new THREE.Vector3();
    chaseDirection.subVectors(targetPosition, enemyRef.current.position);
    chaseDirection.y = 0;
    
    if (chaseDirection.length() > 1) {
      chaseDirection.normalize();
      enemyRef.current.position.add(chaseDirection.multiplyScalar(chaseSpeed * delta));
      
      const targetRotation = Math.atan2(chaseDirection.x, chaseDirection.z);
      enemyRef.current.rotation.y = THREE.MathUtils.lerp(
        enemyRef.current.rotation.y,
        targetRotation,
        10 * delta
      );
    }
  };

  const attackBehavior = (playerPosition, delta, now) => {
    if (!playerPosition) return;
    
    // Look at player
    const lookDirection = new THREE.Vector3();
    lookDirection.subVectors(playerPosition, enemyRef.current.position);
    lookDirection.y = 0;
    
    if (lookDirection.length() > 0.1) {
      lookDirection.normalize();
      const targetRotation = Math.atan2(lookDirection.x, lookDirection.z);
      enemyRef.current.rotation.y = targetRotation;
    }
    
    // Shoot at player
    if (now - lastShot > shotDelay) {
      setLastShot(now);
      
      const shootDirection = new THREE.Vector3();
      shootDirection.subVectors(playerPosition, enemyRef.current.position);
      shootDirection.normalize();
      
      const inaccuracy = 0.05;
      shootDirection.x += (Math.random() - 0.5) * inaccuracy;
      shootDirection.y += (Math.random() - 0.5) * inaccuracy * 0.5;
      shootDirection.z += (Math.random() - 0.5) * inaccuracy;
      shootDirection.normalize();
      
      if (onShoot) {
        const bulletStart = enemyRef.current.position.clone();
        bulletStart.y += 1.5;
        onShoot(bulletStart, shootDirection);
        console.log(`Enemy ${index}: FIRING at player!`);
      }
    }
    
    // Move around during attack
    const distance = enemyRef.current.position.distanceTo(playerPosition);
    
    if (distance < 15) {
      const strafeDirection = new THREE.Vector3();
      const perpendicular = new THREE.Vector3(-lookDirection.z, 0, lookDirection.x);
      perpendicular.normalize();
      
      const strafeAmount = Math.sin(now * 3) * 2;
      enemyRef.current.position.add(perpendicular.multiplyScalar(strafeAmount * delta));
    }
  };

  if (health <= 0) {
    return (
      <mesh ref={enemyRef} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[0.5, 0.5, 2, 8]} />
        <meshStandardMaterial color={0x333333} roughness={0.9} metalness={0.1} />
      </mesh>
    );
  }

  const getStateColor = () => {
    switch(state) {
      case 'attack': return 0xFF0000;
      case 'chase': return 0xFF6600;
      case 'patrol': return 0xCC0000;
      default: return 0xCC0000;
    }
  };

  return (
    <group ref={enemyRef}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.5, 2, 8]} />
        <meshStandardMaterial 
          color={getStateColor()} 
          roughness={0.8} 
          metalness={0.2} 
          emissive={state === 'attack' ? 0xFF0000 : state === 'chase' ? 0xFF6600 : 0x000000}
          emissiveIntensity={0.2}
        />
      </mesh>
      
      <mesh position={[0, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshStandardMaterial color={0x8B4513} roughness={0.8} metalness={0.1} />
      </mesh>
      
      <mesh position={[0, 3, 0]} visible={state !== 'patrol'}>
        <sphereGeometry args={[0.3, 4, 4]} />
        <meshBasicMaterial 
          color={state === 'attack' ? 0xFF0000 : 0xFF9900} 
          emissive={state === 'attack' ? 0xFF0000 : state === 'chase' ? 0xFF6600 : 0x000000}
          emissiveIntensity={0.5}
        />
      </mesh>
      
      <mesh position={[0, 2.5, 0]} visible={health < 100}>
        <boxGeometry args={[1, 0.1, 0.1]} />
        <meshBasicMaterial color={0x000000} />
        <mesh position={[-(1 - health/100)/2, 0, 0.01]}>
          <boxGeometry args={[health / 100, 0.08, 0.02]} />
          <meshBasicMaterial color={health > 50 ? 0x00FF00 : health > 20 ? 0xFFFF00 : 0xFF0000} />
        </mesh>
      </mesh>
    </group>
  );
});

export default Enemy;