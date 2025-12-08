import React, { useEffect, useRef } from 'react';

const Controls = ({ onShoot, playerMode, gamePaused }) => {
  const shootCooldown = useRef(false);
  const autoFireInterval = useRef(null);

  useEffect(() => {
    const handleMouseDown = (e) => {
      if (!gamePaused && e.button === 0 && !shootCooldown.current) {
        onShoot();
        shootCooldown.current = true;
        
        // Start auto-fire for automatic weapons
        autoFireInterval.current = setInterval(() => {
          if (shootCooldown.current) {
            onShoot();
          }
        }, 150);
        
        setTimeout(() => {
          shootCooldown.current = false;
          if (autoFireInterval.current) {
            clearInterval(autoFireInterval.current);
            autoFireInterval.current = null;
          }
        }, 500);
      }
    };

    const handleMouseUp = (e) => {
      if (e.button === 0) {
        shootCooldown.current = false;
        if (autoFireInterval.current) {
          clearInterval(autoFireInterval.current);
          autoFireInterval.current = null;
        }
      }
    };

    // Spacebar for alternative shooting
    const handleKeyDown = (e) => {
      if (gamePaused) return;

      if (e.key === ' ' && !shootCooldown.current) {
        e.preventDefault();
        onShoot();
        shootCooldown.current = true;
        setTimeout(() => {
          shootCooldown.current = false;
        }, 200);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
      
      if (autoFireInterval.current) {
        clearInterval(autoFireInterval.current);
      }
    };
  }, [onShoot, playerMode, gamePaused]);

  return null;
};

export default Controls;