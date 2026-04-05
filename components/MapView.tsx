import { Platform, View, StyleSheet } from 'react-native'
import { Colors } from '../constants/Colors'

const C = Colors.dark

type Props = {
  /** Coordenada do pin (se existir) */
  latitude?: number | null
  longitude?: number | null
  /** Altura do mapa */
  height?: number
  /** Se true, permite tocar no mapa para mover o pin */
  editable?: boolean
  /** Callback quando usuario toca no mapa para definir posicao */
  onLocationSelect?: (lat: number, lng: number) => void
}

function generateHTML(lat: number | null, lng: number | null, editable: boolean): string {
  const centerLat = lat ?? -34.6037
  const centerLng = lng ?? -58.3816
  const hasPin = lat != null && lng != null
  const zoom = hasPin ? 14 : 3

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    #map { width: 100%; height: 100vh; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([${centerLat}, ${centerLng}], ${zoom});
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OSM'
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    var marker = ${hasPin ? `L.marker([${centerLat}, ${centerLng}]).addTo(map);` : 'null;'}

    ${editable ? `
    map.on('click', function(e) {
      var lat = e.latlng.lat;
      var lng = e.latlng.lng;
      if (marker) { marker.setLatLng(e.latlng); }
      else { marker = L.marker(e.latlng).addTo(map); }
      window.ReactNativeWebView.postMessage(JSON.stringify({ lat: lat, lng: lng }));
    });
    ` : ''}
  </script>
</body>
</html>`
}

function MapViewNative({ latitude, longitude, height = 200, editable = false, onLocationSelect }: Props) {
  const WebView = require('react-native-webview').default
  const html = generateHTML(latitude ?? null, longitude ?? null, editable)

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        javaScriptEnabled
        originWhitelist={['*']}
        onMessage={(event: any) => {
          if (onLocationSelect) {
            try {
              const data = JSON.parse(event.nativeEvent.data)
              if (data.lat && data.lng) onLocationSelect(data.lat, data.lng)
            } catch {}
          }
        }}
      />
    </View>
  )
}

function MapViewWeb({ latitude, longitude, height = 200, editable = false, onLocationSelect }: Props) {
  const React = require('react')
  const { MapContainer, TileLayer, Marker, useMapEvents } = require('react-leaflet')

  function ClickHandler() {
    useMapEvents({
      click(e: any) {
        if (editable && onLocationSelect) {
          onLocationSelect(e.latlng.lat, e.latlng.lng)
        }
      },
    })
    return null
  }

  const centerLat = latitude ?? -34.6037
  const centerLng = longitude ?? -58.3816
  const hasPin = latitude != null && longitude != null

  return (
    <View style={[styles.container, { height }]}>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={hasPin ? 14 : 3}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom
      >
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OSM" />
        {hasPin && <Marker position={[latitude!, longitude!]} />}
        {editable && <ClickHandler />}
      </MapContainer>
    </View>
  )
}

export default function MapView(props: Props) {
  if (Platform.OS === 'web') {
    return <MapViewWeb {...props} />
  }
  return <MapViewNative {...props} />
}

const styles = StyleSheet.create({
  container: { borderRadius: 12, overflow: 'hidden', backgroundColor: C.surfaceHigh },
  webview: { flex: 1 },
})
