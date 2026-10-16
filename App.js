import { useEffect, useRef, useState } from 'react';
import { Button, FlatList, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { addDoc, collection, deleteDoc, doc, getDocsFromServer, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, billederAktiveret } from './firebase';
import { hentGaest } from './gaesteLogin';
import NoteKort from './NoteKort';
import * as ImagePicker from 'expo-image-picker';
import { billedFejl, sletBillede, uploadBillede } from './billeder';

export default function App() {
  const [tekst, setTekst] = useState('');
  const [noter, setNoter] = useState([]);
  const [bruger, setBruger] = useState(null);
  const [retId, setRetId] = useState(null);
  const [valgtBillede, setValgtBillede] = useState(null);
  const [valgtSted, setValgtSted] = useState(null);
  const [kortNote, setKortNote] = useState(null);
  const [fejl, setFejl] = useState('');
  const [gemmer, setGemmer] = useState(false);
  const [status, setStatus] = useState('Henter noter…');
  const handlingIGang = useRef(false);
  const liste = useRef(null);

  // READ: Hent telefonens noter fra Firebase.
  async function hentNoter() {
    if (!bruger) return;
    try {
      const snapshot = await getDocsFromServer(collection(db, 'brugere', bruger.uid, 'noter'));
      setNoter(snapshot.docs.map((note) => ({ id: note.id, ...note.data() })));
      setStatus('Forbundet til Firebase');
      setFejl('');
    } catch (error) {
      setStatus('Kunne ikke hente noter');
      setFejl(billedFejl(error));
    }
  }

  useEffect(() => {
    let aktiv = true;
    let stop;
    async function start() {
      try {
        const gaest = await hentGaest();
        if (!aktiv) return;
        setBruger(gaest);
        stop = onSnapshot(collection(db, 'brugere', gaest.uid, 'noter'),
          { includeMetadataChanges: true }, (snapshot) => {
            if (!aktiv) return;
            setNoter(snapshot.docs.map((note) => ({ id: note.id, ...note.data() })));
            setStatus(snapshot.metadata.hasPendingWrites ? 'Gemmer i Firebase…'
              : snapshot.metadata.fromCache ? 'Forbinder til Firebase…' : 'Forbundet til Firebase');
          }, (error) => {
            if (!aktiv) return;
            setStatus('Kunne ikke hente noter');
            setFejl(billedFejl(error));
          });
      } catch (error) {
        if (aktiv) {
          setStatus('Kunne ikke forbinde til Firebase');
          setFejl(billedFejl(error));
        }
      }
    }
    start();
    return () => { aktiv = false; stop?.(); };
  }, []);

  // Åbn billedbiblioteket. Billedet uploades først, når du trykker Ny note.
  async function vaelgBillede() {
    setFejl('');
    try {
      const resultat = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], quality: 0.7,
      });
      if (!resultat.canceled) setValgtBillede(resultat.assets[0]);
    } catch (error) {
      setFejl('Kunne ikke vælge et billede. ' + error.message);
    }
  }

  // Tag et nyt billede med telefonens kamera.
  async function tagBillede() {
    setFejl('');
    try {
      const tilladelse = await ImagePicker.requestCameraPermissionsAsync();
      if (!tilladelse.granted) {
        setFejl('Kameraadgang blev ikke givet. Tillad kameraet i telefonens indstillinger.');
        return;
      }
      const resultat = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.7,
      });
      if (!resultat.canceled) setValgtBillede(resultat.assets[0]);
    } catch (error) {
      setFejl('Kunne ikke åbne kameraet. ' + error.message);
    }
  }

  // CREATE / UPDATE: Opret en note, eller gem den note, du har valgt at rette.
  async function gemNote() {
    if (!bruger || !tekst.trim() || handlingIGang.current) return;
    handlingIGang.current = true;
    setGemmer(true);
    setFejl('');
    let upload = null;
    try {
      const noteData = {
        tekst: tekst.trim(),
        latitude: valgtSted?.latitude ?? null,
        longitude: valgtSted?.longitude ?? null,
      };
      if (retId) {
        // Når vi retter teksten, beholder noten sit eksisterende billede.
        await updateDoc(doc(db, 'brugere', bruger.uid, 'noter', retId), noteData);
      } else {
        if (valgtBillede) upload = await uploadBillede(valgtBillede, bruger.uid);
        await addDoc(collection(db, 'brugere', bruger.uid, 'noter'), { ...noteData, ...upload });
      }
      setTekst('');
      setRetId(null);
      setValgtBillede(null);
      setValgtSted(null);
      setKortNote(null);
    } catch (error) {
      let besked = billedFejl(error);
      if (upload) {
        try { await sletBillede(upload.billedeSti, bruger.uid); }
        catch { besked += ' En upload blev liggende i Storage: ' + upload.billedeSti; }
      }
      setFejl(besked);
    } finally {
      handlingIGang.current = false;
      setGemmer(false);
    }
  }

  // DELETE: Slet noten, og slet derefter dens billede fra Storage.
  async function sletNote(note) {
    if (!bruger || handlingIGang.current) return;
    handlingIGang.current = true;
    setGemmer(true);
    setFejl('');
    try {
      await deleteDoc(doc(db, 'brugere', bruger.uid, 'noter', note.id));
      if (retId === note.id) { setRetId(null); setTekst(''); setValgtSted(null); }
      if (kortNote?.id === note.id) setKortNote(null);
      try { await sletBillede(note.billedeSti, bruger.uid); }
      catch { setFejl('Noten er slettet, men billedfilen kunne ikke slettes: ' + note.billedeSti); }
    } catch (error) {
      setFejl('Kunne ikke slette. ' + billedFejl(error));
    } finally {
      handlingIGang.current = false;
      setGemmer(false);
    }
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.side}>
        <KeyboardAvoidingView style={styles.indhold} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <FlatList ref={liste} style={styles.liste} data={noter} keyExtractor={(note) => note.id} keyboardShouldPersistTaps="handled"
            ListHeaderComponent={<View>
          <Text style={styles.titel}>Appudvikling – Noter</Text>
          {status !== 'Forbundet til Firebase' && <Text style={styles.status}>{status}</Text>}
          <Text style={styles.listeTitel}>Steder til dine noter</Text>
          <Text style={styles.status}>Hold fingeren på kortet for at vælge et sted til noten.</Text>
          <NoteKort noter={noter} valgtSted={valgtSted} disabled={gemmer}
            onVaelgSted={setValgtSted} onVaelgNote={setKortNote} />
          {valgtSted && <View style={styles.billedvalg}>
            <Text>Valgt sted: {valgtSted.latitude.toFixed(4)}, {valgtSted.longitude.toFixed(4)}</Text>
            <Button title="Fjern sted" onPress={() => setValgtSted(null)} disabled={gemmer} />
          </View>}
          {kortNote && <View style={styles.note}>
            <Text style={styles.notetekst}>{kortNote.tekst}</Text>
            {kortNote.billedeUrl && <Image source={{ uri: kortNote.billedeUrl }} style={styles.billede} resizeMode="contain" />}
            <Button title="Luk valgt note" onPress={() => setKortNote(null)} />
          </View>}
          <TextInput style={styles.input} placeholder="Skriv din note her…" accessibilityLabel="Notens tekst"
            value={tekst} onChangeText={setTekst} multiline maxLength={2000} editable={!gemmer} />
          {!retId && billederAktiveret && <View style={styles.billedvalg}>
            <Button title="Vælg billede" onPress={vaelgBillede} disabled={gemmer} />
            <Button title="Tag billede med kamera" onPress={tagBillede} disabled={gemmer} />
            {valgtBillede && <>
              <Image source={{ uri: valgtBillede.uri }} style={styles.billede} resizeMode="contain" accessibilityLabel="Valgt billede" />
              <Button title="Fjern valgt billede" onPress={() => setValgtBillede(null)} disabled={gemmer} />
            </>}
          </View>}
          <Button title={gemmer ? 'Vent…' : retId ? 'Gem ændring' : 'Ny note'} onPress={gemNote} disabled={!bruger || gemmer || !tekst.trim()} />
          {retId && <Button title="Annuller rettelse" disabled={gemmer} onPress={() => { setRetId(null); setTekst(''); setValgtSted(null); }} />}
          {!!fejl && <Text accessibilityRole="alert" style={styles.fejl}>{fejl}</Text>}
          <Text style={styles.listeTitel}>Mine noter</Text>
          <Button title="Opdater noter" onPress={hentNoter} disabled={!bruger || gemmer} />
          </View>}
            ListEmptyComponent={<Text style={styles.status}>Ingen noter at vise endnu.</Text>}
            renderItem={({ item }) => (
              <View style={styles.note}>
                <Text style={styles.notetekst}>{item.tekst}</Text>
                {Number.isFinite(item.latitude) && Number.isFinite(item.longitude) && <Text style={styles.status}>
                  Sted: {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                </Text>}
                {item.billedeUrl && <Image source={{ uri: item.billedeUrl }} style={styles.billede}
                  resizeMode="contain" accessibilityLabel="Notens billede" />}
                <View style={styles.knapper}>
                  <Button title="Ret" disabled={gemmer} onPress={() => {
                    setRetId(item.id); setTekst(item.tekst); setValgtBillede(null); setFejl('');
                    setValgtSted(Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
                      ? { latitude: item.latitude, longitude: item.longitude } : null);
                    liste.current?.scrollToOffset({ offset: 0, animated: true });
                  }} />
                  <Button title="Slet" color="#b91c1c" disabled={gemmer} onPress={() => sletNote(item)} />
                </View>
              </View>
            )} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  side: { flex: 1, backgroundColor: '#f5f5f5' },
  indhold: { flex: 1, padding: 20, width: '100%', maxWidth: 600, alignSelf: 'center' },
  titel: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  status: { color: '#555', marginBottom: 16 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#999', borderRadius: 8, padding: 12, minHeight: 90, maxHeight: 160, textAlignVertical: 'top', marginBottom: 12, fontSize: 16 },
  liste: { flex: 1 },
  listeTitel: { fontSize: 18, fontWeight: 'bold', marginVertical: 20 },
  billedvalg: { gap: 10, marginBottom: 12 },
  billede: { width: '100%', height: 180, marginBottom: 12, borderRadius: 8, backgroundColor: '#eee' },
  note: { backgroundColor: 'white', padding: 14, borderRadius: 8, marginBottom: 12 },
  notetekst: { fontSize: 17, lineHeight: 24, marginBottom: 10 },
  knapper: { flexDirection: 'row', gap: 16 },
  fejl: { color: '#b91c1c', marginTop: 12 },
});
