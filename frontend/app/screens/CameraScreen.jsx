import React, { useRef, useState } from 'react';
import { Button, StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { analyzeIngredients } from '../api/api';

export default function CameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  // Safe fallbacks when expo-camera enums are undefined
  const back = CameraType?.back ?? 'back';
  const front = CameraType?.front ?? 'front';

  const [facing, setFacing] = useState(back);
  const [image, setImage] = useState(null); // { uri, width, height }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const cameraRef = useRef(null);

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
      setError('');
    } catch (error) {
      console.error('Error taking picture:', error);
    }
  };

  const analyzePhoto = async () => {
    if (!image?.uri || loading) return;
    setLoading(true);
    setError('');
    try {
      const result = await analyzeIngredients(image);
      const parsed = result?.ingredients || [];
      router.push({
        pathname: '/screens/IngredientListScreen',
        params: { ingredients: JSON.stringify(parsed) },
      });
    } catch (err) {
      setError(err.message || 'Failed to analyze image');
    } finally {
      setLoading(false);
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
            <TouchableOpacity
              onPress={analyzePhoto}
              style={[styles.control, styles.analyze, loading && styles.disabled]}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.controlText}>Analyze</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setImage(null)} style={[styles.control, styles.retake]}>
              <Text style={styles.controlText}>Retake</Text>
            </TouchableOpacity>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
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
  disabled: {
    opacity: 0.6,
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
  analyze: {
    backgroundColor: '#2e7d32',
  },
  retake: {
    backgroundColor: '#444',
  },
  error: {
    color: '#ff5252',
    marginTop: 8,
    textAlign: 'center',
  },
});
