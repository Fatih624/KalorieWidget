# Prüfung der ersten Windows-Version

Stand: 21.10.2026. Geprüft in diesem Windows-Arbeitsplatz, mit der Browser-Vorschau und einer tatsächlich gestarteten Tauri-/WebView2-App.

## Automatisch geprüft

- Acht Tests der Oberfläche/Datenlogik: Portionsumrechnung ohne frühzeitiges Runden, ungültige Mengen, deutsche Mengenangaben und Kilogramm, lokale Tagesgrenzen über Monatswechsel, gültiger Sicherungs-Rundlauf, beschädigte Daten, Ausfiltern fremder Schlüssel-Felder, begrenzte Importwerte.
- Drei Rust-Tests: gültige und ungültige KI-Nährwertantworten sowie festgelegte Anbieter-Endpunkte.
- TypeScript-Prüfung und Produktionsbuild der Oberfläche.
- Nativer Windows-Releasebuild mit NSIS-Installationspaket.
- npm-Abhängigkeitsprüfung ohne gemeldete Schwachstellen.

## In der Bedienoberfläche geprüft

- Favorit hinzufügen, 250 g auf 500 g ändern: Kalorien 158 → 316; Makros ändern sich proportional.
- Eintrag entfernen und rückgängig machen; Daten bleiben nach Neuladen erhalten.
- Zusammenklappen, Öffnen, Zustand nach Neuladen; in der echten Windows-App 168 × 168 logische Pixel für das Kreisfenster und 460 Pixel Breite für das geöffnete Widget geprüft.
- Keine Fehlermeldungen bei Fensterskalierung, Speichern, Vordergrundsteuerung und nativer Fensterform im getesteten Monitoraufbau.
- Windows-Schlüsselspeicher mit einem eindeutig unechten Testwert beschrieben, Status geprüft und Testwert wieder entfernt. Keine Anfrage damit gesendet.
- Echte Open-Food-Facts-Barcodesuche in der Windows-App: `3017620422003`, vollständige Nährwerte, 539 kcal pro 100 g und Umrechnung auf 107,8 kcal für 20 g. Produkt nicht ins Tagebuch übernommen.
- Fehlender KI-Schlüssel führt zu einer verständlichen Meldung und keinem Tagebucheintrag.
- Eigenes Lebensmittel eingetragen, Vor-/Zurückwechsel zwischen Tagen, Wochenansicht geöffnet und Testeintrag wieder entfernt.
- Windows-Konsole bei diesen Abläufen ohne Anwendungsfehler.
- Die fertig gepackte portable Release-EXE wurde aus `output/release` gestartet: Oberfläche unter `http://tauri.localhost`, Einstellungen und Größenwechsel funktionieren ohne Konsolenfehler. Ein zweiter Start beendet die zusätzliche Instanz und fokussiert die vorhandene App.

Die nativen Testeinträge wurden entfernt. Das Windows-Tagebuch startet für die Nutzung leer mit drei bearbeitbaren Standardfavoriten.

## Noch nicht live geprüft

- Kostenpflichtige KI-Essensschätzungen aller drei Anbieter und OpenAI-Spracherkennung: Es steht kein persönlicher API-Schlüssel zur Verfügung; keine kostenpflichtigen Testaufrufe ausgeführt.
- Mikrofonaufnahme mit einem echten Mikrofon und erteilter Windows-Berechtigung.
- Installation auf einem zweiten, frischen Windows-PC, Verhalten mit mehreren Monitoren unterschiedlicher Skalierung sowie ältere Windows-/Grafiktreiber-Kombinationen.
- Eine tatsächliche Steigerung der Wiederkehrrate. Schnelle Favoriten, sanfte Rückmeldungen, Wochenübersicht und optionaler Tagesimpuls sind dafür umgesetzt; es gibt keine Telemetrie oder behaupteten Messwerte.

Der Import ist ein validierter Kalorie-Widget-Sicherungsimport. Ein persönlicher „Kalorien Coach“-Chat-Export muss gesondert bereitgestellt und ausgewertet werden.
