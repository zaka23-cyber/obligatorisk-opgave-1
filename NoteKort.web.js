import { Text, View } from 'react-native';

// react-native-maps er til iOS og Android. Resten af notesbogen virker på web.
export default function NoteKort() {
  return <View style={{ padding: 16, backgroundColor: '#eee', marginBottom: 12 }}>
    <Text>Åbn appen i Expo Go på din telefon for at bruge kortet og vælge et sted.</Text>
  </View>;
}
