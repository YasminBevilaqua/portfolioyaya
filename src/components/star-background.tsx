import { PointMaterial, Points, type PointsInstancesProps } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import type { Points as PointsType } from "three";
import { AdditiveBlending } from "three";

export const StarBackground = (props: PointsInstancesProps) => {
  const ref = useRef<PointsType | null>(null);
  const { sphere, colors } = useMemo(() => {
    const points = new Float32Array(5000);
    const colorArray = new Float32Array(5000);
    const radius = 1.2;
    const palette: [number, number, number][] = [
      [0.78, 0.8, 0.9], // soft white/blue
      [0.38, 0.19, 0.58], // dark purple
      [0.62, 0.24, 0.45], // dark pink
      [0.65, 0.36, 0.12], // dark orange
    ];

    for (let i = 0; i < points.length; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = radius * Math.cbrt(Math.random());
      const sinPhi = Math.sin(phi);

      points[i] = r * sinPhi * Math.cos(theta);
      points[i + 1] = r * sinPhi * Math.sin(theta);
      points[i + 2] = r * Math.cos(phi);

      // Bias toward accent colors so they are clearly visible.
      const c =
        Math.random() < 0.1
          ? palette[0]
          : palette[1 + Math.floor(Math.random() * 3)];
      colorArray[i] = c[0];
      colorArray[i + 1] = c[1];
      colorArray[i + 2] = c[2];
    }

    return { sphere: points, colors: colorArray };
  }, []);

  useFrame((_state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} stride={3} positions={sphere} colors={colors} frustumCulled {...props}>
        <PointMaterial
          transparent
          vertexColors
          size={0.0035}
          opacity={0.5}
          blending={AdditiveBlending}
          toneMapped={false}
          sizeAttenuation
          depthWrite={false}
        />
      </Points>
    </group>
  );
};

const StarsCanvas = () => (
  <div className="stars-bg" aria-hidden>
    <Canvas camera={{ position: [0, 0, 1] }}>
      <Suspense fallback={null}>
        <StarBackground />
      </Suspense>
    </Canvas>
  </div>
);

export default StarsCanvas;
