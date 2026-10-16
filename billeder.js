import { File } from 'expo-file-system';
import { collection, doc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage, billederAktiveret } from './firebase';

const typer = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
const maxBytes = 5 * 1024 * 1024;

// Et lokalt billede bliver til en fil i Storage og to tekstfelter til Firestore.
export async function uploadBillede(billede, uid) {
  if (!billederAktiveret) throw new Error('Billedlageret er ikke aktiveret.');
  if (!uid) throw new Error('Gæsteadgang mangler.');
  const type = billede.mimeType || billede.file?.type;
  if (!typer[type]) throw new Error('Vælg et JPG-, PNG-, WebP- eller GIF-billede.');
  if (billede.fileSize > maxBytes) throw new Error('Billedet må højst fylde 5 MB.');

  // Browseren giver os en File. På mobilen læser Expo den lokale fil.
  const buffer = billede.file
    ? await billede.file.arrayBuffer()
    : await new File(billede.uri).arrayBuffer();
  if (!buffer.byteLength || buffer.byteLength > maxBytes) {
    throw new Error('Billedet skal fylde mellem 1 byte og 5 MB.');
  }

  // Et nyt id sikrer, at to billeder ikke overskriver hinanden.
  const id = doc(collection(db, 'brugere', uid, 'noter')).id;
  const billedeSti = `notebilleder/${uid}/${id}.${typer[type]}`;
  const fil = ref(storage, billedeSti);
  await uploadBytes(fil, new Uint8Array(buffer), { contentType: type });
  try {
    const billedeUrl = await getDownloadURL(fil);
    return { billedeSti, billedeUrl };
  } catch (error) {
    // Hvis linket ikke kan hentes, forsøg at rydde den nye upload op.
    await sletBillede(billedeSti, uid).catch(() => {});
    throw error;
  }
}

export async function sletBillede(sti, uid) {
  if (!sti) return;
  // Slet kun billedfiler fra denne øvelse, aldrig en vilkårlig Storage-sti.
  if (!uid || !sti.startsWith('notebilleder/' + uid + '/')
    || !/^notebilleder\/[A-Za-z0-9]+\/[A-Za-z0-9]{20}\.(jpg|png|webp|gif)$/.test(sti)) {
    throw new Error('Billedets filsti er ikke gyldig.');
  }
  try {
    await deleteObject(ref(storage, sti));
  } catch (error) {
    if (error.code !== 'storage/object-not-found') throw error;
  }
}

export function billedFejl(error) {
  if (error.code === 'auth/admin-restricted-operation' || error.code === 'auth/operation-not-allowed' || error.code === 'auth/configuration-not-found') {
    return 'Slå Anonymous til under Authentication i Firebase-projektet min-nye-app.';
  }
  if (error.code?.startsWith('storage/')) {
    return 'Billedet kunne ikke gemmes. Kontrollér Storage, Blaze-plan og Storage-regler i Firebase. (' + error.code + ')';
  }
  if (error.code === 'permission-denied') {
    return 'Firebase afviste noten. Kontrollér, at firestore.rules er publiceret i min-nye-app.';
  }
  return error.message || 'Noget gik galt. Prøv igen.';
}
