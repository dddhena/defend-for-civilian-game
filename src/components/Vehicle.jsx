import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Vehicle = ({ index, type = 'civilian' }) => {
  const vehicleRef = useRef();
  const [speed, setSpeed] = useState(0);
  const [targetPosition, setTargetPosition] = useState(new THREE.Vector3());
  const [direction, setDirection] = useState(new THREE.Vector3());

  const colors = {
    civilian: [0xC62828, 0xAD1457, 0x6A1B9A, 0x283593, 0x0277BD],
    ai: [0xE53935, 0x8E24AA, 0x1E88E5, 0x43A047, 0xFB8C00],
    police: [0x2196F3]
  };

  const vehicleColor = type === 'police'
    ? colors.police[0]
    : colors[type][Math.floor(Math.random() * colors[type].length)];

  useEffect(() => {
    if (!vehicleRef.current) return;

    // Set initial position based on type
    let x, z, rotation;

    if (type === 'civilian') {
      const roadX = [-100, 0, 100];
      const roadZ = [-100, 0, 100];

      if (Math.random() > 0.5) {
        x = roadX[Math.floor(Math.random() * roadX.length)];
        z = Math.random() * 400 - 200;
      } else {
        x = Math.random() * 400 - 200;
        z = roadZ[Math.floor(Math.random() * roadZ.length)];
      }

      rotation = Math.random() * Math.PI * 2;
      setSpeed(5 + Math.random() * 10);

    } else if (type === 'ai') {
      const roadSegments = [
        { x: -100, z: -200, dir: 0 },
        { x: -100, z: 200, dir: Math.PI },
        { x: 0, z: -200, dir: 0 },
        { x: 0, z: 200, dir: Math.PI },
        { x: 100, z: -200, dir: 0 },
        { x: 100, z: 200, dir: Math.PI },
      ];

      const segment = roadSegments[Math.floor(Math.random() * roadSegments.length)];
      const distance = Math.random() * 400 - 200;

      if (segment.dir === 0 || segment.dir === Math.PI) {
        x = segment.x;
        z = distance;
      } else {
        x = distance;
        z = segment.z;
      }

      rotation = segment.dir;
      setSpeed(15 + Math.random() * 15);

    } else if (type === 'police') {
      x = 50;
      z = 50;
      rotation = Math.PI / 4;
      setSpeed(0);
    }

    vehicleRef.current.position.set(x, 1, z);
    vehicleRef.current.rotation.y = rotation;

    // Set initial direction
    const dir = new THREE.Vector3(Math.sin(rotation), 0, Math.cos(rotation));
    setDirection(dir);

    // Set target position (for civilian wandering)
    if (type === 'civilian') {
      setTargetPosition(new THREE.Vector3(
        x + dir.x * 100,
        1,
        z + dir.z * 100
      ));
    }
  }, [type, index]);

  useFrame((state, delta) => {
    if (!vehicleRef.current) return;

    switch (type) {
      case 'civilian':
        // Wander along roads
        const toTarget = new THREE.Vector3();
        toTarget.subVectors(targetPosition, vehicleRef.current.position);

        if (toTarget.length() < 10) {
          // Choose new direction
          const newRotation = Math.random() * Math.PI * 2;
          const newDir = new THREE.Vector3(Math.sin(newRotation), 0, Math.cos(newRotation));
          setDirection(newDir);

          setTargetPosition(new THREE.Vector3(
            vehicleRef.current.position.x + newDir.x * 100,
            1,
            vehicleRef.current.position.z + newDir.z * 100
          ));
        } else {
          toTarget.normalize();
          vehicleRef.current.position.add(toTarget.multiplyScalar(speed * delta));

          // Look in direction of movement
          vehicleRef.current.lookAt(
            vehicleRef.current.position.clone().add(toTarget)
          );
        }
        break;

      case 'ai':
        // Follow road
        vehicleRef.current.position.add(direction.clone().multiplyScalar(speed * delta));

        // Keep on road and wrap around
        if (Math.abs(vehicleRef.current.position.x) > 220) {
          vehicleRef.current.position.x = -vehicleRef.current.position.x;
        }
        if (Math.abs(vehicleRef.current.position.z) > 220) {
          vehicleRef.current.position.z = -vehicleRef.current.position.z;
        }
        break;

      case 'police':
        // Police car controlled by player (handled elsewhere)
        // Just update position based on speed
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(vehicleRef.current.quaternion);

        vehicleRef.current.position.add(forward.multiplyScalar(speed * delta));
        break;
    }

    // Keep vehicle on ground
    vehicleRef.current.position.y = 1;
  });

  return (
    <group ref={vehicleRef}>
      {/* Main Chassis */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.5, 4.5]} />
        <meshStandardMaterial color={vehicleColor} roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Cabin */}
      <mesh position={[0, 1.3, -0.2]} castShadow>
        <boxGeometry args={[1.8, 0.9, 2.5]} />
        <meshStandardMaterial color={0x111111} roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Hood scoop/Vent */}
      <mesh position={[0, 0.9, 1.5]} castShadow>
        <boxGeometry args={[1.2, 0.2, 1.0]} />
        <meshStandardMaterial color={0x000000} roughness={0.5} />
      </mesh>

      {/* Front Bumper */}
      <mesh position={[0, 0.5, 2.3]} castShadow>
        <boxGeometry args={[2.3, 0.4, 0.4]} />
        <meshStandardMaterial color={0x111111} roughness={0.5} />
      </mesh>

      {/* Rear Bumper/Spoiler base */}
      <mesh position={[0, 0.7, -2.3]} castShadow>
        <boxGeometry args={[2.3, 0.4, 0.4]} />
        <meshStandardMaterial color={0x111111} roughness={0.5} />
      </mesh>

      {/* Headlights */}
      <mesh position={[0.7, 0.7, 2.26]}>
        <boxGeometry args={[0.5, 0.2, 0.1]} />
        <meshStandardMaterial color={0xFFFFCC} emissive={0xFFFFCC} emissiveIntensity={2} />
      </mesh>
      <mesh position={[-0.7, 0.7, 2.26]}>
        <boxGeometry args={[0.5, 0.2, 0.1]} />
        <meshStandardMaterial color={0xFFFFCC} emissive={0xFFFFCC} emissiveIntensity={2} />
      </mesh>

      {/* Taillights */}
      <mesh position={[0.7, 0.7, -2.26]}>
        <boxGeometry args={[0.5, 0.2, 0.1]} />
        <meshStandardMaterial color={0xFF0000} emissive={0xFF0000} emissiveIntensity={2} />
      </mesh>
      <mesh position={[-0.7, 0.7, -2.26]}>
        <boxGeometry args={[0.5, 0.2, 0.1]} />
        <meshStandardMaterial color={0xFF0000} emissive={0xFF0000} emissiveIntensity={2} />
      </mesh>

      {/* Police Siren (Only for police type) */}
      {type === 'police' && (
        <>
          <mesh position={[0.5, 1.8, -0.2]}>
            <boxGeometry args={[0.6, 0.15, 0.15]} />
            <meshStandardMaterial color={0xFF0000} emissive={0xFF0000} emissiveIntensity={1} />
          </mesh>
          <mesh position={[-0.5, 1.8, -0.2]}>
            <boxGeometry args={[0.6, 0.15, 0.15]} />
            <meshStandardMaterial color={0x0000FF} emissive={0x0000FF} emissiveIntensity={1} />
          </mesh>
          <mesh position={[0, 1.75, -0.2]}>
            <boxGeometry args={[1.7, 0.05, 0.1]} />
            <meshStandardMaterial color={0x333333} />
          </mesh>
        </>
      )}

      {/* Wheels */}
      {[
        [1.2, 0.4, 1.5],
        [-1.2, 0.4, 1.5],
        [1.2, 0.4, -1.5],
        [-1.2, 0.4, -1.5]
      ].map((pos, i) => (
        <group key={i} position={pos}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.45, 0.45, 0.5, 16]} />
            <meshStandardMaterial color={0x111111} roughness={0.9} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.25, 0.25, 0.52, 8]} />
            <meshStandardMaterial color={0x888888} metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export default Vehicle;