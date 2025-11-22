import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getRecipeRecommendations } from '../api/api';

export default function RecipeRecommendationScreen() {
  const router = useRouter();
  const { ingredients } = useLocalSearchParams();

  const ingredientList = useMemo(() => {
    if (Array.isArray(ingredients)) return ingredients;
    if (typeof ingredients === 'string') {
      try {
        const parsed = JSON.parse(ingredients);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fall through
      }
      return ingredients ? [ingredients] : [];
    }
    return [];
  }, [ingredients]);

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!ingredientList.length) return;
      setLoading(true);
      setError('');
      try {
        const res = await getRecipeRecommendations(ingredientList);
        setRecipes(res?.recommendations || []);
      } catch (err) {
        setError(err.message || 'Failed to fetch recipes');
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, [ingredientList]);

  const handleOpenLink = async (url) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        setError('Cannot open this link');
      }
    } catch {
      setError('Failed to open link');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recipe Recommendations</Text>
      <Text style={styles.subtitle}>Ingredients: {ingredientList.join(', ') || 'None'}</Text>
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color="#e91e63" />
          <Text style={styles.statusText}>Finding recipes...</Text>
        </View>
      )}
      {!loading && error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !error && recipes.length === 0 ? (
        <Text style={styles.emptyText}>No recipes found.</Text>
      ) : null}
      {!loading && !error && recipes.length > 0 && (
        <FlatList
          data={recipes}
          keyExtractor={(item, index) => `${item.name || item.title || 'recipe'}-${index}`}
          renderItem={({ item }) => {
            const name = item.name || item.title || 'Untitled Recipe';
            const link = item.link || item.url || item.description || '';
            return (
              <View style={styles.recipeCard}>
                <Text style={styles.recipeTitle}>{name}</Text>
                {link ? (
                  <TouchableOpacity onPress={() => handleOpenLink(link)}>
                    <Text style={styles.recipeLink}>{link}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
        />
      )}
      <TouchableOpacity style={[styles.button, styles.primary]} onPress={() => router.replace('/screens/CameraScreen')}>
        <Text style={styles.buttonText}>New Photo</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.secondary]}
        onPress={() =>
          router.replace({
            pathname: '/screens/IngredientListScreen',
            params: { ingredients: JSON.stringify(ingredientList) },
          })
        }
      >
        <Text style={styles.buttonText}>Back to Ingredients</Text>
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
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 12,
  },
  center: {
    alignItems: 'center',
    marginVertical: 16,
  },
  statusText: {
    color: '#ccc',
    marginTop: 8,
  },
  error: {
    color: '#ff5252',
    textAlign: 'center',
    marginVertical: 12,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginVertical: 12,
  },
  listContent: {
    paddingBottom: 16,
  },
  recipeCard: {
    backgroundColor: '#111',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  recipeTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  recipeLink: {
    color: '#9cf',
    fontSize: 14,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  primary: {
    backgroundColor: '#e91e63',
  },
  secondary: {
    backgroundColor: '#444',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
});
