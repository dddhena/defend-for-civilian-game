import React, { useMemo } from 'react';

const Minimap = ({ playerPos, enemies, hospitalPos, playerRotation }) => {
    const mapSize = 150;
    const worldSize = 500; // Half-width of city (total 1000)

    const mapMarkers = useMemo(() => {
        return enemies.filter(e => e && e.health > 0).map(e => {
            const pos = e.position || (e.mesh ? e.mesh.position : null);
            if (!pos) return null;
            return {
                x: (pos.x / worldSize) * (mapSize / 2) + mapSize / 2,
                y: (pos.z / worldSize) * (mapSize / 2) + mapSize / 2,
                type: 'enemy'
            };
        }).filter(Boolean);
    }, [enemies]);

    const pX = (playerPos.x / worldSize) * (mapSize / 2) + mapSize / 2;
    const pY = (playerPos.z / worldSize) * (mapSize / 2) + mapSize / 2;

    const hX = (hospitalPos.x / worldSize) * (mapSize / 2) + mapSize / 2;
    const hY = (hospitalPos.z / worldSize) * (mapSize / 2) + mapSize / 2;

    return (
        <div className="minimap-container" style={{ width: mapSize, height: mapSize }}>
            <div className="minimap-city">
                {/* Hospital Marker */}
                <div
                    className="map-marker hospital"
                    style={{ left: hX, top: hY }}
                />

                {/* Enemy Markers */}
                {mapMarkers.map((m, i) => (
                    <div
                        key={i}
                        className="map-marker enemy"
                        style={{ left: m.x, top: m.y }}
                    />
                ))}

                {/* Player Marker */}
                <div
                    className="map-marker player"
                    style={{
                        left: pX,
                        top: pY,
                        transform: `translate(-50%, -50%) rotate(${playerRotation}rad)`
                    }}
                >
                    <div className="player-arrow" />
                </div>
            </div>
        </div>
    );
};

export default Minimap;
