import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";

function Model({ url }) {
  const geometry = useLoader(STLLoader, url);

  return (
    <mesh>
      <primitive object={geometry} />
      <meshStandardMaterial color="gray" />
    </mesh>
  );
}

export default function STLViewer({ fileUrl }) {
  if (!fileUrl) return null;

  return (
    <Canvas style={{ height: 400 }}>
      <ambientLight />
      <Model url={fileUrl} />
      <OrbitControls />
    </Canvas>
  );
}