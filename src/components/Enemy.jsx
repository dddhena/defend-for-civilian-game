import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const Enemy = forwardRef(({ index, playerRef, onShoot, checkCollision }, ref) => {
  const enemyRef = useRef();
  const { scene } = useThree();

  const [health, setHealth] = useState(100);
  const [state, setState] = useState('patrol');
  const [patrolTarget, setPatrolTarget] = useState(new THREE.Vector3());
  const [lastShot, setLastShot] = useState(0);
  const [canSeePlayer, setCanSeePlayer] = useState(false);
  const [lastSeenPlayer, setLastSeenPlayer] = useState(0);
  const [playerLastKnownPosition, setPlayerLastKnownPosition] = useState(null);

  // Animation Refs
  const bodyGroupRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const walkCycle = useRef(0);

  // Balanced Stats
  const shotDelay = 2.5 + Math.random() * 2.0;
  const detectionRange = 35;
  const hearingRange = 15;
  const attackRange = 15;
  const wanderSpeed = 0.5; // Crawling speed
  const chaseSpeed = 1.0; // Very slow walk

  // Use refs for values that need to be accessed in useFrame without triggering re-renders
  // Use refs for values that need to be accessed in useFrame without triggering re-renders
  const stateRef = useRef('patrol');
  const canSeePlayerRef = useRef(false);
  const lastSeenPlayerRef = useRef(0);
  const playerLastKnownPositionRef = useRef(null);
  const isInitialized = useRef(false);

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
    if (isInitialized.current) return;

    const angle = (index / 15) * Math.PI * 2;
    const radius = 40 + Math.random() * 60;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // Check if spawn position is valid
    let spawnX = x;
    let spawnZ = z;
    if (checkCollision && checkCollision(spawnX, spawnZ, 0.5)) {
      // If inside building, move slightly
      spawnX += 5;
      spawnZ += 5;
    }

    if (enemyRef.current) {
      enemyRef.current.position.set(spawnX, 1, spawnZ);
      isInitialized.current = true;
    }

    // Initialize patrol target relative to spawn
    setPatrolTarget(new THREE.Vector3(
      spawnX + (Math.random() * 40 - 20),
      1,
      spawnZ + (Math.random() * 40 - 20)
    ));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // ULTRA SIMPLIFIED: Player detection
  const canSeePlayerNow = () => {
    if (!enemyRef.current || !playerRef.current) return false;

    try {
      // Get player position
      const playerPosition = playerRef.current?.getPosition?.();
      if (!playerPosition) return false;

      const enemyPos = enemyRef.current.position.clone();
      const distance = enemyPos.distanceTo(playerPosition);

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
      // console.error("Error in canSeePlayerNow:", error);
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

    // AI LOGIC
    if (stateRef.current !== 'dead') {
      if (canSee && distanceToPlayer <= attackRange) {
        if (stateRef.current !== 'attack') {
          setState('attack');
          stateRef.current = 'attack';
        }
      }
      else if ((canSee || canHear) && distanceToPlayer <= detectionRange) {
        if (stateRef.current !== 'chase') {
          setState('chase');
          stateRef.current = 'chase';
        }
      }
      else if (stateRef.current === 'chase' || stateRef.current === 'attack') {
        if (nowMs - lastSeenPlayerRef.current > 5000) {
          setState('patrol');
          stateRef.current = 'patrol';
          playerLastKnownPositionRef.current = null;
        }
      }
    }

    const currentState = stateRef.current;
    let isMoving = false;
    let currentMoveSpeed = 0;

    switch (currentState) {
      case 'patrol':
        isMoving = patrolBehavior(delta);
        currentMoveSpeed = wanderSpeed;
        break;
      case 'chase':
        const chaseTarget = playerPosition || playerLastKnownPositionRef.current;
        if (chaseTarget) {
          isMoving = chaseBehavior(chaseTarget, delta);
          currentMoveSpeed = chaseSpeed;
        } else {
          isMoving = patrolBehavior(delta);
          currentMoveSpeed = wanderSpeed;
        }
        break;
      case 'attack':
        isMoving = attackBehavior(playerPosition, delta, now);
        currentMoveSpeed = wanderSpeed; // Move slowly while attacking
        break;
      case 'dead':
        break;
      default:
        isMoving = patrolBehavior(delta);
        currentMoveSpeed = wanderSpeed;
    }

    // ANIMATION LOGIC
    if (isMoving) {
      walkCycle.current += delta * currentMoveSpeed * 8; // Adjust multiplier for step cadence

      const legSwing = Math.sin(walkCycle.current) * 0.6;
      const armSwing = Math.sin(walkCycle.current) * 0.6;
      const bodyBob = Math.abs(Math.sin(walkCycle.current)) * 0.08;

      if (leftLegRef.current) leftLegRef.current.rotation.x = legSwing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -legSwing;

      if (leftArmRef.current) leftArmRef.current.rotation.x = -armSwing;
      if (rightArmRef.current) rightArmRef.current.rotation.x = armSwing;

      if (bodyGroupRef.current) bodyGroupRef.current.position.y = -1 + bodyBob;
    } else {
      // Return to idle
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, delta * 5);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, delta * 5);
      if (bodyGroupRef.current) bodyGroupRef.current.position.y = THREE.MathUtils.lerp(bodyGroupRef.current.position.y, -1, delta * 5);
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0, delta * 5);
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0, delta * 5);
    }

    if (enemyRef.current) {
      enemyRef.current.position.y = 1;
    }
  });

  const patrolBehavior = (delta) => {
    const directionToTarget = new THREE.Vector3();
    directionToTarget.subVectors(patrolTarget, enemyRef.current.position);

    if (directionToTarget.length() < 2) {
      pickNewPatrolTarget();
      return false;
    } else {
      directionToTarget.normalize();
      const moveVec = directionToTarget.clone().multiplyScalar(wanderSpeed * delta);
      const newPos = enemyRef.current.position.clone().add(moveVec);

      let moved = false;
      if (!checkCollision || !checkCollision(newPos.x, newPos.z, 0.5)) {
        enemyRef.current.position.add(moveVec);
        moved = true;
      } else {
        pickNewPatrolTarget();
      }

      const targetRotation = Math.atan2(directionToTarget.x, directionToTarget.z);
      enemyRef.current.rotation.y = THREE.MathUtils.lerp(
        enemyRef.current.rotation.y,
        targetRotation,
        5 * delta
      );

      return moved;
    }
  };

  const pickNewPatrolTarget = () => {
    const angle = Math.random() * Math.PI * 2;
    const radius = 15 + Math.random() * 25;
    const newTarget = new THREE.Vector3(
      enemyRef.current.position.x + Math.cos(angle) * radius,
      1,
      enemyRef.current.position.z + Math.sin(angle) * radius
    );

    if (!checkCollision || !checkCollision(newTarget.x, newTarget.z, 0.5)) {
      setPatrolTarget(newTarget);
    } else {
      setPatrolTarget(new THREE.Vector3(
        enemyRef.current.position.x + (Math.random() - 0.5) * 10,
        1,
        enemyRef.current.position.z + (Math.random() - 0.5) * 10
      ));
    }
  };

  const chaseBehavior = (targetPosition, delta) => {
    if (!targetPosition) return false;

    const chaseDirection = new THREE.Vector3();
    chaseDirection.subVectors(targetPosition, enemyRef.current.position);
    chaseDirection.y = 0;

    if (chaseDirection.length() > 1) {
      chaseDirection.normalize();

      const moveVec = chaseDirection.clone().multiplyScalar(chaseSpeed * delta);
      const newPos = enemyRef.current.position.clone().add(moveVec);

      let moved = false;
      if (!checkCollision || !checkCollision(newPos.x, newPos.z, 0.5)) {
        enemyRef.current.position.add(moveVec);
        moved = true;
      } else {
        // Slide logic
        const tryX = enemyRef.current.position.clone();
        tryX.x += moveVec.x;
        if (!checkCollision(tryX.x, tryX.z, 0.5)) {
          enemyRef.current.position.x += moveVec.x;
          moved = true;
        } else {
          const tryZ = enemyRef.current.position.clone();
          tryZ.z += moveVec.z;
          if (!checkCollision(tryZ.x, tryZ.z, 0.5)) {
            enemyRef.current.position.z += moveVec.z;
            moved = true;
          }
        }
      }

      const targetRotation = Math.atan2(chaseDirection.x, chaseDirection.z);
      enemyRef.current.rotation.y = THREE.MathUtils.lerp(
        enemyRef.current.rotation.y,
        targetRotation,
        10 * delta
      );

      return moved;
    }
    return false;
  };

  const attackBehavior = (playerPosition, delta, now) => {
    if (!playerPosition) return false;

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

      const inaccuracy = 0.08; // Less accurate
      shootDirection.x += (Math.random() - 0.5) * inaccuracy;
      shootDirection.y += (Math.random() - 0.5) * inaccuracy * 0.5;
      shootDirection.z += (Math.random() - 0.5) * inaccuracy;
      shootDirection.normalize();

      if (onShoot) {
        const bulletStart = enemyRef.current.position.clone();
        bulletStart.y += 1.5;
        onShoot(bulletStart, shootDirection);
      }
    }

    // Move around during attack
    const distance = enemyRef.current.position.distanceTo(playerPosition);
    let moved = false;

    if (distance < 15) {
      const strafeDirection = new THREE.Vector3();
      const perpendicular = new THREE.Vector3(-lookDirection.z, 0, lookDirection.x);
      perpendicular.normalize();

      const strafeAmount = Math.sin(now * 3) * 2;
      const moveVec = perpendicular.multiplyScalar(strafeAmount * delta);
      const newPos = enemyRef.current.position.clone().add(moveVec);

      if (!checkCollision || !checkCollision(newPos.x, newPos.z, 0.5)) {
        enemyRef.current.position.add(moveVec);
        moved = true;
      }
    }
    return moved;
  };

  if (health <= 0) {
    return (
      <mesh ref={enemyRef} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[0.4, 0.4, 1.7, 8]} />
        <meshStandardMaterial color={0x333333} roughness={0.9} metalness={0.1} />
      </mesh>
    );
  }

  const getStateColor = () => {
    switch (state) {
      case 'attack': return 0xFF0000;
      case 'chase': return 0xFF6600;
      case 'patrol': return 0x333333; // Darker outfit for terrorists
      default: return 0x333333;
    }
  };

  return (
    <group ref={enemyRef}>
      {/* Humanoid Model - Group for Animation */}
      <group ref={bodyGroupRef} position={[0, -1, 0]}>
        {/* Legs */}
        <group ref={leftLegRef} position={[-0.2, 0.8, 0]}>
          <mesh position={[0, -0.4, 0]} castShadow>
            <boxGeometry args={[0.2, 0.8, 0.2]} />
            <meshStandardMaterial color={0x222222} />
          </mesh>
        </group>
        <group ref={rightLegRef} position={[0.2, 0.8, 0]}>
          <mesh position={[0, -0.4, 0]} castShadow>
            <boxGeometry args={[0.2, 0.8, 0.2]} />
            <meshStandardMaterial color={0x222222} />
          </mesh>
        </group>

        {/* Body */}
        <mesh position={[0, 1.1, 0]} castShadow>
          <boxGeometry args={[0.5, 0.7, 0.3]} />
          <meshStandardMaterial color={getStateColor()} />
        </mesh>

        {/* Head */}
        <mesh position={[0, 1.65, 0]} castShadow>
          <boxGeometry args={[0.25, 0.3, 0.25]} />
          <meshStandardMaterial color={0xFFCCAA} /> {/* Skin tone */}
          {/* Balaclava / Mask */}
          <mesh position={[0, 0.05, 0.01]}>
            <boxGeometry args={[0.26, 0.2, 0.26]} />
            <meshStandardMaterial color={0x111111} />
          </mesh>
        </mesh>

        {/* Arms */}
        <group ref={leftArmRef} position={[-0.35, 1.4, 0]}>
          <mesh position={[0, -0.35, 0]} castShadow>
            <boxGeometry args={[0.15, 0.7, 0.15]} />
            <meshStandardMaterial color={getStateColor()} />
          </mesh>
        </group>
        <group ref={rightArmRef} position={[0.35, 1.4, 0]}>
          <mesh position={[0, -0.35, 0]} castShadow>
            <boxGeometry args={[0.15, 0.7, 0.15]} />
            <meshStandardMaterial color={getStateColor()} />
          </mesh>
          {/* Weapon attached to right arm */}
          <mesh position={[0, -0.6, 0.3]} rotation={[1.5, 0, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.6]} />
            <meshStandardMaterial color={0x000000} />
          </mesh>
        </group>
      </group>

      {/* Status Indicators */}
      <mesh position={[0, 2.2, 0]} visible={state !== 'patrol'}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial
          color={state === 'attack' ? 0xFF0000 : 0xFF9900}
          emissive={state === 'attack' ? 0xFF0000 : state === 'chase' ? 0xFF6600 : 0x000000}
          emissiveIntensity={0.8}
        />
      </mesh>

      <mesh position={[0, 2.0, 0]} visible={health < 100}>
        <boxGeometry args={[0.8, 0.1, 0.1]} />
        <meshBasicMaterial color={0x000000} />
        <mesh position={[-(1 - health / 100) / 2.5, 0, 0.01]}>
          <boxGeometry args={[health / 100 * 0.8, 0.08, 0.02]} />
          <meshBasicMaterial color={health > 50 ? 0x00FF00 : health > 20 ? 0xFFFF00 : 0xFF0000} />
        </mesh>
      </mesh>
    </group>
  );
});

export default Enemy;