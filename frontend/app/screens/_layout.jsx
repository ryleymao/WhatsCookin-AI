import { StatusBar } from 'expo-status-bar';
import { Stack } from "expo-router";
import React from 'react';

export default function RootLayout() {
    return (
        <React.Fragment>
        <StatusBar style="auto" />
            <Stack>
                {/* Home Screen */}
                <Stack.Screen name="HomeScreen" options={{ title: "Home" }} />

                {/* Test Screen */}
                <Stack.Screen name="CameraScreen" options={{ title: "Camera Screen"}} />

                {/* Login Screen */}
                <Stack.Screen name="LoginScreen" options={{ title: "Login" }} />

                {/* Register Screen */}
                <Stack.Screen name="RegisterScreen" options={{ title: "Register" }} />

            </Stack>
        </React.Fragment>
    );
}