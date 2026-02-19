export const residentialZones = [
    // North East residential zone
    { x: 150, z: 150, width: 100, height: 100 },
    // North West residential zone
    { x: -150, z: 150, width: 100, height: 100 },
    // South East residential zone
    { x: 150, z: -150, width: 100, height: 100 },
    // South West residential zone
    { x: -150, z: -150, width: 100, height: 100 }
];

export const generateHouseData = () => {
    const data = [];
    residentialZones.forEach((zone, zoneIndex) => {
        // More houses
        for (let i = 0; i < 16; i++) {
            // Use a pseudo-random based on index to keep it deterministic-ish if called multiple times?
            // For now, random is fine as long as we call it once and share the result, 
            // OR we just accept layout might slightly differ if we re-generate.
            // Ideally we should call this once.
            const width = 10 + Math.random() * 6;
            const height = 8 + Math.random() * 8;
            const depth = 10 + Math.random() * 6;
            const x = zone.x - zone.width / 2 + 15 + (i % 4) * 25;
            const z = zone.z - zone.height / 2 + 15 + Math.floor(i / 4) * 25;
            data.push({
                width,
                height,
                depth,
                x,
                y: height / 2,
                z,
                zone: zoneIndex,
                textureKey: zoneIndex % 3 === 0 ? 'residential1' : zoneIndex % 3 === 1 ? 'residential2' : 'residential3',
                color: zoneIndex % 3 === 0 ? 0x8B4513 : zoneIndex % 3 === 1 ? 0xA0522D : 0xD2691E
            });
        }
    });
    return data;
};

export const apartmentData = [
    { x: 170, z: 170, height: 60, width: 25, depth: 25, zone: 0 },
    { x: -170, z: 170, height: 60, width: 25, depth: 25, zone: 1 },
    { x: 170, z: -170, height: 60, width: 25, depth: 25, zone: 2 },
    { x: -170, z: -170, height: 60, width: 25, depth: 25, zone: 3 }
];

export const generateParkData = () => {
    const data = [];
    // Place parks in specific commercial slots
    [6, 8, 16, 18].forEach(i => {
        const x = -80 + (i % 5) * 50;
        const z = -80 + Math.floor(i / 5) * 50;
        data.push({ x, y: 0.1, z, width: 40, depth: 40 }); // Added width/depth for collision
    });
    return data;
};

export const generateBuildingData = () => {
    const data = [];
    // Commercial district near city center
    for (let i = 0; i < 20; i++) {
        // Skip indices reserved for parks
        if ([6, 8, 16, 18].includes(i)) continue;

        const width = 20 + Math.random() * 15;
        const height = 40 + Math.random() * 40;
        const depth = 20 + Math.random() * 15;
        const x = -80 + (i % 5) * 50;
        const z = -80 + Math.floor(i / 5) * 50;

        // Ensure buildings don't overlap with roads (Basic check logic replicated)
        const isOnRoad = (
            (Math.abs(x + 100) < 15) || (Math.abs(x - 0) < 15) || (Math.abs(x - 100) < 15) ||
            (Math.abs(z + 100) < 15) || (Math.abs(z - 0) < 15) || (Math.abs(z - 100) < 15)
        );
        const isInResidential = residentialZones.some(zone =>
            Math.abs(x - zone.x) < zone.width / 2 && Math.abs(z - zone.z) < zone.height / 2
        );

        if (!isOnRoad && !isInResidential) {
            data.push({
                width,
                height,
                depth,
                x,
                y: height / 2,
                z,
                textureKey: 'commercial',
                windows: Math.min(30, Math.floor(width / 4) * Math.floor(height / 8))
            });
        }
    }
    return data;
};

export const riverData = [
    { x: 60, z: 0, width: 40, height: 500, rotation: 0 }, // East river
    { x: -60, z: 0, width: 40, height: 500, rotation: 0 }, // West river
    { x: 0, z: 60, width: 500, height: 40, rotation: Math.PI / 2 }, // North river
    { x: 0, z: -60, width: 500, height: 40, rotation: Math.PI / 2 }  // South river
];

export const bridgeData = [
    { x: 60, z: -100, rotation: Math.PI / 2 },
    { x: 60, z: 0, rotation: Math.PI / 2 },
    { x: 60, z: 100, rotation: Math.PI / 2 },
    { x: -60, z: -100, rotation: Math.PI / 2 },
    { x: -60, z: 0, rotation: Math.PI / 2 },
    { x: -60, z: 100, rotation: Math.PI / 2 },
    { x: -100, z: 60, rotation: 0 },
    { x: 0, z: 60, rotation: 0 },
    { x: 100, z: 60, rotation: 0 },
    { x: -100, z: -60, rotation: 0 },
    { x: 0, z: -60, rotation: 0 },
    { x: 100, z: -60, rotation: 0 }
];
