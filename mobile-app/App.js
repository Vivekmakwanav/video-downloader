import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Download, Search, AlertCircle, Cloud, Play } from 'lucide-react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';

const API_URL = 'https://api.vidnexa.space';

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoData, setVideoData] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('bestaudio');
  const [downloading, setDownloading] = useState(false);

  const handleAnalyze = async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    setVideoData(null);
    try {
      const response = await axios.post(`${API_URL}/api/analyze`, { url });
      setVideoData(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze video. Please check the URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!videoData) return;
    setDownloading(true);
    try {
      const downloadUrl = `${API_URL}/api/download?url=${encodeURIComponent(url)}&format_id=${selectedFormat}`;
      // In a real app, we'd use expo-file-system to download directly to device,
      // but for simplicity and cross-platform compatibility, we can just open the browser
      // to let the device handle the file download natively.
      await Linking.openURL(downloadUrl);
    } catch (err) {
      setError('Failed to initiate download.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.iconBox}>
                <Cloud color="#fff" size={24} />
              </View>
              <Text style={styles.logoText}>VIDNEXA</Text>
            </View>
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.title}>Universal <Text style={styles.titleHighlight}>Video</Text> Downloader</Text>
            <Text style={styles.subtitle}>Extract high-quality media natively on your phone.</Text>
          </View>

          {/* Input Box */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Search color="#94a3b8" size={20} style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="https://youtu.be/..."
                placeholderTextColor="#64748b"
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <TouchableOpacity 
              style={[styles.analyzeButton, loading && styles.analyzeButtonDisabled]} 
              onPress={handleAnalyze}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.analyzeButtonText}>Analyze</Text>}
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorContainer}>
              <AlertCircle color="#ef4444" size={20} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Results */}
          {videoData && (
            <View style={styles.resultContainer}>
              <View style={styles.imageWrapper}>
                {videoData.thumbnail ? (
                  <Image source={{ uri: videoData.thumbnail }} style={styles.thumbnail} />
                ) : (
                  <View style={styles.thumbnailPlaceholder}>
                    <Play color="#64748b" size={40} />
                  </View>
                )}
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{Math.floor(videoData.duration / 60)}:{String(videoData.duration % 60).padStart(2, '0')}</Text>
                </View>
              </View>

              <View style={styles.infoContainer}>
                <Text style={styles.videoTitle} numberOfLines={2}>{videoData.title}</Text>
                <Text style={styles.platformText}>{videoData.platform.toUpperCase()}</Text>
                
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedFormat}
                    onValueChange={(itemValue) => setSelectedFormat(itemValue)}
                    style={styles.picker}
                    dropdownIconColor="#fff"
                    themeVariant="dark"
                  >
                    <Picker.Item label="Audio Only (MP3)" value="bestaudio" color="#fff" />
                    {videoData.formats.map((f) => (
                      <Picker.Item 
                        key={f.format_id} 
                        label={`${f.resolution} - ${f.ext.toUpperCase()}`} 
                        value={f.format_id} 
                        color="#fff" 
                      />
                    ))}
                  </Picker>
                </View>

                <TouchableOpacity 
                  style={styles.downloadButton} 
                  onPress={handleDownload}
                  disabled={downloading}
                >
                  <Download color="#fff" size={20} style={{ marginRight: 8 }} />
                  <Text style={styles.downloadButtonText}>
                    {downloading ? 'Starting...' : 'Download File'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    backgroundColor: '#3b82f6',
    padding: 8,
    borderRadius: 12,
    marginRight: 10,
  },
  logoText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  titleHighlight: {
    color: '#38bdf8',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: 55,
  },
  analyzeButton: {
    backgroundColor: '#6366f1',
    height: 55,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  analyzeButtonDisabled: {
    opacity: 0.7,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#ef4444',
    marginLeft: 10,
    flex: 1,
  },
  resultContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    overflow: 'hidden',
  },
  imageWrapper: {
    position: 'relative',
    height: 200,
    width: '100%',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: 20,
  },
  videoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  platformText: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 20,
  },
  pickerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  picker: {
    color: '#fff',
    height: 55,
  },
  downloadButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    height: 55,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
