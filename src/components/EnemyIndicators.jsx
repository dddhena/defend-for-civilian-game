import React, { useMemo } from 'react';
import * as THREE from 'three';

const EnemyIndicators = ({ playerPos, playerRotation, enemies, camera }) => {
    const indicators = useMemo(() => {
        if (!camera || !enemies) return [];

        // Get camera forward vector
        const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        cameraDirection.y = 0;
        cameraDirection.normalize();

        return enemies
            .filter(enemy => enemy && enemy.health > 0 && enemy.position)
            .map((enemy, index) => {
                const enemyPos = enemy.position;
                const toEnemy = new THREE.Vector3().subVectors(enemyPos, playerPos);
                const distance = toEnemy.length();

                // Skip very close enemies (minimap handles these well)
                if (distance < 5) return null;

                toEnemy.y = 0;
                toEnemy.normalize();

                // Calculate angle between camera forward and enemy direction
                // In 2D screen space, we want the angle relative to the look direction
                const angle = Math.atan2(toEnemy.x, toEnemy.z) - Math.atan2(cameraDirection.x, cameraDirection.z);

                // Calculate screen edge position
                // We'll use a fixed radius for the indicators
                const radius = 40; // Percentage of screen half-size

                return {
                    id: index,
                    angle: angle,
                    distance: distance
                };
            })
            .filter(Boolean)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 1);
    }, [playerPos, enemies, camera]);

    return (
        <div className="enemy-indicators-container">
            {indicators.map((indicator) => (
                <div
                    key={indicator.id}
                    className="enemy-indicator"
                    style={{
                        transform: `translate(-50%, -50%) rotate(${indicator.angle}rad) translateY(-200px)`
                    }}
                >
                    <div className="enemy-indicator-arrow" />
                    <div className="enemy-indicator-distance">
                        {Math.round(indicator.distance)}m
                    </div>
                </div>
            ))}
        </div>
    );
};

export default EnemyIndicators;
