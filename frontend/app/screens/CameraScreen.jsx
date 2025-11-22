import React, { useEffect, useRef, useState } from 'react';
import { Button, StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

export default function CameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  // Safe fallbacks when expo-camera enums are undefined
  const back = CameraType?.back ?? 'back';
  const front = CameraType?.front ?? 'front';

  const [facing, setFacing] = useState(back);
  const [image, setImage] = useState(null); // { uri, width, height }
  const cameraRef = useRef(null);

  useEffect(() => {
    MediaLibrary.requestPermissionsAsync();
  }, []);

  const toggleFacing = () => {
    setFacing((prev) => (prev === back ? front : back));
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Camera permission is required.</Text>
        <Button title="Grant permission" onPress={requestPermission} />
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync();
      setImage(photo);
    } catch (error) {
      console.error('Error taking picture:', error);
    }
  };

  const saveCurrentPhoto = async () => {
    if (!image?.uri) return;
    try {
      await MediaLibrary.saveToLibraryAsync(image.uri);
      console.log('Photo saved to gallery:', image.uri);
    } catch (error) {
      console.error('Error saving picture:', error);
    }
  };


  return (
    <View style={styles.container}>
      {!image && (
        <CameraView
          style={styles.camera}
          facing={facing}
          flash="off"
          zoom={0}
          ref={cameraRef}
        >
          <View style={styles.controls}>
            <TouchableOpacity onPress={takePicture} style={[styles.control, styles.shutter]}>
              <Text style={styles.controlText}>Capture</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleFacing} style={styles.control}>
              <Text style={styles.controlText}>Flip</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      )}
      {image && (
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: image.uri }}
            style={[
              styles.preview,
              image?.width && image?.height
                ? { aspectRatio: image.width / image.height }
                : null,
            ]}
            resizeMode="contain"
          />
          <View style={styles.previewActions}>
            <TouchableOpacity onPress={saveCurrentPhoto} style={[styles.control, styles.save]}>
              <Text style={styles.controlText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setImage(null)} style={[styles.control, styles.retake]}>
              <Text style={styles.controlText}>Retake</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  control: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
  },
  shutter: {
    marginRight: 12,
    backgroundColor: '#e91e63',
  },
  controlText: {
    color: '#fff',
    fontSize: 16,
  },
  preview: {
    width: '100%',
    minHeight: 140,
    backgroundColor: '#111',
  },
  previewContainer: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  previewActions: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  save: {
    backgroundColor: '#2e7d32',
  },
  retake: {
    backgroundColor: '#444',
  },
});
