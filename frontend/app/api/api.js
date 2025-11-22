// api.js
import AsyncStorage from "@react-native-async-storage/async-storage";

// Toggle this flag to swap between mock API (no backend needed) and real backend calls
export const USE_MOCK_API = true;

// On a real device, DON'T use localhost; use your computer's LAN IP.
// Example: "http://192.168.1.20:8000"
const BASE_URL = "http://YOUR-IP-OR-DOMAIN:8000";

const TOKEN_KEY = "accessToken";

// --- Mock data and helpers ---
const MOCK_LATENCY_MS = 300;

const mockState = {
  users: [
    {
      id: 1,
      name: "Demo User",
      email: "demo@example.com",
      password: "password", // intentionally simple for mock
    },
  ],
  recipes: [
    { id: 1, title: "Spaghetti Bolognese", description: "A hearty classic." },
    { id: 2, title: "Veggie Stir Fry", description: "Quick and colorful." },
    { id: 3, title: "Avocado Toast", description: "Brunch favorite." },
  ],
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const nextId = (items) => (items.length ? Math.max(...items.map((i) => i.id)) + 1 : 1);

async function mockRegister(name, email, password) {
  await delay(MOCK_LATENCY_MS);
  const exists = mockState.users.some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    throw new Error("Email already registered (mock)");
  }
  const newUser = { id: nextId(mockState.users), name, email, password };
  mockState.users.push(newUser);
  return { id: newUser.id, name: newUser.name, email: newUser.email };
}

async function mockLogin(email, password) {
  await delay(MOCK_LATENCY_MS);
  const user = mockState.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!user) {
    throw new Error("Invalid credentials (mock)");
  }
  const token = "mock-token";
  await AsyncStorage.setItem(TOKEN_KEY, token);
  return token;
}

async function mockGetRecipes({ page = 1, limit = 10 } = {}) {
  await delay(MOCK_LATENCY_MS);
  const start = (page - 1) * limit;
  const data = mockState.recipes.slice(start, start + limit);
  return { data, page, limit, total: mockState.recipes.length };
}

async function mockDeleteRecipe(recipeId) {
  await delay(MOCK_LATENCY_MS);
  mockState.recipes = mockState.recipes.filter((r) => r.id !== recipeId);
  return null;
}

async function mockPing() {
  await delay(MOCK_LATENCY_MS);
  return { message: "Hello from the mock API" };
}

// --- Internal helper for making real requests ---
async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = {
    "Content-Type": "application/json",
  };

  // Attach token for protected routes
  if (auth) {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) {
      throw new Error("Not authenticated");
    }
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    // Try to parse FastAPI error body: {"detail": "..."}
    let message = `Request failed with status ${res.status}`;
    try {
      const errorData = await res.json();
      if (errorData?.detail) {
        message = errorData.detail;
      }
    } catch {
      // ignore JSON parse error, keep default message
    }
    throw new Error(message);
  }

  // 204 No Content (e.g., delete) — nothing to parse
  if (res.status === 204) return null;

  return res.json();
}

// --- Auth helpers ---

// POST /register
// UserCreate schema: { name, email, password }
export async function register(name, email, password) {
  if (USE_MOCK_API) return mockRegister(name, email, password);

  const data = await request("/register", {
    method: "POST",
    body: { name, email, password },
  });
  // data matches UserResponse from backend
  return data;
}

// POST /login
// UserLogin schema: { email, password }
// Response: { token: "..." }
export async function login(email, password) {
  if (USE_MOCK_API) return mockLogin(email, password);

  const data = await request("/login", {
    method: "POST",
    body: { email, password },
  });

  const token = data.token;
  if (!token) {
    throw new Error("No token returned from server");
  }

  await AsyncStorage.setItem(TOKEN_KEY, token);
  return token;
}

// Optional helpers to manage token manually
export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function logout() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// --- Recipes endpoints ---

// GET /recipes?page=1&limit=10 (requires auth)
// Returns: { data: [...recipes], page, limit, total }
export async function getRecipes({ page = 1, limit = 10 } = {}) {
  if (USE_MOCK_API) return mockGetRecipes({ page, limit });

  const query = `?page=${page}&limit=${limit}`;
  const data = await request(`/recipes${query}`, {
    method: "GET",
    auth: true,
  });
  return data;
}

// DELETE /recipes/{recipe_id} (requires auth)
export async function deleteRecipe(recipeId) {
  if (USE_MOCK_API) return mockDeleteRecipe(recipeId);

  await request(`/recipes/${recipeId}`, {
    method: "DELETE",
    auth: true,
  });
  // Backend returns 204 No Content, so nothing to return
}

// --- Optional: simple health check for "/" ---
export async function ping() {
  if (USE_MOCK_API) return mockPing();

  // GET /
  const data = await request("/", { method: "GET" });
  // { message: "Hello world" }
  return data;
}
