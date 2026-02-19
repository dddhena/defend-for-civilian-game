import * as THREE from 'three';

// Utility to create a canvas texture
const createTexture = (width, height, drawFn) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
};

export const createRoadTexture = () => {
  return createTexture(512, 512, (ctx, width, height) => {
    // Asphalt base
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, width, height);

    // Noise for asphalt texture
    for (let i = 0; i < 50000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#3a3a3a' : '#2a2a2a';
        ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
    }

    // Road markings (dashed line in center)
    ctx.fillStyle = '#FFFFFF';
    const dashHeight = height / 10;
    const dashWidth = width / 40;
    for (let i = 0; i < 10; i+=2) {
        ctx.fillRect((width - dashWidth) / 2, i * dashHeight + dashHeight/2, dashWidth, dashHeight);
    }
    
    // Side lines (solid)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(10, 0, 5, height);
    ctx.fillRect(width - 15, 0, 5, height);
  });
};

export const createGrassTexture = () => {
  return createTexture(512, 512, (ctx, width, height) => {
    // Base green
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(0, 0, width, height);

    // Grass blades/noise
    for (let i = 0; i < 100000; i++) {
        const shade = Math.random();
        ctx.fillStyle = shade > 0.6 ? '#3a6b32' : (shade > 0.3 ? '#1e401c' : '#4a7c42');
        ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
    }
  });
};


export const createBuildingTexture = (color = '#555555') => {
  return createTexture(256, 256, (ctx, width, height) => {
    // Base wall
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);

    // Windows
    const rows = 4;
    const cols = 4;
    const windowWidth = width / (cols * 2);
    const windowHeight = height / (rows * 2);
    const paddingX = windowWidth / 2;
    const paddingY = windowHeight / 2;

    ctx.fillStyle = '#87CEEB'; // Light blue for windows
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
             // Add some variation (lights on/off)
             ctx.fillStyle = Math.random() > 0.3 ? '#87CEEB' : '#1a2b3c';
             
             ctx.fillRect(
                 c * (windowWidth + paddingX) + paddingX/2, 
                 r * (windowHeight + paddingY) + paddingY/2, 
                 windowWidth, 
                 windowHeight
             );
        }
    }
    
    // Add noise for improved texture
     for (let i = 0; i < 5000; i++) {
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
    }
  });
};

export const createSidewalkTexture = () => {
    return createTexture(256, 256, (ctx, width, height) => {
        // Concrete base
        ctx.fillStyle = '#aaaaaa';
        ctx.fillRect(0, 0, width, height);
        
        // Paving stones pattern
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 2;
        
        const tileSize = 32;
        
        for (let x = 0; x < width; x += tileSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        for (let y = 0; y < height; y += tileSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Noise
        for (let i = 0; i < 10000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#b0b0b0' : '#a0a0a0';
            ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
        }
    });
};

export const createWaterTexture = () => {
    return createTexture(512, 512, (ctx, width, height) => {
        ctx.fillStyle = '#1E90FF';
        ctx.fillRect(0, 0, width, height);
        
        // Water ripples
         for (let i = 0; i < 5000; i++) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 10 + 5;
            ctx.beginPath();
            ctx.ellipse(x, y, size, size/2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    });
};
