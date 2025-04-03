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
  const { camera } = useThree();

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

      {/* 2 meters in front */}
      <RelativeObject
        userLocation={userLocation}
        meters={2}
        direction={0} // 0 degrees = North
        color="red"
        label="2m North"
      />

      {/* 3 meters to the right (East) */}
      <RelativeObject
        userLocation={userLocation}
        meters={3}
        direction={90} // 90 degrees = East
        color="blue"
        label="3m East"
      />

      {/* 2.5 meters to the left (West) */}
      <RelativeObject
        userLocation={userLocation}
        meters={2.5}
        direction={270} // 270 degrees = West
        color="green"
        label="2.5m West"
      />

      {/* 4 meters behind (South) */}
      <RelativeObject
        userLocation={userLocation}
        meters={4}
        direction={180} // 180 degrees = South
        color="yellow"
        label="4m South"
      />

      {/* 3 meters North-East */}
      <RelativeObject
        userLocation={userLocation}
        meters={3}
        direction={45} // 45 degrees = North-East
        color="purple"
        label="3m North-East"
      />
    </>
  );
};

// Props for the relative object component
interface RelativeObjectProps {
  userLocation: { lat: number; lng: number };
  meters: number;
  direction: number; // in degrees, 0 = North, 90 = East, etc.
  color: string;
  label: string;
}

// Component for placing objects at relative positions
const RelativeObject: React.FC<RelativeObjectProps> = ({
  meters,
  direction,
  color,
  label,
}) => {
  // Convert direction to radians
  const directionRad = (direction * Math.PI) / 180;

  // Calculate 3D position
  // Note: We're keeping the y-coordinate at 0 (eye level)
  // Scale factor determines how distance in meters maps to 3D space
  const scaleFactor = 0.5; // adjust for your scene

  // Calculate relative position in 3D space
  // North is negative Z, East is positive X
  const x = Math.sin(directionRad) * meters * scaleFactor;
  const z = -Math.cos(directionRad) * meters * scaleFactor;

  return (
    <group position={[x, 0, z]}>
      <mesh>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color={color} />
      </mesh>

      <Text
        position={[0, 0.5, 0]}
        fontSize={0.2}
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
