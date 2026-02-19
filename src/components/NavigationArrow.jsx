import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const NavigationArrow = ({ playerPos, enemies, playerMode }) => {
    const meshRef = useRef();
    const materialRef = useRef();

    const nearestEnemy = useMemo(() => {
        if (!enemies || enemies.length === 0) return null;

        return enemies
            .filter(e => e && e.health > 0 && e.position)
            .sort((a, b) => {
                const distA = a.position.distanceTo(playerPos);
                const distB = b.position.distanceTo(playerPos);
                return distA - distB;
            })[0];
    }, [enemies, playerPos]);

    // Create a custom extruded arrow shape for a "premium" look
    const arrowGeometry = useMemo(() => {
        const shape = new THREE.Shape();
        const shaftWidth = 0.2; // Half-width
        const headWidth = 0.5;  // Half-width
        const totalLength = 3.5;
        const headLength = 1.2;
        const shaftLength = totalLength - headLength;

        // Draw arrow shape centered on X, pointing towards negative Y (which we'll rotate to -Z)
        shape.moveTo(-shaftWidth, 0);
        shape.lineTo(shaftWidth, 0);
        shape.lineTo(shaftWidth, -shaftLength);
        shape.lineTo(headWidth, -shaftLength);
        shape.lineTo(0, -totalLength);
        shape.lineTo(-headWidth, -shaftLength);
        shape.lineTo(-shaftWidth, -shaftLength);
        shape.lineTo(-shaftWidth, 0);

        const extrudeSettings = {
            steps: 2,
            depth: 0.3,
            bevelEnabled: true,
            bevelThickness: 0.1,
            bevelSize: 0.1,
            bevelOffset: 0,
            bevelSegments: 3
        };

        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }, []);

    useFrame((state) => {
        if (!meshRef.current || !materialRef.current) return;

        if (!nearestEnemy) {
            meshRef.current.visible = false;
            return;
        }

        meshRef.current.visible = true;

        // Position at feet (just above ground)
        meshRef.current.position.set(playerPos.x, playerPos.y + 0.1, playerPos.z);

        // Point at enemy position but keep it on the ground plane
        const enemyPos = nearestEnemy.position.clone();
        enemyPos.y = playerPos.y + 0.1;
        meshRef.current.lookAt(enemyPos);

        // Adjust rotation: ExtrudeGeometry is in XY plane, lookAt alignes -Z
        // Our shape points towards -Y, so we rotate it to face -Z
        meshRef.current.rotateX(Math.PI / 2);

        // Pulse effect
        const pulse = Math.sin(state.clock.elapsedTime * 4) * 0.5 + 0.5;
        materialRef.current.emissiveIntensity = 2 + pulse * 3;
        meshRef.current.scale.set(1 + pulse * 0.05, 1, 1 + pulse * 0.05);
    });

    return (
        <mesh ref={meshRef} geometry={arrowGeometry}>
            <meshStandardMaterial
                ref={materialRef}
                color="#ff0000"
                emissive="#ff0000"
                emissiveIntensity={2}
                transparent
                opacity={0.9}
                metalness={0.8}
                roughness={0.2}
            />
        </mesh>
    );
};

export default NavigationArrow;
