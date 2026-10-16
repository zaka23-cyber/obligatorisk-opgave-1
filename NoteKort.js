import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function NoteKort({ noter, valgtSted, onVaelgSted, onVaelgNote, disabled }) {
  return (
    <MapView style={styles.kort}
      initialRegion={{ latitude: 55.6761, longitude: 12.5683, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
      onLongPress={(event) => { if (!disabled) onVaelgSted(event.nativeEvent.coordinate); }}>
      {noter.filter((note) => Number.isFinite(note.latitude) && Number.isFinite(note.longitude)).map((note) => (
        <Marker key={note.id} coordinate={{ latitude: note.latitude, longitude: note.longitude }}
          title={note.tekst} onPress={() => onVaelgNote(note)} />
      ))}
      {valgtSted && <Marker coordinate={valgtSted} pinColor="blue" title="Valgt sted" />}
    </MapView>
  );
}

const styles = StyleSheet.create({ kort: { width: '100%', height: 260, marginBottom: 12 } });
