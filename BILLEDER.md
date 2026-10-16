# Billeder og kamera

Kortopgaven bruger noter og markører gemt i Firestore.

Koden til billedvalg, kamera og upload er bevaret, men billedknapperne er skjult, fordi projektet er på Spark-planen uden Firebase Storage.

Hvis du senere vælger at sætte Storage op, skal det ske i samme Firebase-projekt `min-nye-app`. Publicér `storage.rules`, og sæt `billederAktiveret = true` i `firebase.js`. Appen vil da gemme billeder under `notebilleder/{gæstens uid}/{billedets id}.jpg` og gemme filsti og link sammen med noten. Den accepterer JPG, PNG, WebP og GIF på højst 5 MB.

Læs opsætning og testforløb i `README.md`.
