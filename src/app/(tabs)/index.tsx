import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ScanResultView } from '@/components/ScanResultView';
import { saveScannedItem } from '@/db/saveScan';
import { preparePhoto, requestScan, type PreparedPhoto } from '@/scan/client';
import type { ScanResponse } from '@/scan/schema';
import { useColors } from '@/theme/colors';

type Source = 'camera' | 'library';

async function pickPhoto(source: Source): Promise<string | null> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera access needed', 'Allow camera access in Settings to scan a piece.');
      return null;
    }
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  return result.canceled ? null : result.assets[0].uri;
}

export default function ScanScreen() {
  const c = useColors();
  const db = useSQLiteContext();
  const router = useRouter();
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null);
  const [label, setLabel] = useState<PreparedPhoto | null>(null);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [busy, setBusy] = useState<'preparing' | 'scanning' | 'deep' | 'saving' | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setPhoto(null);
    setLabel(null);
    setResult(null);
    setError(null);
  }

  async function choose(kind: 'main' | 'label', source: Source) {
    setError(null);
    const uri = await pickPhoto(source);
    if (!uri) return;
    setBusy('preparing');
    try {
      const prepared = await preparePhoto(uri);
      if (kind === 'main') setPhoto(prepared);
      else setLabel(prepared);
    } catch {
      setError('Could not read that photo. Try another one.');
    } finally {
      setBusy(null);
    }
  }

  async function scan() {
    if (!photo) return;
    setBusy('scanning');
    setError(null);
    try {
      setResult(await requestScan(photo, label ?? undefined));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The scan failed. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  /** Re-scan the same photos with the slower, web-searching Deep check. Keeps the quick result on failure. */
  async function deepCheck() {
    if (!photo) return;
    setBusy('deep');
    setError(null);
    try {
      setResult(await requestScan(photo, label ?? undefined, 'deep'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The deep check failed. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  async function save(status: 'collection' | 'wishlist', tagPrice: number | null) {
    if (!result || !photo) return;
    setBusy('saving');
    try {
      await saveScannedItem(db, result, status, tagPrice, { main: photo.uri, label: label?.uri });
      reset();
      router.navigate(status === 'collection' ? '/collection' : '/wishlist');
    } catch {
      setError('Could not save this piece. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      {photo ? (
        <View style={styles.photos}>
          <Image
            source={{ uri: photo.uri }}
            style={styles.photo}
            accessibilityLabel="Photo of the piece"
          />
          {label ? (
            <Image source={{ uri: label.uri }} style={styles.labelPhoto} accessibilityLabel="Photo of the label" />
          ) : null}
        </View>
      ) : (
        <View style={styles.intro}>
          <Text accessibilityRole="header" style={[styles.title, { color: c.text }]}>
            Scan a piece
          </Text>
          <Text style={[styles.body, { color: c.muted }]}>
            Take a photo of a piece you like. You&apos;ll see its likely era, fair price ranges and
            what to check before you buy.
          </Text>
        </View>
      )}

      {error ? (
        <Text accessibilityRole="alert" style={[styles.body, { color: c.accent }]}>
          {error}
        </Text>
      ) : null}

      {busy === 'scanning' || busy === 'preparing' ? (
        <View style={styles.busy} accessibilityLiveRegion="polite">
          <ActivityIndicator color={c.accent} />
          <Text style={[styles.body, { color: c.muted }]}>
            {busy === 'scanning' ? 'Looking at your piece…' : 'Preparing photo…'}
          </Text>
        </View>
      ) : result ? (
        <ScanResultView
          result={result}
          saving={busy === 'saving' || busy === 'deep'}
          onSave={save}
          onReset={reset}
          onDeepCheck={deepCheck}
          deepChecking={busy === 'deep'}
        />
      ) : photo ? (
        <View style={styles.actions}>
          <Button label="Scan" onPress={scan} />
          {!label ? (
            <Button
              label="Add a label photo (optional)"
              variant="secondary"
              accessibilityHint="A photo of the tag helps identify the brand and era"
              onPress={() => choose('label', 'camera')}
            />
          ) : null}
          <Button label="Start over" variant="secondary" onPress={reset} />
        </View>
      ) : (
        <View style={styles.actions}>
          <Button label="Take a photo" onPress={() => choose('main', 'camera')} />
          <Button label="Choose from photos" variant="secondary" onPress={() => choose('main', 'library')} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  intro: { gap: 8, paddingTop: 24 },
  title: { fontSize: 26, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 22 },
  photos: { flexDirection: 'row', gap: 8 },
  photo: { flex: 3, height: 220, borderRadius: 12 },
  labelPhoto: { flex: 1, height: 220, borderRadius: 12 },
  actions: { gap: 12 },
  busy: { alignItems: 'center', gap: 8, paddingVertical: 24 },
});
