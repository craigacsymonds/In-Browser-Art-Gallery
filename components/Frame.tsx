import React, { useRef, useState, useContext, Suspense } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { FrameData } from '../types';
import { GalleryContext } from '../App';

interface FrameProps extends FrameData {}

// Error Boundary Component to catch texture loading failures
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

// Sub-component that loads the texture
const FrameImage: React.FC<{ url: string }> = ({ url }) => {
  const texture = useTexture(url);
  // Clone texture to avoid shared state issues
  const materialTexture = texture.clone();
  materialTexture.colorSpace = THREE.SRGBColorSpace;
  
  return <meshStandardMaterial map={materialTexture} roughness={0.4} />;
};

const Frame: React.FC<FrameProps> = ({ id, position, rotation, scale = [1, 1, 1], defaultImage }) => {
  const { images, setHoveredFrame } = useContext(GalleryContext);
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHover] = useState(false);
  
  const textureUrl = images[id] || defaultImage || 'https://picsum.photos/500/500?grayscale';
  
  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHover(true);
    setHoveredFrame(id);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: any) => {
    setHover(false);
    setHoveredFrame(null);
    document.body.style.cursor = 'auto';
  };

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group ref={meshRef} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
        
        {/* Frame Outer Box */}
        <mesh position={[0, 0, 0.05]}>
          <boxGeometry args={[3.2, 3.2, 0.1]} />
          <meshStandardMaterial color={hovered ? "#333" : "#111"} roughness={0.5} />
        </mesh>

        {/* Inner Mat */}
        <mesh position={[0, 0, 0.11]}>
          <boxGeometry args={[2.8, 2.8, 0.02]} />
          <meshStandardMaterial color={hovered ? "#fff" : "#eee"} roughness={0.9} />
        </mesh>

        {/* The Image */}
        <mesh position={[0, 0, 0.13]}>
          <planeGeometry args={[2.5, 2.5]} />
          {/* Use ErrorBoundary to prevent app crash on 404/CORS errors */}
          <TextureErrorBoundary fallback={<meshStandardMaterial color="#222" />}>
             <Suspense fallback={<meshStandardMaterial color="#222" />}>
                <FrameImage url={textureUrl} />
             </Suspense>
          </TextureErrorBoundary>
        </mesh>
      </group>
    </group>
  );
};

export default Frame;