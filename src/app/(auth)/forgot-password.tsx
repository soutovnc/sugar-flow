import { useSignIn } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { type Href, Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn, errors, fetchStatus } = useSignIn();
  const [emailAddress, setEmailAddress] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const isSubmitting = fetchStatus === "fetching";
  const needsNewPassword = signIn.status === "needs_new_password";

  const sendCode = async () => {
    setLocalError(null);
    const { error: createError } = await signIn.create({ identifier: emailAddress.trim() });
    if (createError) return;

    const { error } = await signIn.resetPasswordEmailCode.sendCode();
    if (!error) setCodeSent(true);
  };

  const verifyCode = async () => {
    setLocalError(null);
    await signIn.resetPasswordEmailCode.verifyCode({ code: code.trim() });
  };

  const submitNewPassword = async () => {
    setLocalError(null);
    if (password !== confirmPassword) {
      setLocalError("As senhas não coincidem.");
      return;
    }

    const { error } = await signIn.resetPasswordEmailCode.submitPassword({
      password,
      signOutOfOtherSessions: true,
    });
    if (error || signIn.status !== "complete") return;

    await signIn.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) return;
        router.replace(decorateUrl("/") as Href);
      },
    });
  };

  const errorMessage = localError ?? errors?.global?.[0]?.message;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top + 40 },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
          <Feather name="key" size={30} color={colors.primaryForeground} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Recuperar acesso</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {needsNewPassword
            ? "Defina uma nova senha para sua conta."
            : codeSent
              ? `Digite o código enviado para ${emailAddress}.`
              : "Informe seu e-mail para receber um código de recuperação."}
        </Text>
      </View>

      <View style={styles.form}>
        {!codeSent && (
          <>
            <Text style={[styles.label, { color: colors.foreground }]}>E-mail</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="voce@exemplo.com"
              placeholderTextColor={colors.mutedForeground}
              value={emailAddress}
              onChangeText={setEmailAddress}
            />
            {errors?.fields?.identifier && <Text style={[styles.error, { color: colors.destructive }]}>{errors.fields.identifier.message}</Text>}
            <ActionButton label="Enviar código" onPress={sendCode} disabled={!emailAddress || isSubmitting} loading={isSubmitting} colors={colors} />
          </>
        )}

        {codeSent && !needsNewPassword && (
          <>
            <Text style={[styles.label, { color: colors.foreground }]}>Código de recuperação</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              autoCapitalize="none"
              keyboardType="numeric"
              placeholder="000000"
              placeholderTextColor={colors.mutedForeground}
              value={code}
              onChangeText={setCode}
            />
            {errors?.fields?.code && <Text style={[styles.error, { color: colors.destructive }]}>{errors.fields.code.message}</Text>}
            <ActionButton label="Verificar código" onPress={verifyCode} disabled={!code || isSubmitting} loading={isSubmitting} colors={colors} />
            <Pressable style={styles.resend} onPress={sendCode} disabled={isSubmitting}>
              <Text style={[styles.link, { color: colors.primary }]}>Reenviar código</Text>
            </Pressable>
          </>
        )}

        {needsNewPassword && (
          <>
            <Text style={[styles.label, { color: colors.foreground }]}>Nova senha</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              secureTextEntry
              placeholder="Crie uma nova senha"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
            />
            <Text style={[styles.label, { color: colors.foreground }]}>Confirmar nova senha</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              secureTextEntry
              placeholder="Repita a nova senha"
              placeholderTextColor={colors.mutedForeground}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            {errors?.fields?.password && <Text style={[styles.error, { color: colors.destructive }]}>{errors.fields.password.message}</Text>}
            <ActionButton label="Atualizar senha" onPress={submitNewPassword} disabled={!password || !confirmPassword || isSubmitting} loading={isSubmitting} colors={colors} />
          </>
        )}

        {errorMessage && <Text style={[styles.error, styles.globalError, { color: colors.destructive }]}>{errorMessage}</Text>}
        <View style={styles.linkRow}>
          <Text style={{ color: colors.mutedForeground }}>Lembrou sua senha? </Text>
          <Link href="/(auth)/sign-in"><Text style={[styles.link, { color: colors.primary }]}>Entrar</Text></Link>
        </View>
      </View>
    </View>
  );
}

function ActionButton({ label, onPress, disabled, loading, colors }: { label: string; onPress: () => void; disabled: boolean; loading: boolean; colors: ReturnType<typeof useColors> }) {
  return (
    <Pressable style={({ pressed }) => [styles.button, { backgroundColor: colors.primary }, disabled && { opacity: 0.5 }, pressed && { opacity: 0.85 }]} onPress={onPress} disabled={disabled}>
      {loading ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  header: { alignItems: "center", marginBottom: 32 },
  logoCircle: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  form: { gap: 4 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 6, marginTop: 12 },
  input: { height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 15, fontFamily: "Inter_400Regular" },
  error: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
  globalError: { textAlign: "center", marginTop: 16 },
  button: { height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 24 },
  buttonText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  resend: { alignItems: "center", marginTop: 20 },
  linkRow: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  link: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
