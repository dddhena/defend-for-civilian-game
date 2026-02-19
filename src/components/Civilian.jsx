import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Civilian = ({ index, playerRef, enemiesRef, onKilled }) => {
  const civilianRef = useRef();
  const [health, setHealth] = useState(100);
  const [state, setState] = useState('wander');
  const [targetPosition, setTargetPosition] = useState(new THREE.Vector3());
  const [lastStateChange, setLastStateChange] = useState(0);
  const [scared, setScared] = useState(false);
  const [fleeDirection, setFleeDirection] = useState(new THREE.Vector3());
  const [panicked, setPanicked] = useState(false);
  const [screaming, setScreaming] = useState(false);

  useEffect(() => {
    const angle = (index / 50) * Math.PI * 2;
    const radius = 150 + Math.random() * 100;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    civilianRef.current.position.set(x, 0.9, z);

    setTargetPosition(new THREE.Vector3(
      x + (Math.random() * 40 - 20),
      0.9,
      z + (Math.random() * 40 - 20)
    ));
  }, [index]);

  useFrame((state, delta) => {
    if (!civilianRef.current || health <= 0) return;

    const now = Date.now() / 1000;
    const playerPosition = playerRef.current?.getPosition?.();

    // Check for nearby enemies
    let closestEnemyDistance = Infinity;
    let closestEnemyPosition = null;

    if (enemiesRef?.current) {
      enemiesRef.current.forEach(enemy => {
        if (enemy && enemy.health > 0 && enemy.mesh) {
          const enemyPos = enemy.mesh.position.clone();
          const distance = civilianRef.current.position.distanceTo(enemyPos);

          if (distance < 30 && distance < closestEnemyDistance) {
            closestEnemyDistance = distance;
            closestEnemyPosition = enemyPos;
          }
        }
      });
    }

    // Check if enemy is shooting nearby
    let enemyShootingNearby = false;
    if (enemiesRef?.current) {
      enemiesRef.current.forEach(enemy => {
        if (enemy && enemy.health > 0 && enemy.state === 'attack') {
          const distance = civilianRef.current.position.distanceTo(enemy.mesh.position);
          if (distance < 40) {
            enemyShootingNearby = true;
          }
        }
      });
    }

    // If enemy is close or shooting, flee!
    if ((closestEnemyDistance < 20 || enemyShootingNearby) && !panicked) {
      setPanicked(true);
      setState('flee');
      setScared(true);
      setScreaming(true);

      // Run toward player (police) for help
      if (playerPosition) {
        const directionToPlayer = new THREE.Vector3();
        directionToPlayer.subVectors(playerPosition, civilianRef.current.position);
        directionToPlayer.normalize();
        setFleeDirection(directionToPlayer);
      } else {
        // Run away from enemy
        const directionFromEnemy = new THREE.Vector3();
        directionFromEnemy.subVectors(civilianRef.current.position, closestEnemyPosition);
        directionFromEnemy.normalize();
        setFleeDirection(directionFromEnemy);
      }

      // Scream for help (temporary effect)
      setTimeout(() => setScreaming(false), 3000);
    }

    // Take damage if enemy is very close
    if (closestEnemyDistance < 3) {
      setHealth(prev => {
        const newHealth = Math.max(0, prev - 10 * delta);
        if (newHealth <= 0) {
          // Civilian killed
          setState('dead');
          onKilled?.(); // Notify game that civilian was killed
        }
        return newHealth;
      });
    }

    // If panicked but no longer in danger, calm down after a while
    if (panicked && closestEnemyDistance > 30 && !enemyShootingNearby) {
      if (now - lastStateChange > 10) {
        setPanicked(false);
        setScared(false);
        setState('wander');
        setLastStateChange(now);
      }
    }

    switch (state) {
      case 'wander':
        const direction = new THREE.Vector3();
        direction.subVectors(targetPosition, civilianRef.current.position);

        if (direction.length() < 2) {
          setTargetPosition(new THREE.Vector3(
            civilianRef.current.position.x + (Math.random() * 40 - 20),
            0.9,
            civilianRef.current.position.z + (Math.random() * 40 - 20)
          ));
        } else {
          direction.normalize();
          civilianRef.current.position.add(direction.multiplyScalar(1.5 * delta));

          if (direction.length() > 0.1) {
            civilianRef.current.lookAt(
              civilianRef.current.position.clone().add(direction)
            );
          }
        }

        if (now - lastStateChange > 10 && Math.random() < 0.1) {
          setState('idle');
          setLastStateChange(now);
        }
        break;

      case 'idle':
        if (now - lastStateChange > 5) {
          setState('wander');
          setLastStateChange(now);
        }
        break;

      case 'flee':
        if (scared) {
          // Run in flee direction (toward player or away from enemy)
          civilianRef.current.position.add(fleeDirection.clone().multiplyScalar(4 * delta));

          // Look in direction of movement
          if (fleeDirection.length() > 0.1) {
            civilianRef.current.lookAt(
              civilianRef.current.position.clone().add(fleeDirection)
            );
          }
        }

        if (now - lastStateChange > 15) {
          setScared(false);
          setState('wander');
          setLastStateChange(now);
        }
        break;

      case 'dead':
        // Fall to ground
        civilianRef.current.rotation.x = Math.PI / 2;
        break;
    }

    // Keep on ground
    if (state !== 'dead') {
      civilianRef.current.position.y = 0.9;
    }
  });

  if (health <= 0) {
    return (
      <mesh ref={civilianRef} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[0.4, 0.4, 1.8, 8]} />
        <meshStandardMaterial
          color={0x333333}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
    );
  }

  return (
    <mesh ref={civilianRef} castShadow receiveShadow>
      <cylinderGeometry args={[0.4, 0.4, 1.8, 8]} />
      <meshStandardMaterial
        color={panicked ? 0xFF6B6B : (scared ? 0xFFA726 : 0x00BCD4)}
        roughness={0.8}
        metalness={0.2}
      />
      {/* Head */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color={0xFFCCAA} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Scream indicator */}
      {screaming && (
        <mesh position={[0, 2.5, 0]}>
          <sphereGeometry args={[0.3, 4, 4]} />
          <meshBasicMaterial color={0xFF0000} transparent opacity={0.7} />
        </mesh>
      )}
    </mesh>
  );
};

export default Civilian;