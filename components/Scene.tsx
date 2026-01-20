import React from 'react';
import { Sky, Sparkles, Stars } from '@react-three/drei';
import Gallery from './Gallery';
import Player from './Player';

interface SceneProps {
  started: boolean;
  isMobile: boolean;
  joystickRef?: React.MutableRefObject<{ x: number, y: number }>;
  touchLookRef?: React.MutableRefObject<{ x: number, y: number }>;
}

const Scene: React.FC<SceneProps> = ({ started, isMobile, joystickRef, touchLookRef }) => {
  return (
    <>
      {/* Magical Background Color */}
      <color attach="background" args={['#1a1025']} />
      
      {/* Mystic Fog - Starts further out (20) to keep the clearing visible */}
      <fog attach="fog" args={['#1a1025', 20, 90]} />

      {/* Ambient Light - Soft Purple */}
      <ambientLight intensity={0.5} color="#d8b4e2" />
      
      {/* Moon/Magical Sun Light */}
      <directionalLight 
        position={[20, 30, 10]} 
        intensity={1.2} 
        color="#ffd7ba"
        castShadow 
        shadow-mapSize={[2048, 2048]}
      />
      
      {/* Central Highlight for the Pavilion */}
      <pointLight position={[0, 8, 0]} intensity={1.5} distance={25} color="#fff" decay={2} />
      
      {/* Subtle Starfield */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Magical Floating Particles (Fireflies/Pollen) */}
      <Sparkles 
        count={800} 
        scale={[80, 20, 80]} 
        size={4} 
        speed={0.3} 
        opacity={0.6} 
        color="#ffd700" 
      />

      <fog attach="fog" args={["#0b0712", 20, 140]} />

      {/* The Elven Gallery Structure */}
      <Gallery />

      {/* Controller */}
      {started && <Player isMobile={isMobile} joystickRef={joystickRef} touchLookRef={touchLookRef} />}
    </>
  );
};

export default Scene;