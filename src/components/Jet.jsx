import React from 'react';
import * as THREE from 'three';

const Jet = ({ position, rotation = [0, 0, 0], onEnter }) => {
    return (
        <group position={position} rotation={rotation} onClick={onEnter}>
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

            {/* Interaction Label */}
            <mesh position={[0, 3, 0]}>
                <sphereGeometry args={[0.1]} />
                <meshBasicMaterial color="cyan" />
            </mesh>
        </group>
    );
};

export default Jet;
