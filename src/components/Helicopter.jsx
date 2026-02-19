import React from 'react';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

const Helicopter = ({ position, rotation = [0, 0, 0], onEnter }) => {
    const rotorRef = useRef();

    useFrame((state, delta) => {
        if (rotorRef.current) {
            rotorRef.current.rotation.y += delta * 15;
        }
    });

    return (
        <group position={position} rotation={rotation} onClick={onEnter}>
            {/* Heli Body */}
            <mesh position={[0, 0, 0]} castShadow>
                <boxGeometry args={[1.5, 1.2, 4]} />
                <meshStandardMaterial color={0x000000} roughness={0.5} metalness={0.8} />
            </mesh>

            {/* Cockpit */}
            <mesh position={[0, 0.2, 1.5]} castShadow>
                <boxGeometry args={[1.3, 0.8, 1.2]} />
                <meshStandardMaterial color={0x33ccff} transparent opacity={0.6} />
            </mesh>

            {/* Tail Boom */}
            <mesh position={[0, 0.2, -3]} castShadow>
                <boxGeometry args={[0.3, 0.3, 3]} />
                <meshStandardMaterial color={0x000000} />
            </mesh>

            {/* Main Rotor */}
            <group position={[0, 0.8, 0]}>
                <mesh ref={rotorRef}>
                    <boxGeometry args={[6, 0.05, 0.2]} />
                    <meshStandardMaterial color={0x111111} />
                </mesh>
                <mesh position={[0, -0.2, 0]}>
                    <cylinderGeometry args={[0.1, 0.1, 0.4, 8]} />
                    <meshStandardMaterial color={0x333333} />
                </mesh>
            </group>

            {/* Interaction Label */}
            <mesh position={[0, 3, 0]}>
                <sphereGeometry args={[0.1]} />
                <meshBasicMaterial color="lime" />
            </mesh>
        </group>
    );
};

export default Helicopter;
