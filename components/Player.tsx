import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PointerLockControls, useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';

interface PlayerProps {
  isMobile: boolean;
  joystickRef?: React.MutableRefObject<{ x: number, y: number }>;
  touchLookRef?: React.MutableRefObject<{ x: number, y: number }>;
}

const Player: React.FC<PlayerProps> = ({ isMobile, joystickRef, touchLookRef }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const [, get] = useKeyboardControls();
  
  // Physics / Movement state
  const frontVector = useRef(new THREE.Vector3());
  const sideVector = useRef(new THREE.Vector3());
  
  // Touch look sensitivity
  const LOOK_SPEED = 0.005;

  // Set camera rotation order to YXZ for FPS style (yaw matches world Y)
  useEffect(() => {
    camera.rotation.order = 'YXZ';
  }, [camera]);

  useFrame((state, delta) => {
    // 1. Handle Touch Look (Mobile)
    if (isMobile && touchLookRef && touchLookRef.current) {
      const { x, y } = touchLookRef.current;
      if (x !== 0 || y !== 0) {
        camera.rotation.y -= x * LOOK_SPEED;
        camera.rotation.x -= y * LOOK_SPEED;
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
        touchLookRef.current.x = 0;
        touchLookRef.current.y = 0;
      }
    }

    // 2. Calculate Movement Input
    const { forward, backward, left, right } = get();
    const joyX = joystickRef?.current.x || 0;
    const joyY = joystickRef?.current.y || 0;

    const inputZ = (Number(backward) - Number(forward)) + joyY;
    const inputX = (Number(right) - Number(left)) + joyX;

    // 3. Apply Movement relative to Camera Looking Direction
    const isMoving = Math.abs(inputZ) > 0.1 || Math.abs(inputX) > 0.1;
    const moveSpeed = 8.0; // Faster speed for larger map

    if (isMoving) {
      const forwardDir = new THREE.Vector3();
      camera.getWorldDirection(forwardDir);
      forwardDir.y = 0;
      forwardDir.normalize();

      const rightDir = new THREE.Vector3();
      rightDir.crossVectors(forwardDir, new THREE.Vector3(0, 1, 0)).normalize();

      const translation = new THREE.Vector3();
      translation.addScaledVector(forwardDir, -inputZ * moveSpeed * delta);
      translation.addScaledVector(rightDir, inputX * moveSpeed * delta);

      camera.position.add(translation);
    }

    // 4. Boundary / Height Constraints
    camera.position.y = 1.7; // Walking height

    // Large Forest Boundary
    const LIMIT = 80; 
    if (camera.position.x > LIMIT) camera.position.x = LIMIT;
    if (camera.position.x < -LIMIT) camera.position.x = -LIMIT;
    if (camera.position.z > LIMIT) camera.position.z = LIMIT;
    if (camera.position.z < -LIMIT) camera.position.z = -LIMIT;
  });

  return (
    <>
      {!isMobile && <PointerLockControls ref={controlsRef} />}
    </>
  );
};

export default Player;