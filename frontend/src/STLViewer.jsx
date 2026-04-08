import React, { useEffect, useRef, useState } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  GizmoHelper,
  GizmoViewcube,
  TransformControls
} from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import * as THREE from "three";
import Toolbar from "./Toolbar";

// FIX Z UP
function FixCameraUp() {
  const { camera } = useThree();

  useEffect(() => {
    camera.up.set(0, 0, 1);
  }, []);

  return null;
}

// СТОЛ
function Platform() {
  return (
    <mesh>
      <planeGeometry args={[300, 300]} />
      <meshStandardMaterial color="#2a2a2a" />
    </mesh>
  );
}

// СЕТКА
function Grid() {
  return (
    <gridHelper
      args={[300, 30, "#666", "#333"]}
      rotation={[Math.PI / 2, 0, 0]}
    />
  );
}

// МОДЕЛЬ
function Model({ url, mode, orbitRef, onReady }) {
  const geometry = useLoader(STLLoader, url);
  const meshRef = useRef();

  useEffect(() => {
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;

    const center = new THREE.Vector3();
    box.getCenter(center);

    geometry.translate(-center.x, -center.y, 0);
    geometry.translate(0, 0, -box.min.z);

    onReady(meshRef, box);
  }, [geometry]);

  return (
    <TransformControls
      mode={mode}
      onMouseDown={() => (orbitRef.current.enabled = false)}
      onMouseUp={() => (orbitRef.current.enabled = true)}
    >
      <mesh ref={meshRef}>
        <primitive object={geometry} />
        <meshStandardMaterial color="#aaa" />
      </mesh>
    </TransformControls>
  );
}

// VIEWER
export default function STLViewer({ fileUrl }) {
  const orbitRef = useRef();
  const meshRef = useRef();

  const [mode, setMode] = useState("translate");
  const [box, setBox] = useState(null);

  // ЦЕНТР
  const centerModel = () => {
    if (!meshRef.current) return;
    meshRef.current.position.set(0, 0, 0);
  };

  // ПРИЛИПАНИЕ
  const stickToBed = () => {
    if (!meshRef.current) return;

    const bbox = new THREE.Box3().setFromObject(meshRef.current);
    const minZ = bbox.min.z;

    meshRef.current.position.z -= minZ;
  };

  return (
    <div style={{ height: "100vh" }}>

      <Toolbar
        mode={mode}
        setMode={setMode}
        onCenter={centerModel}
      />

      <Canvas camera={{ position: [200, -200, 180], fov: 45 }}>

        <FixCameraUp />

        <ambientLight intensity={0.7} />
        <directionalLight position={[200, 200, 200]} />

        <Platform />
        <Grid />

        {fileUrl && (
          <Model
            url={fileUrl}
            mode={mode}
            orbitRef={orbitRef}
            onReady={(ref, bbox) => {
              meshRef.current = ref.current;
              setBox(bbox);

              centerModel();
              setTimeout(stickToBed, 0);
            }}
          />
        )}

        <OrbitControls ref={orbitRef} makeDefault />

        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewcube />
        </GizmoHelper>

      </Canvas>
    </div>
  );
}
