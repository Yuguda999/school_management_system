import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera, Stars, Text3D, Center, MeshDistortMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';

const FloatingShape = (props: any) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
            meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
        }
    });

    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <mesh ref={meshRef} {...props}>
                <icosahedronGeometry args={[1, 1]} />
                <meshStandardMaterial
                    color="#4f46e5"
                    roughness={0.1}
                    metalness={0.1}
                    wireframe
                    wireframeLinewidth={2}
                />
            </mesh>
        </Float>
    );
};

const AnimatedSphere = () => {
    const sphereRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (sphereRef.current) {
            const t = state.clock.getElapsedTime();
            sphereRef.current.position.y = Math.sin(t / 1.5) / 5;
        }
    })

    return (
        <Sphere ref={sphereRef} args={[1.5, 64, 64]} position={[0, 0, 0]}>
            <MeshDistortMaterial
                color="#8b5cf6"
                attach="material"
                distort={0.4}
                speed={2}
                roughness={0.2}
                metalness={0.8}
            />
        </Sphere>
    )
}


const Scene = () => {
    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <pointLight position={[-10, -10, -10]} color="purple" intensity={0.5} />

            <AnimatedSphere />

            <FloatingShape position={[-3, 2, -2]} scale={0.5} />
            <FloatingShape position={[3, -2, -1]} scale={0.7} />
            <FloatingShape position={[2, 3, -3]} scale={0.4} />
            <FloatingShape position={[-2, -3, -2]} scale={0.6} />

            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        </>
    );
};

const Hero3D: React.FC = () => {
    return (
        <div className="absolute inset-0 w-full h-full">
            <Canvas className="w-full h-full">
                <PerspectiveCamera makeDefault position={[0, 0, 8]} />
                <Scene />
            </Canvas>
        </div>
    );
};

export default Hero3D;

