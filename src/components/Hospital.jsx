import React from 'react';
import { Sphere } from '@react-three/drei';

const Hospital = ({ position }) => {
    return (
        <group position={position}>
            {/* Main Building Body */}
            <mesh position={[0, 10, 0]} castShadow receiveShadow>
                <boxGeometry args={[40, 20, 30]} />
                <meshStandardMaterial color="#f0f0f0" />
            </mesh>

            {/* Roof Detail */}
            <mesh position={[0, 20.5, 0]}>
                <boxGeometry args={[42, 1, 32]} />
                <meshStandardMaterial color="#333" />
            </mesh>

            {/* Hospital Sign (Red Cross) */}
            <group position={[0, 25, 0]}>
                <mesh rotation={[0, 0, 0]}>
                    <boxGeometry args={[2, 10, 2]} />
                    <meshStandardMaterial color="red" emissive="red" emissiveIntensity={2} />
                </mesh>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                    <boxGeometry args={[2, 10, 2]} />
                    <meshStandardMaterial color="red" emissive="red" emissiveIntensity={2} />
                </mesh>
            </group>

            {/* Entrance Area */}
            <mesh position={[0, 2, 15.5]}>
                <boxGeometry args={[10, 4, 1]} />
                <meshStandardMaterial color="#222" />
            </mesh>

            {/* Healing Zone Visualizer */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
                <ringGeometry args={[15, 16, 64]} />
                <meshBasicMaterial color="#00ff88" transparent opacity={0.5} side={2} />
            </mesh>

            {/* Soft Green Glow */}
            <Sphere args={[20, 16, 16]} position={[0, 5, 0]}>
                <meshBasicMaterial color="#00ff88" transparent opacity={0.05} wireframe />
            </Sphere>
        </group>
    );
};

export default Hospital;
