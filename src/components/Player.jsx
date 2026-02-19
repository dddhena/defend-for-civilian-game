import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const Player = forwardRef(({ mode, speed, onSpeedChange, cameraRef, gamePaused, onToggleMode, checkCollision, carCooldown }, ref) => {
  const playerRef = useRef();
  const playerMeshRef = useRef();
  const { camera } = useThree();

  // Movement state
  const [movement, setMovement] = useState({
    forward: false, backward: false, left: false, right: false,
    jump: false, sprint: false, crouch: false
  });

  // Mouse look state (Moved to Ref for performance)
  const mouseLook = useRef({ x: 0, y: 0 });
  const [isMouseLocked, setIsMouseLocked] = useState(false);
  const [isGrounded, setIsGrounded] = useState(true);

  // Movement velocity for foot (for acceleration/deceleration)
  const footVelocity = useRef(new THREE.Vector3());

  // Movement parameters
  const walkSpeed = 8.0;
  const sprintSpeed = 12.0;
  const crouchSpeed = 4.0;
  const jumpStrength = 10.0;
  const gravity = 35.0;

  const carMaxSpeed = 80;
  const carAcceleration = 30;
  const carBraking = 50;
  const carTurnSpeed = 0.08;

  const tankMaxSpeed = 40;
  const tankAcceleration = 20;
  const tankBraking = 60;
  const tankTurnSpeed = 0.04;

  const heliLiftSpeed = 15;
  const heliTurnSpeed = 0.03;

  const jetMaxSpeed = 150;
  const jetAcceleration = 50;
  const jetTurnSpeed = 0.05;

  const mouseSensitivity = 0.002;
  const maxLookUp = Math.PI / 2.1;
  const maxLookDown = -Math.PI / 2.1;

  const verticalVelocity = useRef(0);
  const movementDirection = useRef(new THREE.Vector3());

  const hasInitialized = useRef(false);

  // Store camera reference and initialize position
  useEffect(() => {
    if (cameraRef) cameraRef.current = camera;

    if (!hasInitialized.current && camera && mode === 'foot') {
      camera.position.set(0, 1.6, 20); // Initial spawn point at eye level
      camera.rotation.set(0, 0, 0, 'YXZ');
      mouseLook.current = { x: 0, y: 0 };
      hasInitialized.current = true;
    }
  }, [camera, cameraRef, mode]);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    getPosition: () => {
      if (mode === 'foot') return camera.position.clone();
      if (playerRef.current) {
        const pos = playerRef.current.position.clone();
        pos.y = mode === 'tank' ? 1.5 : (mode === 'heli' ? pos.y : 1);
        return pos;
      }
      return new THREE.Vector3(0, 1, 0);
    },
    getMesh: () => playerMeshRef.current,
    getCamera: () => camera,
    getRotation: () => camera.rotation,
    getAimDirection: () => {
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(camera.quaternion);
      return direction;
    },
    getMode: () => mode
  }));

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gamePaused) return;
      const key = e.code.toLowerCase();
      if (key === 'keyw' || key === 'arrowup') setMovement(m => ({ ...m, forward: true }));
      if (key === 'keys' || key === 'arrowdown') setMovement(m => ({ ...m, backward: true }));
      if (key === 'keya' || key === 'arrowleft') setMovement(m => ({ ...m, left: true }));
      if (key === 'keyd' || key === 'arrowright') setMovement(m => ({ ...m, right: true }));
      if (key === 'space') setMovement(m => ({ ...m, jump: true }));
      if (key === 'shiftleft') setMovement(m => ({ ...m, sprint: true }));
      if (key === 'controlleft') setMovement(m => ({ ...m, crouch: true }));
      if ((key === 'keye' || key === 'keyc') && !carCooldown) onToggleMode?.();
    };
    const handleKeyUp = (e) => {
      const key = e.code.toLowerCase();
      if (key === 'keyw' || key === 'arrowup') setMovement(m => ({ ...m, forward: false }));
      if (key === 'keys' || key === 'arrowdown') setMovement(m => ({ ...m, backward: false }));
      if (key === 'keya' || key === 'arrowleft') setMovement(m => ({ ...m, left: false }));
      if (key === 'keyd' || key === 'arrowright') setMovement(m => ({ ...m, right: false }));
      if (key === 'space') setMovement(m => ({ ...m, jump: false }));
      if (key === 'shiftleft') setMovement(m => ({ ...m, sprint: false }));
      if (key === 'controlleft') setMovement(m => ({ ...m, crouch: false }));
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gamePaused, carCooldown, onToggleMode, mode]);

  // Mouse look controls
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isMouseLocked || gamePaused) return;
      // Mouse move RIGHT (positive) = Turn RIGHT (negative Y rotation in Three.js)
      mouseLook.current.x -= e.movementX * mouseSensitivity;
      // Mouse move DOWN (positive) = Look DOWN (negative X rotation in Three.js)
      mouseLook.current.y -= e.movementY * mouseSensitivity;
      mouseLook.current.y = Math.max(maxLookDown, Math.min(maxLookUp, mouseLook.current.y));
    };
    const handlePointerLockChange = () => setIsMouseLocked(document.pointerLockElement === document.body);
    const handleCanvasClick = () => { if (mode === 'foot' && !gamePaused && !isMouseLocked) document.body.requestPointerLock(); };
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    const canvas = document.querySelector('canvas');
    if (canvas) canvas.addEventListener('click', handleCanvasClick);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      if (canvas) canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [isMouseLocked, gamePaused, mode, mouseSensitivity, maxLookDown, maxLookUp]);

  const handleFootMovement = (delta) => {
    // Camera is already updated in useFrame, but let's ensure consistency here if needed
    // camera.rotation.set(mouseLook.current.y, mouseLook.current.x, 0, 'YXZ');

    let targetSpeed = 0;
    if (movement.forward || movement.backward || movement.left || movement.right) {
      targetSpeed = walkSpeed;
      if (movement.sprint) targetSpeed = sprintSpeed;
      if (movement.crouch) targetSpeed = crouchSpeed;
    }

    // Smooth movement direction
    const targetDir = new THREE.Vector3(0, 0, 0);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    forward.y = 0; right.y = 0;
    forward.normalize(); right.normalize();

    if (movement.forward) targetDir.add(forward);
    if (movement.backward) targetDir.sub(forward);
    if (movement.left) targetDir.sub(right);
    if (movement.right) targetDir.add(right);
    if (targetDir.length() > 0) targetDir.normalize();

    // Apply acceleration/deceleration
    const accel = 10.0;
    const targetVelocity = targetDir.multiplyScalar(targetSpeed);
    footVelocity.current.lerp(targetVelocity, accel * delta);

    if (footVelocity.current.length() > 0.01) {
      const nextX = camera.position.x + footVelocity.current.x * delta;
      const nextZ = camera.position.z + footVelocity.current.z * delta;

      if (!checkCollision || !checkCollision(nextX, nextZ, 0.5)) {
        camera.position.x = nextX;
        camera.position.z = nextZ;
      } else {
        // Stop movement on collision
        footVelocity.current.set(0, 0, 0);
      }
    }
    if (movement.jump && isGrounded) { verticalVelocity.current = jumpStrength; setIsGrounded(false); }
    if (!isGrounded) {
      verticalVelocity.current -= gravity * delta;
      camera.position.y += verticalVelocity.current * delta;
      if (camera.position.y < 1.6) { camera.position.y = 1.6; verticalVelocity.current = 0; setIsGrounded(true); }
    }
    if (playerRef.current) {
      playerRef.current.position.copy(camera.position);
      playerRef.current.position.y = 0;
      // Sync player mesh rotation with camera yaw
      playerRef.current.rotation.y = camera.rotation.y;
    }
  };

  const handleCarMovement = (delta) => {
    let newSpeed = speed;
    const isTank = mode === 'tank';
    const maxS = isTank ? tankMaxSpeed : carMaxSpeed;
    const accel = isTank ? tankAcceleration : carAcceleration;
    const brake = isTank ? tankBraking : carBraking;
    const turn = isTank ? tankTurnSpeed : carTurnSpeed;
    const radius = isTank ? 2.5 : 1.5;

    if (movement.forward) newSpeed = Math.min(newSpeed + accel * delta, maxS);
    else if (movement.backward) newSpeed = Math.max(newSpeed - brake * delta, -maxS * 0.4);
    else { newSpeed *= 0.96; if (Math.abs(newSpeed) < 0.5) newSpeed = 0; }
    onSpeedChange?.(newSpeed);

    if (Math.abs(newSpeed) > 0.5) {
      if (movement.left) playerRef.current.rotation.y += turn * (newSpeed > 0 ? 1 : -1);
      if (movement.right) playerRef.current.rotation.y -= turn * (newSpeed > 0 ? 1 : -1);
    }

    if (Math.abs(newSpeed) > 0.1) {
      const dist = newSpeed * delta;
      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(playerRef.current.quaternion);
      const nX = playerRef.current.position.x + fwd.x * dist;
      const nZ = playerRef.current.position.z + fwd.z * dist;
      if (!checkCollision || !checkCollision(nX, nZ, radius)) {
        playerRef.current.position.x = nX; playerRef.current.position.z = nZ;
      } else { newSpeed = 0; onSpeedChange?.(0); }
    }
    playerRef.current.position.y = isTank ? 0.3 : 2;
    const camOff = new THREE.Vector3(0, 5, 10).applyQuaternion(playerRef.current.quaternion);
    camera.position.lerp(playerRef.current.position.clone().add(camOff), 10 * delta); // Increased lerp speed
    camera.lookAt(playerRef.current.position.clone().add(new THREE.Vector3(0, 2, 0)));
  };

  const handleHeliMovement = (delta) => {
    let lift = 0;
    if (movement.jump) lift = heliLiftSpeed;
    if (movement.sprint) lift = -heliLiftSpeed;
    verticalVelocity.current = THREE.MathUtils.lerp(verticalVelocity.current, lift, 2 * delta);
    playerRef.current.position.y = Math.max(1.5, playerRef.current.position.y + verticalVelocity.current * delta);
    if (movement.forward) playerRef.current.position.add(new THREE.Vector3(0, 0, -1).applyQuaternion(playerRef.current.quaternion).multiplyScalar(heliMaxSpeed * delta));
    if (movement.backward) playerRef.current.position.add(new THREE.Vector3(0, 0, 1).applyQuaternion(playerRef.current.quaternion).multiplyScalar(heliMaxSpeed * 0.5 * delta));
    if (movement.left) playerRef.current.rotation.y += heliTurnSpeed;
    if (movement.right) playerRef.current.rotation.y -= heliTurnSpeed;
    const camOff = new THREE.Vector3(0, 8, 15).applyQuaternion(playerRef.current.quaternion);
    camera.position.lerp(playerRef.current.position.clone().add(camOff), 3 * delta);
    camera.lookAt(playerRef.current.position);
  };

  const handleJetMovement = (delta) => {
    let newSpeed = speed;
    if (movement.forward) newSpeed = Math.min(newSpeed + jetAcceleration * delta, jetMaxSpeed);
    else if (movement.backward) newSpeed = Math.max(newSpeed - jetAcceleration * delta, 20); // Minimum speed to stay airborne
    else newSpeed *= 0.99;
    onSpeedChange?.(newSpeed);

    // Height control
    if (movement.jump) playerRef.current.position.y += 20 * delta;
    if (movement.sprint) playerRef.current.position.y = Math.max(5, playerRef.current.position.y - 20 * delta);

    // Turn
    if (movement.left) playerRef.current.rotation.y += jetTurnSpeed;
    if (movement.right) playerRef.current.rotation.y -= jetTurnSpeed;

    // Move forward always
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(playerRef.current.quaternion);
    playerRef.current.position.add(forward.multiplyScalar(newSpeed * delta));

    // Follow camera
    const camOff = new THREE.Vector3(0, 5, 20).applyQuaternion(playerRef.current.quaternion);
    camera.position.lerp(playerRef.current.position.clone().add(camOff), 10 * delta); // Increased lerp speed
    camera.lookAt(playerRef.current.position);
  };

  useFrame((_, delta) => {
    if (gamePaused) return;

    // Apply mouse look rotation to camera Ref
    camera.rotation.order = 'YXZ';
    camera.rotation.y = mouseLook.current.x;
    camera.rotation.x = mouseLook.current.y;
    camera.rotation.z = 0; // Explicitly reset Z to prevent side-tilt
    if (mode === 'foot') {
      handleFootMovement(delta);
    } else if (mode === 'car' || mode === 'tank') {
      handleCarMovement(delta);
    } else if (mode === 'heli') {
      handleHeliMovement(delta);
    } else if (mode === 'jet') {
      handleJetMovement(delta);
    }
    if (playerRef.current) {
      const b = 240;
      playerRef.current.position.x = Math.max(-b, Math.min(b, playerRef.current.position.x));
      playerRef.current.position.z = Math.max(-b, Math.min(b, playerRef.current.position.z));
    }
    if (playerMeshRef.current) {
      playerMeshRef.current.position.copy(mode === 'foot' ? camera.position : playerRef.current.position);
      playerMeshRef.current.position.y = mode === 'foot' ? 0.9 : 1;
    }
  });

  return (
    <group>
      <mesh ref={playerMeshRef} visible={false}>
        <capsuleGeometry args={[0.5, 1.8, 8, 16]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
      <mesh ref={playerRef} visible={mode !== 'foot'}>
        {mode === 'heli' ? (
          <group>
            <mesh><boxGeometry args={[1.5, 1.2, 4]} /><meshStandardMaterial color={0x000000} /></mesh>
            <mesh position={[0, 0.2, 1.5]}><boxGeometry args={[1.3, 0.8, 1.2]} /><meshStandardMaterial color={0x33ccff} transparent opacity={0.6} /></mesh>
            <mesh position={[0, 0.2, -3]}><boxGeometry args={[0.3, 0.3, 3]} /><meshStandardMaterial color={0x000000} /></mesh>
            <mesh position={[0, 0.8, 0]}><boxGeometry args={[6, 0.05, 0.2]} /><meshStandardMaterial color={0x111111} /></mesh>
          </group>
        ) : mode === 'jet' ? (
          <group>
            {/* Jet Body */}
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.4, 0.6, 6, 8]} />
              <meshStandardMaterial color={0x555555} metalness={0.9} />
            </mesh>
            {/* Wings */}
            <mesh position={[0, 0, 0]} castShadow>
              <boxGeometry args={[6, 0.1, 2]} />
              <meshStandardMaterial color={0x444444} />
            </mesh>
            {/* Tail */}
            <mesh position={[0, 0.5, -2.5]} castShadow>
              <boxGeometry args={[0.1, 1, 1]} />
              <meshStandardMaterial color={0x444444} />
            </mesh>
            {/* Cockpit */}
            <mesh position={[0, 0.5, 1.5]} castShadow>
              <sphereGeometry args={[0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color={0x33ccff} transparent opacity={0.6} />
            </mesh>
          </group>
        ) : mode === 'tank' ? (
          <group>
            <mesh position={[0, 0.6, 0]}><boxGeometry args={[3.5, 1.0, 5.5]} /><meshStandardMaterial color={0x2e7d32} /></mesh>
            <mesh position={[0, 1.5, 0.5]}><boxGeometry args={[2.5, 0.8, 2.8]} /><meshStandardMaterial color={0x1b5e20} /></mesh>
            <mesh position={[0, 1.6, 3.2]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.2, 0.25, 3.5, 8]} /><meshStandardMaterial color={0x111111} /></mesh>
            <mesh position={[1.8, 0.4, 0]}><boxGeometry args={[0.8, 0.8, 5.8]} /><meshStandardMaterial color={0x111111} /></mesh>
            <mesh position={[-1.8, 0.4, 0]}><boxGeometry args={[0.8, 0.8, 5.8]} /><meshStandardMaterial color={0x111111} /></mesh>
          </group>
        ) : (
          <group>
            <mesh position={[0, 0.6, 0]}><boxGeometry args={[2.2, 0.5, 4.5]} /><meshStandardMaterial color={0x1a237e} /></mesh>
            <mesh position={[0, 1.3, -0.2]}><boxGeometry args={[1.8, 0.9, 2.5]} /><meshStandardMaterial color={0x111111} /></mesh>
            {[[1.2, 0.4, 1.5], [-1.2, 0.4, 1.5], [1.2, 0.4, -1.5], [-1.2, 0.4, -1.5]].map((p, i) => (
              <mesh key={i} position={p} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.45, 0.45, 0.5, 16]} /><meshStandardMaterial color={0x111111} /></mesh>
            ))}
          </group>
        )}
      </mesh>
    </group>
  );
});

export default Player;