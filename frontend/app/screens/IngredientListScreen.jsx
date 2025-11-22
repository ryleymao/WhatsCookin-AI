import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function IngredientListScreen() {
  const router = useRouter();
  const { ingredients } = useLocalSearchParams();

  const ingredientList = useMemo(() => {
    if (Array.isArray(ingredients)) {
      return ingredients;
    }
    if (typeof ingredients === 'string') {
      try {
        const parsed = JSON.parse(ingredients);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // fall through if JSON.parse fails
      }
      return ingredients ? [ingredients] : [];
    }
    return [];
  }, [ingredients]);

  const hasIngredients = ingredientList.length > 0;

  const goToRecommendations = () => {
    if (!hasIngredients) return;
    router.push({
      pathname: '/screens/RecipeRecommendationScreen',
      params: { ingredients: JSON.stringify(ingredientList) },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detected Ingredients</Text>
      {ingredientList.length ? (
        <FlatList
          data={ingredientList}
          keyExtractor={(item, index) => `${item}-${index}`}
          renderItem={({ item }) => (
            <View style={styles.ingredientItem}>
              <Text style={styles.ingredientText}>{item}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <Text style={styles.emptyText}>No ingredients found.</Text>
      )}
      <TouchableOpacity
        style={[styles.button, !hasIngredients && styles.disabled]}
        onPress={goToRecommendations}
        disabled={!hasIngredients}
      >
        <Text style={styles.buttonText}>Get Recipes</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => router.replace('/screens/CameraScreen')}>
        <Text style={styles.buttonText}>Retake Photo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 16,
  },
  ingredientItem: {
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#111',
    borderRadius: 8,
  },
  ingredientText: {
    color: '#fff',
    fontSize: 16,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginVertical: 16,
  },
  button: {
    marginTop: 12,
    backgroundColor: '#e91e63',
    paddingVertical: 14,
    borderRadius: 10,
  },
  secondaryButton: {
    backgroundColor: '#444',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.6,
  },
});
