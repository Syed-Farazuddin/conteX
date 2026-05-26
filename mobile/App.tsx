import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import {
  fetchGenerationStyles,
  generateImage,
  type GenerationResult,
  type GenerationStyle,
} from "./src/api";

export default function App() {
  const [styles, setStyles] = useState<GenerationStyle[]>([]);
  const [apiReady, setApiReady] = useState(false);
  const [styleId, setStyleId] = useState("natural");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGenerationStyles()
      .then(({ configured, styles: list }) => {
        setApiReady(configured);
        setStyles(list);
        if (list.length) setStyleId(list[0]!.id);
      })
      .catch(() => setApiReady(false));
  }, []);

  const pickImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError("Photo library permission is required.");
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      base64: true,
    });

    if (picked.canceled || !picked.assets[0]) return;

    const asset = picked.assets[0];
    setImageUri(asset.uri);
    setImageBase64(
      asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : null,
    );
    setResult(null);
    setError(null);
  }, []);

  const onGenerate = useCallback(async () => {
    if (!imageBase64) {
      setError("Pick a photo first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await generateImage(
        imageBase64,
        styleId,
        customPrompt || undefined,
      );
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }, [imageBase64, styleId, customPrompt]);

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.title}>ConteX</Text>
        <Text style={s.subtitle}>AI photo generation</Text>

        {!apiReady && (
          <Text style={s.warn}>
            Backend not ready — set REPLICATE_API_TOKEN and start the API. On a
            real device, set EXPO_PUBLIC_API_URL to your computer&apos;s LAN IP.
          </Text>
        )}

        <Text style={s.sectionLabel}>Style</Text>
        <View style={s.styleGrid}>
          {styles.map((style) => {
            const selected = style.id === styleId;
            return (
              <Pressable
                key={style.id}
                onPress={() => setStyleId(style.id)}
                style={[s.styleCard, selected && s.styleCardSelected]}
              >
                <Text style={s.styleEmoji}>{style.emoji}</Text>
                <Text style={s.styleLabel}>{style.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          style={s.promptInput}
          placeholder="Extra prompt (optional)"
          placeholderTextColor="#666"
          value={customPrompt}
          onChangeText={setCustomPrompt}
          multiline
        />

        <Pressable style={s.pickButton} onPress={pickImage}>
          <Text style={s.pickButtonText}>
            {imageUri ? "Change photo" : "Choose photo"}
          </Text>
        </Pressable>

        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={s.preview}
            resizeMode="contain"
          />
        )}

        <Pressable
          style={[s.generateButton, (!apiReady || loading) && s.disabled]}
          onPress={onGenerate}
          disabled={!apiReady || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.generateButtonText}>Generate</Text>
          )}
        </Pressable>

        {error && <Text style={s.error}>{error}</Text>}

        {result?.outputUrl && (
          <View style={s.resultBlock}>
            <Text style={s.sectionLabel}>Result — {result.styleLabel}</Text>
            <Image
              source={{ uri: result.outputUrl }}
              style={s.resultImage}
              resizeMode="contain"
            />
            <Text style={s.promptPreview} numberOfLines={4}>
              {result.prompt}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#07060b" },
  scroll: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "700", color: "#fff" },
  subtitle: { marginTop: 4, fontSize: 14, color: "#888" },
  warn: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(245,158,11,0.15)",
    color: "#fcd34d",
    fontSize: 13,
    lineHeight: 18,
  },
  sectionLabel: {
    marginTop: 24,
    marginBottom: 10,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    color: "#666",
    textTransform: "uppercase",
  },
  styleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  styleCard: {
    width: "47%",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  styleCardSelected: {
    borderColor: "rgba(167,139,250,0.5)",
    backgroundColor: "rgba(139,92,246,0.15)",
  },
  styleEmoji: { fontSize: 22 },
  styleLabel: { marginTop: 4, fontSize: 14, fontWeight: "600", color: "#fff" },
  promptInput: {
    marginTop: 16,
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 12,
    color: "#fff",
    fontSize: 14,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  pickButton: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
  },
  pickButtonText: { color: "#ccc", fontSize: 15, fontWeight: "500" },
  preview: {
    marginTop: 16,
    width: "100%",
    height: 220,
    borderRadius: 14,
    backgroundColor: "#111",
  },
  generateButton: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#8b5cf6",
    alignItems: "center",
  },
  generateButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  disabled: { opacity: 0.45 },
  error: { marginTop: 12, color: "#f87171", fontSize: 14 },
  resultBlock: { marginTop: 24 },
  resultImage: {
    width: "100%",
    height: 320,
    borderRadius: 14,
    backgroundColor: "#111",
  },
  promptPreview: { marginTop: 10, fontSize: 12, color: "#777", lineHeight: 17 },
});
