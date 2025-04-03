import React, { useEffect, useState, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

// Extend the window interface to include DeviceOrientationEvent with requestPermission
declare global {
  interface Window {
    DeviceOrientationEvent: {
      requestPermission?: () => Promise<string>;
    } & typeof DeviceOrientationEvent;
  }
}

// Main component
const RelativePositionAR: React.FC = () => {
  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      {/* Camera video feed */}
      <CameraFeed />

      {/* Three.js scene overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <Canvas camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 0, 0] }}>
          <ambientLight intensity={0.5} />
          <ARScene />
        </Canvas>
      </div>
    </div>
  );
};

// Component to handle camera feed
const CameraFeed: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Error accessing camera:", err);
        });
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  );
};

// AR Scene with relative positioning
const ARScene: React.FC = () => {
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [deviceOrientation, setDeviceOrientation] = useState<{
    alpha: number;
    beta: number;
    gamma: number;
  }>({
    alpha: 0,
    beta: 0,
    gamma: 0,
  });
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [visibleObjects, setVisibleObjects] = useState<Set<string>>(
    new Set([
      "obj1",
      "obj2",
      "obj3",
      "obj4",
      "obj5",
      "obj6",
      "obj7",
      "obj8",
      "obj9",
      "obj10",
    ])
  );
  const { camera } = useThree();

  const handleObjectClick = (objectId: string) => {
    setVisibleObjects((prev) => {
      const newSet = new Set(prev);
      newSet.delete(objectId);
      return newSet;
    });
  };

  // Handle device orientation permissions and setup
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null && event.beta !== null && event.gamma !== null) {
        setDeviceOrientation({
          alpha: event.alpha,
          beta: event.beta,
          gamma: event.gamma,
        });
      }
    };

    const setupOrientationListener = () => {
      window.addEventListener("deviceorientation", handleOrientation);
      setPermissionGranted(true);
    };

    // Try to access device orientation
    const requestOrientationPermission = async () => {
      try {
        // Check if we need to request permission (iOS 13+ requirement)
        if (
          window.DeviceOrientationEvent &&
          typeof window.DeviceOrientationEvent.requestPermission === "function"
        ) {
          const permission =
            await window.DeviceOrientationEvent.requestPermission();
          if (permission === "granted") {
            setupOrientationListener();
          } else {
            console.error("Device orientation permission denied");
          }
        } else {
          // For devices that don't require permission
          setupOrientationListener();
        }
      } catch (error) {
        console.error("Error requesting device orientation permission:", error);
        // Fallback for devices without orientation sensors
        setupOrientationListener();
      }
    };

    requestOrientationPermission();

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  // Get user's initial location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error("Error accessing location:", error),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Update camera rotation based on device orientation
  useEffect(() => {
    if (deviceOrientation) {
      const alphaRad = (deviceOrientation.alpha * Math.PI) / 180;
      const betaRad = (deviceOrientation.beta * Math.PI) / 180;
      const gammaRad = (deviceOrientation.gamma * Math.PI) / 180;

      const quaternion = new THREE.Quaternion();
      quaternion.setFromEuler(
        new THREE.Euler(betaRad - Math.PI / 2, alphaRad, gammaRad)
      );

      camera.quaternion.copy(quaternion);
    }
  }, [deviceOrientation, camera]);

  // Show loading or permission messages
  if (!permissionGranted) {
    return (
      <Text position={[0, 0, -2]} fontSize={0.2} color="white">
        Waiting for orientation permission...
      </Text>
    );
  }

  if (!userLocation) {
    return (
      <Text position={[0, 0, -2]} fontSize={0.2} color="white">
        Getting your location...
      </Text>
    );
  }

  return (
    <>
      {/* Objects placed relative to the user */}
      {visibleObjects.has("obj1") && (
        <RelativeObject
          userLocation={userLocation}
          meters={1}
          direction={0}
          color="red"
          label="1m North"
          size={0.2}
          objectId="obj1"
          onObjectClick={handleObjectClick}
        />
      )}

      {visibleObjects.has("obj2") && (
        <RelativeObject
          userLocation={userLocation}
          meters={8}
          direction={45}
          color="blue"
          label="8m NE"
          size={0.15}
          objectId="obj2"
          onObjectClick={handleObjectClick}
        />
      )}

      {visibleObjects.has("obj3") && (
        <RelativeObject
          userLocation={userLocation}
          meters={3}
          direction={90}
          color="green"
          label="3m East"
          size={0.25}
          objectId="obj3"
          onObjectClick={handleObjectClick}
        />
      )}

      {visibleObjects.has("obj4") && (
        <RelativeObject
          userLocation={userLocation}
          meters={6}
          direction={135}
          color="yellow"
          label="6m SE"
          size={0.18}
          objectId="obj4"
          onObjectClick={handleObjectClick}
        />
      )}

      {visibleObjects.has("obj5") && (
        <RelativeObject
          userLocation={userLocation}
          meters={4}
          direction={180}
          color="purple"
          label="4m South"
          size={0.22}
          objectId="obj5"
          onObjectClick={handleObjectClick}
        />
      )}

      {visibleObjects.has("obj6") && (
        <RelativeObject
          userLocation={userLocation}
          meters={10}
          direction={225}
          color="orange"
          label="10m SW"
          size={0.12}
          objectId="obj6"
          onObjectClick={handleObjectClick}
        />
      )}

      {visibleObjects.has("obj7") && (
        <RelativeObject
          userLocation={userLocation}
          meters={5}
          direction={270}
          color="cyan"
          label="5m West"
          size={0.2}
          objectId="obj7"
          onObjectClick={handleObjectClick}
        />
      )}

      {visibleObjects.has("obj8") && (
        <RelativeObject
          userLocation={userLocation}
          meters={7}
          direction={315}
          color="magenta"
          label="7m NW"
          size={0.16}
          objectId="obj8"
          onObjectClick={handleObjectClick}
        />
      )}

      {visibleObjects.has("obj9") && (
        <RelativeObject
          userLocation={userLocation}
          meters={12}
          direction={30}
          color="lime"
          label="12m NNE"
          size={0.1}
          objectId="obj9"
          onObjectClick={handleObjectClick}
        />
      )}

      {visibleObjects.has("obj10") && (
        <RelativeObject
          userLocation={userLocation}
          meters={2}
          direction={150}
          color="pink"
          label="2m SSE"
          size={0.3}
          objectId="obj10"
          onObjectClick={handleObjectClick}
        />
      )}
    </>
  );
};

// Update the props interface
interface RelativeObjectProps {
  userLocation: { lat: number; lng: number };
  meters: number;
  direction: number;
  color: string;
  label: string;
  size: number;
  objectId: string;
  onObjectClick: (objectId: string) => void;
}

// Update the RelativeObject component
const RelativeObject: React.FC<RelativeObjectProps> = ({
  meters,
  direction,
  color,
  label,
  size,
  objectId,
  onObjectClick,
}) => {
  const directionRad = (direction * Math.PI) / 180;
  const scaleFactor = 0.5;
  const x = Math.sin(directionRad) * meters * scaleFactor;
  const z = -Math.cos(directionRad) * meters * scaleFactor;

  return (
    <group position={[x, 0, z]}>
      <mesh onClick={() => onObjectClick(objectId)}>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial color={color} />
      </mesh>

      <Text
        position={[0, size + 0.1, 0]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="bottom"
      >
        {label}
      </Text>
    </group>
  );
};

export default RelativePositionAR;
