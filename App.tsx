import React, { useState, Suspense, useRef, useEffect, useContext, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader, KeyboardControls, KeyboardControlsEntry } from '@react-three/drei';
import Scene from './components/Scene';
import { ImageState, GalleryContextType } from './types';

// Context for managing gallery state across the 3D scene and UI
export const GalleryContext = React.createContext<GalleryContextType>({
  images: {},
  hoveredFrame: null,
  setHoveredFrame: () => {},
});

// Bridge to pass Context into the Canvas (R3F creates a separate render tree)
const ContextBridge = ({ children }: { children: React.ReactNode }) => {
  const value = useContext(GalleryContext);
  return <GalleryContext.Provider value={value}>{children}</GalleryContext.Provider>;
};

enum Controls {
  forward = 'forward',
  backward = 'backward',
  left = 'left',
  right = 'right',
  jump = 'jump',
}

const App: React.FC = () => {
  const [images] = useState<ImageState>({});
  const [hoveredFrame, setHoveredFrame] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile Input Refs (Shared directly with 3D scene for performance)
  // x/y range: -1 to 1
  const joystickRef = useRef({ x: 0, y: 0 });
  // x/y are deltas for rotation
  const touchLookRef = useRef({ x: 0, y: 0 });

  // Mobile State for UI
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [isJoysticking, setIsJoysticking] = useState(false);
  
  // Joystick Config
  const JOYSTICK_MAX_RADIUS = 50;
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  
  // Touch Look Config
  const lastTouchRef = useRef<{ x: number, y: number } | null>(null);

  useEffect(() => {
    // Simple mobile detection
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const handleStart = () => {
    setStarted(true);
  };

  // --- Joystick Logic ---
  const handleJoystickStart = (e: React.TouchEvent) => {
    setIsJoysticking(true);
    updateJoystick(e.touches[0]);
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    if (!isJoysticking) return;
    updateJoystick(e.touches[0]);
  };

  const handleJoystickEnd = () => {
    setIsJoysticking(false);
    setJoystickPos({ x: 0, y: 0 });
    joystickRef.current = { x: 0, y: 0 };
  };

  const updateJoystick = (touch: React.Touch) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = touch.clientX - centerX;
    const deltaY = touch.clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    const clampedDistance = Math.min(distance, JOYSTICK_MAX_RADIUS);
    const angle = Math.atan2(deltaY, deltaX);
    
    const x = Math.cos(angle) * clampedDistance;
    const y = Math.sin(angle) * clampedDistance;
    
    setJoystickPos({ x, y });
    
    // Update ref for 3D engine (-1 to 1)
    joystickRef.current = {
      x: x / JOYSTICK_MAX_RADIUS,
      y: y / JOYSTICK_MAX_RADIUS
    };
  };

  // --- Look Logic ---
  const handleLookStart = (e: React.TouchEvent) => {
    lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleLookMove = (e: React.TouchEvent) => {
    if (!lastTouchRef.current) return;
    const touch = e.touches[0];
    
    const deltaX = touch.clientX - lastTouchRef.current.x;
    const deltaY = touch.clientY - lastTouchRef.current.y;
    
    touchLookRef.current = { x: deltaX, y: deltaY };
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleLookEnd = () => {
    lastTouchRef.current = null;
    touchLookRef.current = { x: 0, y: 0 };
  };

  const map = useMemo<KeyboardControlsEntry<Controls>[]>(()=>[
    { name: Controls.forward, keys: ['ArrowUp', 'w', 'W'] },
    { name: Controls.backward, keys: ['ArrowDown', 's', 'S'] },
    { name: Controls.left, keys: ['ArrowLeft', 'a', 'A'] },
    { name: Controls.right, keys: ['ArrowRight', 'd', 'D'] },
    { name: Controls.jump, keys: ['Space'] },
  ], []);

  return (
    <GalleryContext.Provider value={{ images, hoveredFrame, setHoveredFrame }}>
      <div className="relative w-full h-full bg-black select-none overflow-hidden">
        
        {/* 3D Canvas */}
        <Canvas
          shadows={true}
          dpr={[1, 1.5]}
          camera={{ position: [0, 1.7, 28], fov: 60 }}
          className="w-full h-full block"
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <Suspense fallback={null}>
            <ContextBridge>
              <KeyboardControls map={map}>
                <Scene 
                  started={started} 
                  isMobile={isMobile}
                  joystickRef={joystickRef} 
                  touchLookRef={touchLookRef} 
                />
              </KeyboardControls>
            </ContextBridge>
          </Suspense>
        </Canvas>

        {/* Loading Overlay */}
        <Loader 
          containerStyles={{ background: '#111' }}
          innerStyles={{ width: '400px', background: '#333' }}
          barStyles={{ background: '#fff', height: '4px' }}
          dataStyles={{ color: '#fff', fontFamily: 'Inter', fontSize: '14px' }}
        />

        {/* Intro Overlay */}
        {!started && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 text-white p-8 text-center transition-opacity duration-500">
            <h1 className="text-4xl md:text-5xl font-light mb-4 tracking-tighter">CRAIG SYMONDS PHOTOGRAPHY</h1>
            <p className="text-gray-400 mb-8 max-w-md text-base md:text-lg font-light">
              Welcome to the gallery. <br/>
              {isMobile ? "Drag left to Move. Drag right to Look." : "Walk and Look."}
            </p>
            <button 
              onClick={handleStart}
              className="px-8 py-3 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-colors tracking-wide cursor-pointer"
            >
              ENTER SPACE
            </button>
            <div className="mt-8 grid grid-cols-2 gap-8 text-sm text-gray-500">
              {isMobile ? (
                 <div className="col-span-2">
                   <span className="block font-bold text-gray-300">TOUCH CONTROLS</span>
                   LEFT: MOVE • RIGHT: LOOK
                 </div>
              ) : (
                <>
                  <div>
                    <span className="block font-bold text-gray-300">MOVE</span>
                    W A S D
                  </div>
                  <div>
                    <span className="block font-bold text-gray-300">LOOK</span>
                    MOUSE
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* HUD & Mobile Controls */}
        {started && (
          <>
            <div className={`crosshair ${hoveredFrame ? 'hovering' : ''}`} />
            
            <div className="absolute top-6 left-6 z-10 pointer-events-none">
              <h2 className="text-white font-light text-xl tracking-widest opacity-80">Craig A C Symonds</h2>
            </div>

            {/* Hint Text */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-xs md:text-sm font-light pointer-events-none transition-opacity duration-300 w-full text-center px-4">
              {hoveredFrame ? (
                <span className="text-white bg-black/50 px-3 py-1 rounded backdrop-blur-md border border-white/10 animate-pulse">
                  Observing Artwork
                </span>
              ) : (
                <span>
                   {isMobile ? "Use Left Joystick to Move • Drag Right to Look" : "Click to Capture Mouse • WASD to Move • ESC to Exit"}
                </span>
              )}
            </div>

            {/* Mobile Touch Controls Layer */}
            {isMobile && (
              <div className="absolute inset-0 z-40 flex">
                
                {/* Left Half: Joystick Zone */}
                <div 
                  className="flex-1 relative touch-none"
                  onTouchStart={handleJoystickStart}
                  onTouchMove={handleJoystickMove}
                  onTouchEnd={handleJoystickEnd}
                >
                  {/* Dynamic Joystick Anchor */}
                  <div 
                    ref={joystickBaseRef}
                    className={`absolute bottom-20 left-12 w-32 h-32 rounded-full border-2 border-white/20 bg-black/10 backdrop-blur-sm transition-opacity duration-200 ${isJoysticking ? 'opacity-100' : 'opacity-40'}`}
                  >
                    <div 
                      className="absolute w-12 h-12 bg-white/80 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                      style={{ 
                        top: '50%', 
                        left: '50%', 
                        marginTop: '-24px', 
                        marginLeft: '-24px',
                        transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)` 
                      }}
                    />
                  </div>
                </div>

                {/* Right Half: Look Zone */}
                <div 
                  className="flex-1 touch-none active:bg-white/5 transition-colors duration-200"
                  onTouchStart={handleLookStart}
                  onTouchMove={handleLookMove}
                  onTouchEnd={handleLookEnd}
                />
              </div>
            )}
          </>
        )}
      </div>
    </GalleryContext.Provider>
  );
};

export default App;