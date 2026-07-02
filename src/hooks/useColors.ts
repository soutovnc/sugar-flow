import { useColorScheme } from "react-native";

import colors from "@/constants/theme";

export function useColors() {
  const scheme = useColorScheme()
  const palette = 
    scheme === "dark" && "dark" in colors 
      ? (colors as Record<string, typeof colors.light>).dark
      : colors.light;
    return { ...palette }
}