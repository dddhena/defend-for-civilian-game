import React from 'react';
import * as THREE from 'three';

const Tank = ({ position, rotation = [0, 0, 0], onEnter }) => {
    return (
        <group position={position} rotation={rotation} onClick={onEnter}>
            {/* Tank Chassis */}
            <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
                <boxGeometry args={[3.5, 1.0, 5.5]} />
                <meshStandardMaterial color={0x2e7d32} roughness={0.8} metalness={0.2} />
            </mesh>

            {/* Turret */}
            <mesh position={[0, 1.5, 0.5]} castShadow>
                <boxGeometry args={[2.5, 0.8, 2.8]} />
                <meshStandardMaterial color={0x1b5e20} roughness={0.8} />
            </mesh>

            {/* Barrel */}
            <mesh position={[0, 1.6, 3.2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.25, 3.5, 8]} />
                <meshStandardMaterial color={0x111111} metalness={0.9} />
            </mesh>

            {/* Tracks */}
            <mesh position={[1.8, 0.4, 0]} castShadow>
                <boxGeometry args={[0.8, 0.8, 5.8]} />
                <meshStandardMaterial color={0x111111} roughness={0.9} />
            </mesh>
            <mesh position={[-1.8, 0.4, 0]} castShadow>
                <boxGeometry args={[0.8, 0.8, 5.8]} />
                <meshStandardMaterial color={0x111111} roughness={0.9} />
            </mesh>

            {/* Interaction Label */}
            <mesh position={[0, 3, 0]}>
                <sphereGeometry args={[0.1]} />
                <meshBasicMaterial color="yellow" />
            </mesh>
        </group>
    );
};

export default Tank;
