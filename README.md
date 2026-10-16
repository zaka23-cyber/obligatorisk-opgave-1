# Obligatorisk opgave 1

En noteapp lavet med React Native og Expo. En note kan få en placering på kortet, som gemmes sammen med teksten i Firebase Firestore.

## Funktioner

- Vise et kort.
- Vælge et sted ved at holde fingeren på kortet.
- Gemme notens tekst og koordinater i Firestore.
- Hente gemte noter og vise deres markører på kortet.
- Rette og slette noter.

Det dækker punkt 1, 2, 3 og 4 i opgaven.

## Kør appen

```sh
npm install
npm start
```

Åbn appen i Expo Go på telefonen ved at scanne QR-koden. Telefon og computer skal være på samme Wi-Fi og bruge samme Expo-konto. Kortet virker på iOS og Android.

## Firebase

Projektet bruger `min-nye-app`. Telefonen logger automatisk ind som gæst og husker gæsten mellem genstarter. Hver gæst har sine egne noter under `brugere/{uid}/noter`.

Forbindelsen ligger i `firebase.js`, og adgangsreglerne ligger i `firestore.rules`. Billeder og kamera er ikke aktiveret i denne aflevering.

## Afprøvning

Hold fingeren på kortet, skriv en note, og tryk **Ny note**. Genåbn appen, og kontrollér, at noten og markøren stadig vises. Prøv også at rette og slette noten.
