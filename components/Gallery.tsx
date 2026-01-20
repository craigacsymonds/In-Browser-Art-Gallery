import React, { useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { Text, Float, useTexture } from '@react-three/drei';
import Frame from './Frame';
import { FrameData } from '../types';

// --- Configuration ---
const PAVILION_RADIUS = 16; 
const PILLAR_COUNT = 16; // Increased for density, but we will skip some for entrance
const CLEARING_RADIUS = 50; 
const FOREST_RADIUS = 150;

// Art Deco Colors
const COLOR_STONE = "#1a1a1a"; // Dark stone
const COLOR_ACCENT = "#000000"; // white (user requested change previously, keeping consistency)
const COLOR_FLOOR = "#1a1a1a"; // Darker floor

// Helper to create circular frame arrangement
const createFrames = (): FrameData[] => {
  const frames: FrameData[] = [];
  const imageUrls = [
    'https://i.imgur.com/t5BVRHB.jpeg?v=2',
    'https://i.imgur.com/csU5D87.jpeg?v=2',
    'https://i.imgur.com/UHhgZoE.jpeg?v=2',
    'https://i.imgur.com/rMJlfqn.jpeg?v=2',
    'https://i.imgur.com/jM030m5.jpeg?v=2',
    'https://i.imgur.com/AvUwqDr.jpeg?v=2',
    'https://i.imgur.com/Os1bX0h.jpeg?v=2',
    'https://i.imgur.com/wO2nGLm.jpeg?v=2',
    'https://i.imgur.com/Tuzi4qn.jpeg?v=2',
    'https://i.imgur.com/hQl0XyO.jpeg?v=2',
  ];

  const startAngle = 0.5;
  const endAngle = Math.PI * 2 - 0.5;
  const totalArc = endAngle - startAngle;
  
  for (let i = 0; i < 10; i++) {
    const t = i / (10 - 1); 
    const angle = startAngle + t * totalArc;

    const r = PAVILION_RADIUS - 1.5;
    const x = Math.sin(angle) * r;
    const z = Math.cos(angle) * r;
    
    frames.push({
      id: `f${i}`,
      position: [x, 5, z],
      rotation: [0, angle + Math.PI, 0], 
      scale: [2, 2, 2],
      defaultImage: imageUrls[i]
    });
  }
  return frames;
};

const FRAMES = createFrames();

// Error Boundary for Texture Loading
class TextureErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const Ground: React.FC = () => {
  // Using a reliable dark textured image
  const texture = useTexture("https://images.unsplash.com/photo-1533460004989-bffef113330c?auto=format&fit=crop&w=1024&q=80");
  
  useMemo(() => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(64, 64);
    texture.anisotropy = 16;
  }, [texture]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <circleGeometry args={[FOREST_RADIUS + 40, 64]} />
      <meshStandardMaterial
        map={texture}
        color="#080c08" // Very dark green tint
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
};

const FallbackGround: React.FC = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
    <circleGeometry args={[FOREST_RADIUS + 40, 64]} />
    <meshStandardMaterial color="#050a05" roughness={1} />
  </mesh>
);

const ElvenTree: React.FC<{ position: [number, number, number], scale: number, color: string }> = ({ position, scale, color }) => {
  return (
    <group position={position} scale={[scale, scale * 1.2, scale]}>
      <mesh position={[0, 4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.6, 8, 7]} />
        <meshStandardMaterial color="#2d2d2d" roughness={1} />
      </mesh>
      
      <group position={[0, 7, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <dodecahedronGeometry args={[2.5, 0]} />
          <meshStandardMaterial color={color} roughness={0.8} transparent opacity={0.6} />
        </mesh>
      </group>
    </group>
  );
};

const ArtDecoPillar: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* Main Shaft (Square) */}
      <mesh position={[0, 5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 10, 1]} />
        <meshStandardMaterial color={COLOR_STONE} roughness={0.2} metalness={0.2} />
      </mesh>
      
      {/* Gold Trim Bottom */}
      <mesh position={[0, 0.5, 0]}>
         <boxGeometry args={[1.2, 1, 1.2]} />
         <meshStandardMaterial color={COLOR_ACCENT} roughness={0.2} metalness={1} />
      </mesh>
      
      {/* Gold Trim Top */}
      <mesh position={[0, 9.5, 0]}>
         <boxGeometry args={[1.2, 1, 1.2]} />
         <meshStandardMaterial color={COLOR_ACCENT} roughness={0.2} metalness={1} />
      </mesh>
      
      {/* Vertical Gold Stripe */}
      <mesh position={[0, 5, 0.51]}>
        <boxGeometry args={[0.2, 8, 0.05]} />
        <meshStandardMaterial color={COLOR_ACCENT} roughness={0.2} metalness={1} />
      </mesh>
      <mesh position={[0, 5, -0.51]}>
        <boxGeometry args={[0.2, 8, 0.05]} />
        <meshStandardMaterial color={COLOR_ACCENT} roughness={0.2} metalness={1} />
      </mesh>
    </group>
  );
};

const Pavilion: React.FC = () => {
  const pillars = useMemo(() => {
    const items = [];
    const count = PILLAR_COUNT;
    const gap = 0.6; 

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const isEntrance = (angle < gap) || (angle > Math.PI * 2 - gap);

      if (!isEntrance) {
        const x = Math.sin(angle) * PAVILION_RADIUS;
        const z = Math.cos(angle) * PAVILION_RADIUS;
        items.push(<ArtDecoPillar key={i} position={[x, 0, z]} />);
      }
    }
    return items;
  }, []);

  return (
    <group>
      {/* --- Floor --- */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
        <circleGeometry args={[PAVILION_RADIUS + 2, 64]} />
        <meshStandardMaterial color={COLOR_FLOOR} roughness={0.6} metalness={0.05} />
      </mesh>
      
      <mesh position={[0, 0.11, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <ringGeometry args={[PAVILION_RADIUS - 0.5, PAVILION_RADIUS, 64]} />
        <meshStandardMaterial color={COLOR_ACCENT} metalness={1} roughness={0.1} />
      </mesh>
      
      <mesh position={[0, 0.12, 0]} rotation={[-Math.PI/2, 0, 0]}>
         <ringGeometry args={[5, 5.2, 8]} />
         <meshStandardMaterial color={COLOR_ACCENT} metalness={1} roughness={0.1} />
      </mesh>

      {/* --- Structure --- */}
      {pillars}

      {/* --- Cornice / Header --- */}
      <group position={[0, 10, 0]}>
         <mesh rotation={[-Math.PI/2, 0, 0]}>
            <ringGeometry args={[PAVILION_RADIUS - 1, PAVILION_RADIUS + 1, 32]} />
            <meshStandardMaterial color={COLOR_STONE} roughness={0.2} side={THREE.DoubleSide} />
         </mesh>
         
         <mesh position={[0, 0.5, 0]} rotation={[-Math.PI/2, 0, 0]}>
            <ringGeometry args={[PAVILION_RADIUS - 1.5, PAVILION_RADIUS + 1.5, 32]} />
            <meshStandardMaterial color={COLOR_STONE} roughness={0.2} side={THREE.DoubleSide} />
         </mesh>
         
         <mesh position={[0, -0.1, 0]} rotation={[-Math.PI/2, 0, 0]}>
            <ringGeometry args={[PAVILION_RADIUS + 0.9, PAVILION_RADIUS + 1.1, 64]} />
            <meshStandardMaterial color={COLOR_ACCENT} metalness={1} roughness={0.1} side={THREE.DoubleSide} />
         </mesh>
      </group>
    </group>
  );
};

const Gallery: React.FC = () => {
  const trees = useMemo(() => {
    const temp = [];
    const colors = ["#2d4a57", "#4a3b52", "#1f3a3d", "#3d3240"]; 
    
    for (let i = 0; i < 250; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = CLEARING_RADIUS + Math.random() * (FOREST_RADIUS - CLEARING_RADIUS); 
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const scale = 3 + Math.random() * 3; 
      const color = colors[Math.floor(Math.random() * colors.length)];
      temp.push({ position: [x, 0, z] as [number, number, number], scale, color });
    }
    return temp;
  }, []);

  return (
    <group>
      {/* Environment Floor with Error Handling */}
      <TextureErrorBoundary fallback={<FallbackGround />}>
        <Suspense fallback={<FallbackGround />}>
          <Ground />
        </Suspense>
      </TextureErrorBoundary>

      <Pavilion />

      {/* Gallery Title */}
      <Float speed={2} rotationIntensity={0} floatIntensity={0.5}>
        <Text
          position={[0, 8, 0]}
          fontSize={1.2}
          color={COLOR_ACCENT}
          font="https://fonts.gstatic.com/s/cinzel/v11/8vIJ7wvpGW5g_US7qk7s.woff"
          anchorX="center"
          anchorY="middle"
        >
          
        </Text>
      </Float>

      {/* Render Frames */}
      {FRAMES.map((data) => (
        <Frame key={data.id} {...data} />
      ))}
      
      {/* Render Mystic Trees */}
      {trees.map((tree, i) => (
        <ElvenTree key={i} position={tree.position} scale={tree.scale} color={tree.color} />
      ))}
    </group>
  );
};

export default Gallery;
