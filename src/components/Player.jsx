import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const Player = forwardRef(({ mode, speed, onSpeedChange, cameraRef, gamePaused, onToggleMode }, ref) => {
  const playerRef = useRef();
  const playerMeshRef = useRef();
  const { camera, size } = useThree();
  
  // Movement state
  const [movement, setMovement] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    crouch: false
  });
  
  // Mouse look state
  const [mouseLook, setMouseLook] = useState({ x: 0, y: 0 });
  const [isMouseLocked, setIsMouseLocked] = useState(false);
  const [isGrounded, setIsGrounded] = useState(true);
  const [carExitCooldown, setCarExitCooldown] = useState(false);

  // Movement parameters
  const walkSpeed = 8.0;
  const sprintSpeed = 12.0;
  const crouchSpeed = 4.0;
  const jumpStrength = 10.0;
  const acceleration = 25.0;
  const deceleration = 20.0;
  const airControl = 0.5;
  const gravity = 35.0;
  
  const carMaxSpeed = 80;
  const carAcceleration = 30;
  const carBraking = 50;
  const carTurnSpeed = 0.08;
  const carDriftFactor = 0.3;
  
  const mouseSensitivity = 0.002;
  const maxLookUp = Math.PI / 2.1;
  const maxLookDown = -Math.PI / 2.1;
  
  const velocity = useRef(new THREE.Vector3());
  const verticalVelocity = useRef(0);
  const rotation = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const movementDirection = useRef(new THREE.Vector3());

  // Store camera reference
  useEffect(() => {
    if (cameraRef) {
      cameraRef.current = camera;
    }
  }, [camera, cameraRef]);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    getPosition: () => {
      if (mode === 'foot') {
        return camera.position.clone();
      } else {
        if (playerRef.current) {
          const pos = playerRef.current.position.clone();
          pos.y = 1;
          return pos;
        }
        return new THREE.Vector3(0, 1, 0);
      }
    },
    getMesh: () => playerMeshRef.current,
    getCamera: () => camera,
    getRotation: () => camera.rotation,
    getVelocity: () => velocity.current,
    isGrounded: () => isGrounded,
    getAimDirection: () => {
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(camera.quaternion);
      return direction;
    },
    getMode: () => mode,
    getPositionSimple: () => {
      return mode === 'foot' ? camera.position.clone() : 
             playerRef.current ? playerRef.current.position.clone() : 
             new THREE.Vector3();
    }
  }));

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gamePaused) return;
      
      switch(e.code.toLowerCase()) {
        case 'keyw':
        case 'arrowup':
          setMovement(prev => ({ ...prev, forward: true }));
          break;
        case 'keys':
        case 'arrowdown':
          setMovement(prev => ({ ...prev, backward: true }));
          break;
        case 'keya':
        case 'arrowleft':
          setMovement(prev => ({ ...prev, left: true }));
          break;
        case 'keyd':
        case 'arrowright':
          setMovement(prev => ({ ...prev, right: true }));
          break;
        case 'space':
          if (mode === 'foot' && isGrounded) {
            setMovement(prev => ({ ...prev, jump: true }));
          }
          break;
        case 'shiftleft':
        case 'shiftright':
          if (mode === 'foot') {
            setMovement(prev => ({ ...prev, sprint: true }));
          }
          break;
        case 'controlleft':
        case 'controlright':
          if (mode === 'foot') {
            setMovement(prev => ({ ...prev, crouch: true }));
          }
          break;
        case 'keye':
          if (mode === 'car' && !carExitCooldown && Math.abs(speed) < 5) {
            if (onToggleMode) {
              onToggleMode();
              setCarExitCooldown(true);
              setTimeout(() => setCarExitCooldown(false), 1000);
            }
          }
          break;
      }
    };

    const handleKeyUp = (e) => {
      switch(e.code.toLowerCase()) {
        case 'keyw':
        case 'arrowup':
          setMovement(prev => ({ ...prev, forward: false }));
          break;
        case 'keys':
        case 'arrowdown':
          setMovement(prev => ({ ...prev, backward: false }));
          break;
        case 'keya':
        case 'arrowleft':
          setMovement(prev => ({ ...prev, left: false }));
          break;
        case 'keyd':
        case 'arrowright':
          setMovement(prev => ({ ...prev, right: false }));
          break;
        case 'space':
          setMovement(prev => ({ ...prev, jump: false }));
          break;
        case 'shiftleft':
        case 'shiftright':
          setMovement(prev => ({ ...prev, sprint: false }));
          break;
        case 'controlleft':
        case 'controlright':
          setMovement(prev => ({ ...prev, crouch: false }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gamePaused, mode, isGrounded, speed, carExitCooldown, onToggleMode]);

  // Mouse look controls
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isMouseLocked || gamePaused) return;
      
      const movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
      const movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
      
      setMouseLook(prev => ({
        x: prev.x + movementX * mouseSensitivity,
        y: Math.max(maxLookDown, Math.min(maxLookUp, prev.y - movementY * mouseSensitivity))
      }));
    };

    // Pointer lock for mouse look
    const handlePointerLockChange = () => {
      const locked = document.pointerLockElement === document.body;
      setIsMouseLocked(locked);
      
      if (!locked) {
        setMouseLook({ x: 0, y: 0 });
      }
    };

    // Click to lock pointer
    const handleCanvasClick = () => {
      if (mode === 'foot' && !gamePaused && !isMouseLocked) {
        document.body.requestPointerLock();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('click', handleCanvasClick);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      
      if (canvas) {
        canvas.removeEventListener('click', handleCanvasClick);
      }
    };
  }, [isMouseLocked, gamePaused, mode]);

  // SINGLE useFrame hook for all updates
  useFrame((state, delta) => {
    if (gamePaused) return;

    // Apply mouse look rotation
    rotation.current.y = mouseLook.x;
    rotation.current.x = mouseLook.y;
    
    if (mode === 'foot') {
      handleFootMovement(delta);
    } else {
      handleCarMovement(delta);
    }
    
    // Update detection mesh position
    updateDetectionMesh();
  });

  const updateDetectionMesh = () => {
    if (playerMeshRef.current) {
      if (mode === 'foot') {
        // In foot mode, mesh follows camera position at ground level
        playerMeshRef.current.position.copy(camera.position);
        playerMeshRef.current.position.y = 0.9; // Ground level
      } else {
        // In car mode, mesh follows car position
        if (playerRef.current) {
          playerMeshRef.current.position.copy(playerRef.current.position);
          playerMeshRef.current.position.y = 1; // Car height for detection
        }
      }
    }
  };

  const handleFootMovement = (delta) => {
    // Apply camera rotation
    camera.rotation.x = rotation.current.x;
    camera.rotation.y = rotation.current.y;
    camera.rotation.z = rotation.current.z;
    
    // Calculate movement speed
    let moveSpeed = walkSpeed;
    if (movement.sprint) moveSpeed = sprintSpeed;
    if (movement.crouch) moveSpeed = crouchSpeed;
    
    // Reset movement direction
    movementDirection.current.set(0, 0, 0);
    
    // Get forward and right vectors from camera rotation
    const forward = new THREE.Vector3(0, 0, -1);
    const right = new THREE.Vector3(1, 0, 0);
    
    forward.applyQuaternion(camera.quaternion);
    right.applyQuaternion(camera.quaternion);
    
    // Keep movement horizontal
    forward.y = 0;
    right.y = 0;
    forward.normalize();
    right.normalize();
    
    // Apply movement input (SIMPLIFIED)
    if (movement.forward) movementDirection.current.add(forward);
    if (movement.backward) movementDirection.current.sub(forward);
    if (movement.left) movementDirection.current.sub(right);
    if (movement.right) movementDirection.current.add(right);
    
    // Normalize diagonal movement
    if (movementDirection.current.length() > 0) {
      movementDirection.current.normalize();
    }
    
    // Apply movement directly (SIMPLIFIED VERSION)
    if (movementDirection.current.length() > 0) {
      const moveDistance = moveSpeed * delta;
      camera.position.x += movementDirection.current.x * moveDistance;
      camera.position.z += movementDirection.current.z * moveDistance;
    }
    
    // Handle jumping
    if (movement.jump && isGrounded) {
      verticalVelocity.current = jumpStrength;
      setIsGrounded(false);
      setMovement(prev => ({ ...prev, jump: false }));
    }
    
    // Apply gravity
    if (!isGrounded) {
      verticalVelocity.current -= gravity * delta;
      camera.position.y += verticalVelocity.current * delta;
      
      // Ground collision
      if (camera.position.y < 1.6) {
        camera.position.y = 1.6;
        verticalVelocity.current = 0;
        setIsGrounded(true);
      }
    }
    
    // Update player mesh position
    if (playerRef.current) {
      playerRef.current.position.copy(camera.position);
      playerRef.current.position.y = 0;
      playerRef.current.rotation.copy(camera.rotation);
    }
    
    // Keep within world bounds
    const bounds = 240;
    camera.position.x = Math.max(-bounds, Math.min(bounds, camera.position.x));
    camera.position.z = Math.max(-bounds, Math.min(bounds, camera.position.z));
  };

  const handleCarMovement = (delta) => {
    let newSpeed = speed;
    
    // Car controls
    if (movement.forward) {
      newSpeed += carAcceleration * delta;
      if (newSpeed > carMaxSpeed) newSpeed = carMaxSpeed;
    } else if (movement.backward) {
      newSpeed -= carBraking * delta;
      if (newSpeed < -carMaxSpeed * 0.4) newSpeed = -carMaxSpeed * 0.4;
    } else {
      // Natural deceleration
      newSpeed *= 0.96;
      if (Math.abs(newSpeed) < 0.5) newSpeed = 0;
    }
    
    if (onSpeedChange) {
      onSpeedChange(newSpeed);
    }
    
    // Steering (SIMPLIFIED)
    if (Math.abs(newSpeed) > 0.5) {
      let turnAmount = 0;
      if (movement.left) turnAmount = carTurnSpeed;
      if (movement.right) turnAmount = -carTurnSpeed;
      
      // Simple steering without drift for now
      if (playerRef.current) {
        playerRef.current.rotation.y += turnAmount * (newSpeed > 0 ? 1 : -1);
      }
    }
    
    // Apply car movement
    if (Math.abs(newSpeed) > 0.1 && playerRef.current) {
      const moveDistance = newSpeed * delta;
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(playerRef.current.quaternion);
      
      playerRef.current.position.x += forward.x * moveDistance;
      playerRef.current.position.z += forward.z * moveDistance;
    }
    
    // Keep car on ground
    if (playerRef.current) {
      playerRef.current.position.y = 2;
    }
    
    // Third-person camera for car
    if (playerRef.current) {
      const cameraOffset = new THREE.Vector3(0, 5, 10);
      cameraOffset.applyQuaternion(playerRef.current.quaternion);
      
      const targetPosition = playerRef.current.position.clone().add(cameraOffset);
      const lookTarget = playerRef.current.position.clone();
      lookTarget.y += 2;
      
      // Smooth camera follow
      camera.position.lerp(targetPosition, 5 * delta);
      camera.lookAt(lookTarget);
    }
    
    // Keep within world bounds
    if (playerRef.current) {
      const bounds = 240;
      playerRef.current.position.x = Math.max(-bounds, Math.min(bounds, playerRef.current.position.x));
      playerRef.current.position.z = Math.max(-bounds, Math.min(bounds, playerRef.current.position.z));
    }
  };

  return (
    <group>
      {/* INVISIBLE DETECTION MESH */}
      <mesh 
        ref={playerMeshRef} 
        visible={false}
      >
        <capsuleGeometry args={[0.5, 1.8, 8, 16]} />
        <meshStandardMaterial 
          transparent={true}
          opacity={0.0}
        />
      </mesh>
      
      {/* Visible player mesh */}
      <mesh ref={playerRef} visible={mode === 'car'}>
        {mode === 'foot' ? (
          <capsuleGeometry args={[0.5, 1.8, 8, 16]} />
        ) : (
          <>
            <boxGeometry args={[3, 1.2, 6]} />
            <mesh position={[0, 1.0, -0.5]}>
              <boxGeometry args={[2.5, 0.8, 3]} />
              <meshStandardMaterial color={0x2196F3} roughness={0.5} metalness={0.5} />
            </mesh>
            {/* Wheels */}
            {[
              [1.2, -0.6, 2],
              [-1.2, -0.6, 2],
              [1.2, -0.6, -2],
              [-1.2, -0.6, -2]
            ].map((pos, i) => (
              <mesh key={i} position={pos} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.6, 0.6, 0.4, 16]} />
                <meshStandardMaterial color={0x111111} roughness={0.8} metalness={0.2} />
              </mesh>
            ))}
          </>
        )}
        <meshStandardMaterial 
          color={mode === 'foot' ? 0x2196F3 : 0x2196F3} 
          roughness={mode === 'foot' ? 0.8 : 0.5}
          metalness={mode === 'foot' ? 0.2 : 0.5}
        />
      </mesh>
    </group>
  );
});

export default Player;