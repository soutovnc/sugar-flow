import AppTabs from '@/components/app-tabs';
import { AppProvider } from '@/context/AppContext';
import { useAuth } from '@clerk/expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Redirect, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';

const queryClient = new QueryClient();

export default function AppLayout() {
  const colorScheme = useColorScheme();
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;

  return (
    <QueryClientProvider client={queryClient}>
      <KeyboardProvider>
        <AppProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AppTabs />
          </ThemeProvider>
        </AppProvider>
      </KeyboardProvider>
    </QueryClientProvider>
  );
}
