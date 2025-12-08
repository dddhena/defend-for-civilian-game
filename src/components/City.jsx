import React, { useMemo } from 'react';
import * as THREE from 'three';

const City = React.memo(() => {
  // Create geometries only once
  const geometries = useMemo(() => ({
    ground: new THREE.PlaneGeometry(500, 500, 100, 100),
    building: new THREE.BoxGeometry(20, 40, 20),
    house: new THREE.BoxGeometry(10, 10, 10),
    apartment: new THREE.BoxGeometry(25, 60, 25),
    roof: new THREE.ConeGeometry(7, 5, 4),
    chimney: new THREE.CylinderGeometry(2, 2, 30, 8),
    treeTrunk: new THREE.CylinderGeometry(0.5, 0.7, 5, 8),
    treeFoliage: new THREE.ConeGeometry(4, 8, 8),
    road: new THREE.PlaneGeometry(20, 500),
    lamppost: new THREE.CylinderGeometry(0.3, 0.5, 15, 8),
    lamp: new THREE.SphereGeometry(1, 8, 8),
    sidewalk: new THREE.PlaneGeometry(5, 500),
    bench: new THREE.BoxGeometry(3, 0.5, 1),
    benchLeg: new THREE.BoxGeometry(0.1, 1, 0.1),
    trafficLight: new THREE.BoxGeometry(0.5, 6, 0.5),
    trafficLightBox: new THREE.BoxGeometry(1.2, 3, 0.8),
    trashCan: new THREE.CylinderGeometry(0.8, 0.6, 1.5, 8),
    busStop: new THREE.BoxGeometry(4, 3, 1.5),
    busStopRoof: new THREE.BoxGeometry(5, 0.3, 2),
    fountainBase: new THREE.CylinderGeometry(3, 3, 0.5, 16),
    fountainMiddle: new THREE.CylinderGeometry(2, 2, 0.5, 16),
    fountainTop: new THREE.CylinderGeometry(1, 1, 0.5, 16),
    car: new THREE.BoxGeometry(2.5, 0.8, 4.5),
    carTop: new THREE.BoxGeometry(2, 0.6, 2),
    wheel: new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16),
    streetSign: new THREE.BoxGeometry(0.1, 2, 0.8),
    streetSignPost: new THREE.CylinderGeometry(0.1, 0.1, 3, 8),
    flower: new THREE.SphereGeometry(0.3, 8, 8),
    flowerStem: new THREE.CylinderGeometry(0.05, 0.05, 1, 8),
    park: new THREE.PlaneGeometry(40, 40),
    parkPath: new THREE.PlaneGeometry(3, 40),
    statueBase: new THREE.CylinderGeometry(1.5, 1.5, 0.5, 8),
    statueBody: new THREE.BoxGeometry(0.8, 2, 0.8),
    statueHead: new THREE.SphereGeometry(0.4, 8, 8),
    billboard: new THREE.BoxGeometry(8, 4, 0.2),
    billboardPost: new THREE.CylinderGeometry(0.3, 0.3, 6, 8),
    water: new THREE.PlaneGeometry(100, 100),
    bridge: new THREE.BoxGeometry(25, 3, 15),
    bridgePillar: new THREE.CylinderGeometry(2, 2, 15, 8),
    bridgeRail: new THREE.CylinderGeometry(0.2, 0.2, 25, 8),
    roadMarking: new THREE.PlaneGeometry(1, 10),
    window: new THREE.BoxGeometry(1.5, 2, 0.1),
    door: new THREE.BoxGeometry(2, 4, 0.2),
    apartmentWindow: new THREE.BoxGeometry(4, 3, 0.1),
    apartmentDoor: new THREE.BoxGeometry(3, 5, 0.2),
    apartmentBalcony: new THREE.BoxGeometry(8, 1, 3),
    apartmentBalconyRail: new THREE.CylinderGeometry(0.1, 0.1, 8, 8),
    apartmentRoof: new THREE.ConeGeometry(15, 10, 4),
    // Henok's house geometries
    henokHouseBase: new THREE.BoxGeometry(15, 8, 15),
    henokHouseRoof: new THREE.ConeGeometry(9, 6, 4),
    henokTower: new THREE.CylinderGeometry(4, 4, 20, 8),
    henokTowerRoof: new THREE.ConeGeometry(5, 8, 8),
    henokGate: new THREE.BoxGeometry(4, 6, 0.3),
    henokGateArch: new THREE.TorusGeometry(3, 0.5, 8, 16, Math.PI),
    henokWindow: new THREE.BoxGeometry(2.5, 3, 0.1),
    henokStairs: new THREE.BoxGeometry(8, 0.5, 2),
    henokColumn: new THREE.CylinderGeometry(0.8, 0.8, 10, 8),
    henokFence: new THREE.BoxGeometry(0.1, 2, 20),
    henokFencePost: new THREE.CylinderGeometry(0.2, 0.2, 2.5, 8),
    henokGarden: new THREE.BoxGeometry(25, 0.5, 25),
    henokPool: new THREE.BoxGeometry(8, 1, 12),
    henokPoolWater: new THREE.BoxGeometry(7.8, 0.8, 11.8),
    river: new THREE.PlaneGeometry(40, 500),
    riverBank: new THREE.PlaneGeometry(44, 504),
    tunnel: new THREE.CylinderGeometry(10, 10, 30, 8, 1, true)
  }), []);

  // Generate proper urban layout - houses in residential zones, roads only connect properly
  const residentialZones = useMemo(() => {
    return [
      // North East residential zone
      { x: 150, z: 150, width: 100, height: 100 },
      // North West residential zone
      { x: -150, z: 150, width: 100, height: 100 },
      // South East residential zone
      { x: 150, z: -150, width: 100, height: 100 },
      // South West residential zone
      { x: -150, z: -150, width: 100, height: 100 }
    ];
  }, []);

  // Generate house positions in residential zones (not on roads)
  const houseData = useMemo(() => {
    const data = [];
    residentialZones.forEach((zone, zoneIndex) => {
      for (let i = 0; i < 12; i++) {
        const width = 10 + Math.random() * 6;
        const height = 8 + Math.random() * 8;
        const depth = 10 + Math.random() * 6;
        const x = zone.x - zone.width/2 + 15 + (i % 4) * 25;
        const z = zone.z - zone.height/2 + 15 + Math.floor(i/4) * 25;
        data.push({ 
          width, 
          height, 
          depth, 
          x, 
          y: height / 2, 
          z,
          zone: zoneIndex,
          color: zoneIndex % 3 === 0 ? 0x8B4513 : zoneIndex % 3 === 1 ? 0xA0522D : 0xD2691E
        });
      }
    });
    return data;
  }, [residentialZones]);

  // Generate apartment buildings (one in each zone)
  const apartmentData = useMemo(() => {
    return [
      { x: 170, z: 170, height: 60, width: 25, depth: 25, zone: 0 },
      { x: -170, z: 170, height: 60, width: 25, depth: 25, zone: 1 },
      { x: 170, z: -170, height: 60, width: 25, depth: 25, zone: 2 },
      { x: -170, z: -170, height: 60, width: 25, depth: 25, zone: 3 }
    ];
  }, []);

  // Generate commercial buildings along main roads (not in residential zones)
  const buildingData = useMemo(() => {
    const data = [];
    // Commercial district near city center
    for (let i = 0; i < 16; i++) {
      const width = 20 + Math.random() * 15;
      const height = 40 + Math.random() * 40;
      const depth = 20 + Math.random() * 15;
      const x = -80 + (i % 4) * 60;
      const z = -80 + Math.floor(i/4) * 60;
      // Ensure buildings don't overlap with roads
      const isOnRoad = (
        (Math.abs(x + 100) < 15) || (Math.abs(x - 0) < 15) || (Math.abs(x - 100) < 15) ||
        (Math.abs(z + 100) < 15) || (Math.abs(z - 0) < 15) || (Math.abs(z - 100) < 15)
      );
      const isInResidential = residentialZones.some(zone => 
        Math.abs(x - zone.x) < zone.width/2 && Math.abs(z - zone.z) < zone.height/2
      );
      if (!isOnRoad && !isInResidential) {
        data.push({ 
          width, 
          height, 
          depth, 
          x, 
          y: height / 2, 
          z,
          windows: Math.min(30, Math.floor(width / 4) * Math.floor(height / 8))
        });
      }
    }
    return data;
  }, [residentialZones]);

  // Generate river that divides the city
  const riverData = useMemo(() => {
    return [
      { x: 60, z: 0, width: 40, height: 500, rotation: 0 }, // East river
      { x: -60, z: 0, width: 40, height: 500, rotation: 0 }, // West river
      { x: 0, z: 60, width: 500, height: 40, rotation: Math.PI/2 }, // North river
      { x: 0, z: -60, width: 500, height: 40, rotation: Math.PI/2 }  // South river
    ];
  }, []);

  // Generate bridges over rivers
  const bridgeData = useMemo(() => {
    return [
      { x: 60, z: -100, rotation: Math.PI/2 }, // Bridge over east river at north-south road
      { x: 60, z: 0, rotation: Math.PI/2 },
      { x: 60, z: 100, rotation: Math.PI/2 },
      { x: -60, z: -100, rotation: Math.PI/2 }, // Bridge over west river
      { x: -60, z: 0, rotation: Math.PI/2 },
      { x: -60, z: 100, rotation: Math.PI/2 },
      { x: -100, z: 60, rotation: 0 }, // Bridge over north river
      { x: 0, z: 60, rotation: 0 },
      { x: 100, z: 60, rotation: 0 },
      { x: -100, z: -60, rotation: 0 }, // Bridge over south river
      { x: 0, z: -60, rotation: 0 },
      { x: 100, z: -60, rotation: 0 }
    ];
  }, []);

  // Generate trees in parks and residential areas only
  const treeData = useMemo(() => {
    const data = [];
    // Trees in residential zones
    residentialZones.forEach((zone) => {
      for (let i = 0; i < 15; i++) {
        const x = zone.x - zone.width/2 + 5 + Math.random() * (zone.width - 10);
        const z = zone.z - zone.height/2 + 5 + Math.random() * (zone.height - 10);
        data.push({ x, y: 0, z, scale: 0.8 + Math.random() * 0.4 });
      }
    });
    
    // Trees along river banks
    for (let i = 0; i < 20; i++) {
      data.push({ x: 85, y: 0, z: -240 + i * 24, scale: 0.7 + Math.random() * 0.3 });
      data.push({ x: -85, y: 0, z: -240 + i * 24, scale: 0.7 + Math.random() * 0.3 });
      data.push({ x: -240 + i * 24, y: 0, z: 85, scale: 0.7 + Math.random() * 0.3 });
      data.push({ x: -240 + i * 24, y: 0, z: -85, scale: 0.7 + Math.random() * 0.3 });
    }
    return data;
  }, [residentialZones]);

  // Generate lampposts along roads only
  const lamppostData = useMemo(() => {
    const data = [];
    for (let i = -200; i <= 200; i += 50) {
      // Main roads
      data.push({ x: -100, y: 0, z: i });
      data.push({ x: 0, y: 0, z: i });
      data.push({ x: 100, y: 0, z: i });
      data.push({ x: i, y: 0, z: -100 });
      data.push({ x: i, y: 0, z: 0 });
      data.push({ x: i, y: 0, z: 100 });
    }
    return data;
  }, []);

  // Generate parked cars only along roads
  const carData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 40; i++) {
      const road = Math.floor(Math.random() * 6);
      let x, z, rotation;
      
      switch(road) {
        case 0: // Road at x = -100
          x = -100;
          z = -200 + Math.random() * 400;
          rotation = Math.PI / 2;
          // Ensure not on bridge
          if (Math.abs(z - 60) < 15 || Math.abs(z + 60) < 15) continue;
          break;
        case 1: // Road at x = 0
          x = 0;
          z = -200 + Math.random() * 400;
          rotation = Math.PI / 2;
          if (Math.abs(z - 60) < 15 || Math.abs(z + 60) < 15) continue;
          break;
        case 2: // Road at x = 100
          x = 100;
          z = -200 + Math.random() * 400;
          rotation = Math.PI / 2;
          if (Math.abs(z - 60) < 15 || Math.abs(z + 60) < 15) continue;
          break;
        case 3: // Road at z = -100
          x = -200 + Math.random() * 400;
          z = -100;
          rotation = 0;
          if (Math.abs(x - 60) < 15 || Math.abs(x + 60) < 15) continue;
          break;
        case 4: // Road at z = 0
          x = -200 + Math.random() * 400;
          z = 0;
          rotation = 0;
          if (Math.abs(x - 60) < 15 || Math.abs(x + 60) < 15) continue;
          break;
        case 5: // Road at z = 100
          x = -200 + Math.random() * 400;
          z = 100;
          rotation = 0;
          if (Math.abs(x - 60) < 15 || Math.abs(x + 60) < 15) continue;
          break;
      }
      
      const colors = [0xFF0000, 0x0000FF, 0x00FF00, 0xFFFF00, 0xFFA500, 0xFFFFFF, 0x000000];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      data.push({ x, y: 0.5, z, rotation, color });
    }
    return data;
  }, []);

  // Henok's Royal House - Special unique house
  const HenoksHouse = () => (
    <group position={[0, 0, 0]}>
      {/* Elevated platform for the royal house */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[30, 0.5, 30]} />
        <meshStandardMaterial color={0x888888} roughness={0.9} metalness={0.1} />
      </mesh>
      
      {/* Main house */}
      <mesh position={[0, 4.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[15, 8, 15]} />
        <meshStandardMaterial color={0xD4AF37} roughness={0.6} metalness={0.4} />
      </mesh>
      
      {/* Main roof */}
      <mesh position={[0, 12.5, 0]} castShadow>
        <coneGeometry args={[9, 6, 4]} />
        <meshStandardMaterial color={0x8B0000} roughness={0.8} metalness={0.2} />
      </mesh>
      
      {/* Royal tower */}
      <mesh position={[8, 10, 8]} castShadow receiveShadow>
        <cylinderGeometry args={[4, 4, 20, 8]} />
        <meshStandardMaterial color={0xD4AF37} roughness={0.6} metalness={0.4} />
      </mesh>
      
      {/* Tower roof */}
      <mesh position={[8, 20, 8]} castShadow>
        <coneGeometry args={[5, 8, 8]} />
        <meshStandardMaterial color={0x8B0000} roughness={0.8} metalness={0.2} />
      </mesh>
      
      {/* Columns at entrance */}
      {[-5, 5].map((offset) => (
        <mesh key={`column-${offset}`} position={[offset, 5, 7.5]} castShadow>
          <cylinderGeometry args={[0.8, 0.8, 10, 8]} />
          <meshStandardMaterial color={0xCCCCCC} roughness={0.5} metalness={0.5} />
        </mesh>
      ))}
      
      {/* Main entrance gate */}
      <mesh position={[0, 3, 7.6]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[4, 6, 0.3]} />
        <meshStandardMaterial color={0x8B4513} roughness={0.9} metalness={0.1} />
      </mesh>
      
      {/* Gate arch */}
      <mesh position={[0, 6.5, 7.5]} rotation={[Math.PI/2, 0, 0]} castShadow>
        <torusGeometry args={[3, 0.5, 8, 16, Math.PI]} />
        <meshStandardMaterial color={0xD4AF37} roughness={0.6} metalness={0.4} />
      </mesh>
      
      {/* Stairs to entrance */}
      {[0, -0.6, -1.2].map((y, i) => (
        <mesh key={`stair-${i}`} position={[0, y, 4]} castShadow receiveShadow>
          <boxGeometry args={[8, 0.5, 2 + i * 0.5]} />
          <meshStandardMaterial color={0x888888} roughness={0.9} metalness={0.1} />
        </mesh>
      ))}
      
      {/* Large windows */}
      {[
        [5, 4, 7.5], [-5, 4, 7.5],
        [7.5, 4, 0], [-7.5, 4, 0],
        [0, 4, -7.5]
      ].map((pos, i) => (
        <mesh key={`window-${i}`} position={pos} castShadow>
          <boxGeometry args={[2.5, 3, 0.1]} />
          <meshStandardMaterial color={0x87CEEB} transparent opacity={0.3} roughness={0.2} metalness={0.8} />
        </mesh>
      ))}
      
      {/* Fence around property */}
      {[
        [0, 1, 15], [0, 1, -15],
        [15, 1, 0], [-15, 1, 0]
      ].map((pos, i) => (
        <React.Fragment key={`fence-${i}`}>
          <mesh position={pos} rotation={i < 2 ? [0, Math.PI/2, 0] : [0, 0, 0]} castShadow>
            <boxGeometry args={[0.1, 2, 30]} />
            <meshStandardMaterial color={0x8B4513} roughness={0.9} metalness={0.1} />
          </mesh>
          {/* Fence posts */}
          {[-14, -7, 0, 7, 14].map((offset) => (
            <mesh 
              key={`post-${i}-${offset}`} 
              position={[
                i < 2 ? offset : pos[0],
                1.25,
                i < 2 ? pos[2] : offset
              ]} 
              castShadow
            >
              <cylinderGeometry args={[0.2, 0.2, 2.5, 8]} />
              <meshStandardMaterial color={0x8B4513} roughness={0.9} metalness={0.1} />
            </mesh>
          ))}
        </React.Fragment>
      ))}
      
      {/* Royal garden */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
        <boxGeometry args={[25, 25, 1]} />
        <meshStandardMaterial color={0x32CD32} roughness={0.9} metalness={0.1} />
      </mesh>
      
      {/* Swimming pool */}
      <group position={[10, 0, -10]}>
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[8, 1, 12]} />
          <meshStandardMaterial color={0x1E90FF} roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[7.8, 0.8, 11.8]} />
          <meshStandardMaterial color={0x1E90FF} transparent opacity={0.7} roughness={0.1} metalness={0.9} />
        </mesh>
      </group>
      
      {/* Garden fountain */}
      <group position={[-10, 0, -10]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[3, 3, 0.5, 16]} />
          <meshStandardMaterial color={0xCCCCCC} roughness={0.6} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.75, 0]} castShadow>
          <cylinderGeometry args={[2, 2, 0.5, 16]} />
          <meshStandardMaterial color={0xDDDDDD} roughness={0.6} metalness={0.4} />
        </mesh>
        <mesh position={[0, 1.25, 0]} castShadow>
          <cylinderGeometry args={[1, 1, 0.5, 16]} />
          <meshStandardMaterial color={0xEEEEEE} roughness={0.6} metalness={0.4} />
        </mesh>
      </group>
      
      {/* Royal flag on tower */}
      <mesh position={[8, 25, 8]} rotation={[0, Math.PI/4, 0]} castShadow>
        <boxGeometry args={[0.1, 4, 3]} />
        <meshStandardMaterial color={0xFF0000} />
      </mesh>
      
      {/* "HENOK" sign above entrance */}
      <mesh position={[0, 10, 7.6]} castShadow>
        <boxGeometry args={[6, 0.5, 0.2]} />
        <meshStandardMaterial color={0xD4AF37} roughness={0.6} metalness={0.4} />
      </mesh>
      
      {/* Royal emblem */}
      <mesh position={[0, 9, 7.6]} castShadow>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={0xFFD700} roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  );

  return (
    <group>
      {/* Ground */}
      <mesh 
        geometry={geometries.ground} 
        rotation={[-Math.PI / 2, 0, 0]} 
        receiveShadow
      >
        <meshStandardMaterial 
          color={0x228B22}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      
      {/* Rivers */}
      {riverData.map((river, i) => (
        <group key={`river-${i}`}>
          {/* River bank */}
          <mesh
            geometry={geometries.riverBank}
            rotation={[-Math.PI / 2, 0, river.rotation]}
            position={[river.x, 0.02, river.z]}
          >
            <meshStandardMaterial color={0x8B4513} roughness={0.9} metalness={0.1} />
          </mesh>
          {/* River water */}
          <mesh
            geometry={geometries.river}
            rotation={[-Math.PI / 2, 0, river.rotation]}
            position={[river.x, 0.05, river.z]}
          >
            <meshStandardMaterial 
              color={0x1E90FF} 
              transparent={true} 
              opacity={0.8} 
              roughness={0.1} 
              metalness={0.9} 
            />
          </mesh>
        </group>
      ))}
      
      {/* Bridges over rivers */}
      {bridgeData.map((bridge, i) => (
        <group key={`bridge-${i}`} position={[bridge.x, 1.5, bridge.z]} rotation={[0, bridge.rotation, 0]}>
          {/* Bridge deck */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[25, 3, 15]} />
            <meshStandardMaterial color={0x696969} roughness={0.8} metalness={0.3} />
          </mesh>
          {/* Bridge pillars */}
          {[-8, 0, 8].map((zOffset) => (
            <mesh key={`pillar-${zOffset}`} position={[0, -7.5, zOffset]} castShadow>
              <cylinderGeometry args={[2, 2, 15, 8]} />
              <meshStandardMaterial color={0x808080} roughness={0.7} metalness={0.3} />
            </mesh>
          ))}
          {/* Bridge rails */}
          {[-7.5, 7.5].map((zOffset) => (
            <React.Fragment key={`rail-${zOffset}`}>
              <mesh position={[0, 2.5, zOffset]} castShadow>
                <cylinderGeometry args={[0.2, 0.2, 25, 8]} />
                <meshStandardMaterial color={0x666666} roughness={0.8} metalness={0.2} />
              </mesh>
              {/* Rail posts */}
              {Array.from({ length: 13 }).map((_, j) => {
                const xPos = -12 + j * 2;
                return (
                  <mesh key={`rail-post-${j}`} position={[xPos, 1, zOffset]} castShadow>
                    <cylinderGeometry args={[0.15, 0.15, 3, 8]} />
                    <meshStandardMaterial color={0x666666} roughness={0.8} metalness={0.2} />
                  </mesh>
                );
              })}
            </React.Fragment>
          ))}
        </group>
      ))}
      
      {/* Main roads (avoiding rivers and residential areas) */}
      {[-100, 0, 100].map((x) => (
        <mesh 
          key={`road-x-${x}`}
          geometry={geometries.road}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, 0.1, 0]}
          receiveShadow
        >
          <meshStandardMaterial color={0x333333} roughness={0.8} metalness={0.2} />
        </mesh>
      ))}
      
      {[-100, 0, 100].map((z) => (
        <mesh 
          key={`road-z-${z}`}
          geometry={geometries.road}
          rotation={[-Math.PI / 2, Math.PI / 2, 0]}
          position={[0, 0.1, z]}
          receiveShadow
        >
          <meshStandardMaterial color={0x333333} roughness={0.8} metalness={0.2} />
        </mesh>
      ))}
      
      {/* Tunnels under rivers for roads that cross */}
      {[
        { x: 60, z: -100, rotation: Math.PI/2 },
        { x: 60, z: 0, rotation: Math.PI/2 },
        { x: 60, z: 100, rotation: Math.PI/2 },
        { x: -60, z: -100, rotation: Math.PI/2 },
        { x: -60, z: 0, rotation: Math.PI/2 },
        { x: -60, z: 100, rotation: Math.PI/2 },
        { x: -100, z: 60, rotation: 0 },
        { x: 0, z: 60, rotation: 0 },
        { x: 100, z: 60, rotation: 0 },
        { x: -100, z: -60, rotation: 0 },
        { x: 0, z: -60, rotation: 0 },
        { x: 100, z: -60, rotation: 0 }
      ].map((tunnel, i) => (
        <mesh
          key={`tunnel-${i}`}
          geometry={geometries.tunnel}
          position={[tunnel.x, 0, tunnel.z]}
          rotation={[Math.PI/2, 0, tunnel.rotation]}
          receiveShadow
        >
          <meshStandardMaterial color={0x333333} roughness={0.9} metalness={0.1} side={THREE.DoubleSide} />
        </mesh>
      ))}
      
      {/* Sidewalks along roads */}
      {[-112.5, -87.5, -12.5, 12.5, 87.5, 112.5].map((x) => (
        <mesh 
          key={`sidewalk-x-${x}`}
          geometry={geometries.sidewalk}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, 0.11, 0]}
          receiveShadow
        >
          <meshStandardMaterial color={0xC0C0C0} roughness={0.9} metalness={0.1} />
        </mesh>
      ))}
      
      {[-112.5, -87.5, -12.5, 12.5, 87.5, 112.5].map((z) => (
        <mesh 
          key={`sidewalk-z-${z}`}
          geometry={geometries.sidewalk}
          rotation={[-Math.PI / 2, Math.PI / 2, 0]}
          position={[0, 0.11, z]}
          receiveShadow
        >
          <meshStandardMaterial color={0xC0C0C0} roughness={0.9} metalness={0.1} />
        </mesh>
      ))}
      
      {/* Commercial buildings */}
      {buildingData.map((building, i) => (
        <group key={`building-${i}`}>
          <mesh
            position={[building.x, building.y, building.z]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[building.width, building.height, building.depth]} />
            <meshStandardMaterial 
              color={i % 4 === 0 ? 0x4a6572 : 
                     i % 4 === 1 ? 0x344955 : 
                     i % 4 === 2 ? 0x232f34 : 0x0d7377}
              roughness={0.7}
              metalness={0.3}
            />
          </mesh>
          
          {/* Building windows */}
          {Array.from({ length: building.windows }).map((_, j) => {
            const windowX = building.x - building.width/2 + (j % 5 + 1) * (building.width / 6);
            const windowZ = building.z - building.depth/2 + (Math.floor(j/5) + 1) * (building.depth / 4);
            const windowY = building.y - building.height/2 + (Math.floor(j/4) + 1) * (building.height / 6);
            
            return (
              <mesh
                key={`window-${i}-${j}`}
                position={[windowX, windowY, windowZ + 0.1]}
                castShadow
              >
                <boxGeometry args={[1.5, 2, 0.1]} />
                <meshStandardMaterial 
                  color={0x87CEEB}
                  transparent={true}
                  opacity={0.5}
                  roughness={0.2}
                  metalness={0.8}
                />
              </mesh>
            );
          })}
        </group>
      ))}
      
      {/* Residential houses (in proper zones, not on roads) */}
      {houseData.map((house, i) => (
        <group key={`house-${i}`}>
          <mesh
            position={[house.x, house.y, house.z]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[house.width, house.height, house.depth]} />
            <meshStandardMaterial 
              color={house.color}
              roughness={0.8}
              metalness={0.1}
            />
          </mesh>
          <mesh
            position={[house.x, house.height + 2.5, house.z]}
            castShadow
          >
            <coneGeometry args={[house.width / 1.5, 5, 4]} />
            <meshStandardMaterial color={0x8B0000} roughness={0.9} metalness={0.1} />
          </mesh>
          
          {/* Chimney */}
          <mesh
            position={[house.x + 3, house.height + 2, house.z + 3]}
            castShadow
          >
            <cylinderGeometry args={[0.5, 0.5, 4, 8]} />
            <meshStandardMaterial color={0x696969} roughness={0.8} metalness={0.2} />
          </mesh>
          
          {/* Door */}
          <mesh
            position={[house.x, 2, house.z + house.depth/2 + 0.1]}
            castShadow
          >
            <boxGeometry args={[2, 4, 0.2]} />
            <meshStandardMaterial color={0x8B4513} roughness={0.9} metalness={0.1} />
          </mesh>
          
          {/* Windows */}
          {[
            [house.x + house.width/3, 3, house.z + house.depth/2 + 0.1],
            [house.x - house.width/3, 3, house.z + house.depth/2 + 0.1],
            [house.x + house.width/2 + 0.1, 3, house.z],
            [house.x - house.width/2 - 0.1, 3, house.z],
          ].map((pos, j) => (
            <mesh key={`house-window-${i}-${j}`} position={pos} castShadow>
              <boxGeometry args={[1, 1.5, 0.1]} />
              <meshStandardMaterial 
                color={0x87CEEB}
                transparent={true}
                opacity={0.5}
                roughness={0.2}
                metalness={0.8}
              />
            </mesh>
          ))}
        </group>
      ))}
      
      {/* Apartment buildings (one in each zone) */}
      {apartmentData.map((apt, i) => (
        <group key={`apartment-${i}`} position={[apt.x, apt.height/2, apt.z]}>
          {/* Main building */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[apt.width, apt.height, apt.depth]} />
            <meshStandardMaterial 
              color={0x708090}
              roughness={0.7}
              metalness={0.3}
            />
          </mesh>
          
          {/* Apartment roof */}
          <mesh position={[0, apt.height/2 + 5, 0]} castShadow>
            <coneGeometry args={[15, 10, 4]} />
            <meshStandardMaterial color={0x8B0000} roughness={0.9} metalness={0.1} />
          </mesh>
          
          {/* Balconies */}
          {Array.from({ length: 5 }).map((_, floor) => {
            const yPos = -apt.height/2 + 10 + floor * 8;
            return (
              <React.Fragment key={`balcony-${floor}`}>
                <mesh position={[0, yPos, apt.depth/2 + 1.5]} castShadow receiveShadow>
                  <boxGeometry args={[8, 1, 3]} />
                  <meshStandardMaterial color={0x696969} roughness={0.8} metalness={0.2} />
                </mesh>
                {/* Balcony rails */}
                {[-3.5, 0, 3.5].map((x) => (
                  <mesh key={`rail-${floor}-${x}`} position={[x, yPos + 0.5, apt.depth/2 + 1.5]} castShadow>
                    <cylinderGeometry args={[0.1, 0.1, 8, 8]} />
                    <meshStandardMaterial color={0x666666} roughness={0.8} metalness={0.2} />
                  </mesh>
                ))}
              </React.Fragment>
            );
          })}
          
          {/* Apartment windows */}
          {Array.from({ length: 20 }).map((_, j) => {
            const windowX = -apt.width/2 + 5 + (j % 4) * 6;
            const windowZ = apt.depth/2 + 0.1;
            const windowY = -apt.height/2 + 8 + Math.floor(j/4) * 8;
            
            return (
              <mesh key={`apt-window-${i}-${j}`} position={[windowX, windowY, windowZ]} castShadow>
                <boxGeometry args={[4, 3, 0.1]} />
                <meshStandardMaterial 
                  color={0x87CEEB}
                  transparent={true}
                  opacity={0.3}
                  roughness={0.2}
                  metalness={0.8}
                />
              </mesh>
            );
          })}
          
          {/* Main entrance */}
          <mesh position={[0, 3, apt.depth/2 + 0.1]} castShadow>
            <boxGeometry args={[3, 5, 0.2]} />
            <meshStandardMaterial color={0x8B4513} roughness={0.9} metalness={0.1} />
          </mesh>
        </group>
      ))}
      
      {/* King Henok's Royal House (in center, most prominent location) */}
      <HenoksHouse />
      
      {/* Trees (only in residential zones and parks, not on roads) */}
      {treeData.map((tree, i) => (
        <group key={`tree-${i}`} position={[tree.x, tree.y, tree.z]} scale={[tree.scale, tree.scale, tree.scale]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.5, 0.7, 5, 8]} />
            <meshStandardMaterial color={0x8B4513} roughness={0.9} metalness={0.1} />
          </mesh>
          <mesh position={[0, 4, 0]} castShadow>
            <coneGeometry args={[4, 8, 8]} />
            <meshStandardMaterial color={0x228B22} roughness={0.8} metalness={0.1} />
          </mesh>
        </group>
      ))}
      
      {/* Lampposts along roads */}
      {lamppostData.map((post, i) => (
        <group key={`lamppost-${i}`} position={[post.x, post.y, post.z]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.3, 0.5, 15, 8]} />
            <meshStandardMaterial color={0x555555} roughness={0.8} metalness={0.2} />
          </mesh>
          <mesh position={[0, 8, 0]} castShadow>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial color={0xFFD700} />
          </mesh>
        </group>
      ))}
      
      {/* Parked cars (only on roads) */}
      {carData.map((car, i) => (
        <group key={`car-${i}`} position={[car.x, car.y, car.z]} rotation={[0, car.rotation, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[2.5, 0.8, 4.5]} />
            <meshStandardMaterial color={car.color} roughness={0.5} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.7, -0.5]} castShadow>
            <boxGeometry args={[2, 0.6, 2]} />
            <meshStandardMaterial color={0x000000} roughness={0.7} metalness={0.3} />
          </mesh>
          {/* Wheels */}
          {[
            [1.2, -0.4, 1.5], [-1.2, -0.4, 1.5],
            [1.2, -0.4, -1.5], [-1.2, -0.4, -1.5]
          ].map((pos, idx) => (
            <mesh key={`wheel-${idx}`} position={pos} rotation={[Math.PI/2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
              <meshStandardMaterial color={0x111111} roughness={0.8} metalness={0.2} />
            </mesh>
          ))}
        </group>
      ))}
      
      {/* Road markings */}
      {[-100, 0, 100].map((x) => (
        <React.Fragment key={`road-markings-x-${x}`}>
          {Array.from({ length: 20 }).map((_, i) => {
            const z = -240 + i * 24;
            // Skip markings on bridges
            if (Math.abs(z - 60) < 15 || Math.abs(z + 60) < 15) return null;
            return (
              <mesh
                key={`marking-x-${x}-${i}`}
                position={[x, 0.12, z]}
                rotation={[-Math.PI/2, 0, 0]}
              >
                <planeGeometry args={[1, 10]} />
                <meshBasicMaterial color={0xFFFF00} />
              </mesh>
            );
          })}
        </React.Fragment>
      ))}
      {[-100, 0, 100].map((z) => (
        <React.Fragment key={`road-markings-z-${z}`}>
          {Array.from({ length: 20 }).map((_, i) => {
            const x = -240 + i * 24;
            // Skip markings on bridges
            if (Math.abs(x - 60) < 15 || Math.abs(x + 60) < 15) return null;
            return (
              <mesh
                key={`marking-z-${z}-${i}`}
                position={[x, 0.12, z]}
                rotation={[-Math.PI/2, Math.PI/2, 0]}
              >
                <planeGeometry args={[1, 10]} />
                <meshBasicMaterial color={0xFFFF00} />
              </mesh>
            );
          })}
        </React.Fragment>
      ))}
    </group>
  );
});

export default City;