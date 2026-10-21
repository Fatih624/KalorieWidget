# Prüfung der Windows-Version und privaten Site

## Handy-App: Ueberarbeitung und Passwortzugang

- Produktionsversion unter der bestehenden Adresse veroeffentlicht. Die Adresse ist ohne GPT-Anmeldung erreichbar; ein anonymer Zugriff auf Tagebuch und Status liefert HTTP 401. Eigene Passwort-Anmeldung in Chrome getestet, einschliesslich Neuladen mit bestehender Sitzung.
- Neue deckende Oberflaeche, kompakte Tagesuebersicht und feste Navigation bei 360 × 760 Pixeln geprueft; Hauptaktion vollstaendig oberhalb der Navigation. Zusaetzlich 320 × 640 und 390 × 844 geprueft. Dialoge ohne horizontales Ueberlaufen; Eingaben mit 16-Pixel-Schrift. Keine physische Galaxy-S10-Installation in dieser Umgebung.
- Neue versionierte App-Symbole mit Android-Maskenvariante, separatem Apple-Symbol und PNG-Favicon veroeffentlicht.
- TypeScript-Pruefung und Produktionsbuild bestanden. Lokaler Authentifizierungstest prueft fehlende Anmeldung, falsches Passwort, fremde Herkunft, Secure/HttpOnly-Cookie, Schluessel-Nichtoffenlegung, verschluesselte Speicherung ueber mehrere Sitzungen, Geraetekopplung, einmalige Codes, Widerruf und Abmeldung. Ein eindeutig unechter lokaler Testschluessel wurde wieder entfernt; keine Anbieteranfragen damit.
- Der Benutzer hat seinen vorhandenen OpenAI-Schluessel einmalig in der veroeffentlichten App gespeichert. Danach aus einer neuen App-Sitzung eine echte Fotoanalyse ueber den Server ausgefuehrt: neutrales generiertes Bananen-Testfoto, gpt-4.1-mini, eine neue Analyse. Ergebnis als Schaetzung: Banane, 150 g, 135 kcal. Dies ist ein Funktionstest, keine Validierung fotografischer Naehrwertgenauigkeit.
- Den Foto-Testeintrag mit eindeutigem Namen und Eintragsschluessel gespeichert. Empfang im laufenden Windows-Widget anhand desselben Schluessels und in der nativen Oberflaeche bestaetigt: Kalorienkreis 135 kcal, Makros und „Foto-Verbindungstest · Banane“ sichtbar. Anschliessend ausschliesslich diesen Testeintrag mit Versionspruefung entfernt; Entfernung auch im Windows-Tagebuch bestaetigt. Andere Eintraege, Favoriten und Ziele bleiben erhalten.
- Der integrierte Vorschau-Browser uebernahm die eigene Sitzung nicht; die Live-Anmeldung und Darstellung wurden deshalb zusaetzlich im normalen Chrome geprueft. Auf dem Handy direkt in Chrome oeffnen.


## Überarbeitung 0.3 – deckendes Windows-Widget

- 15 TypeScript-Tests und neun Rust-Tests bestanden. Die sechs neuen Geometriefälle prüfen Randposition, negative Monitorursprünge, Taskleiste, kurze und schmale Arbeitsflächen sowie Skalierungen von 100 bis 200 Prozent. TypeScript und Produktionsbuild erfolgreich.
- Drei unabhängige Agents haben Darstellung, Bedienbarkeit und native Fensterlogik geprüft. Ihre Befunde zu Fokuswechseln, versteckten Bedienelementen, Dialogfreigaben, schmalen Arbeitsflächen, Docking während eines Drags und Strg+K wurden korrigiert und erneut geprüft.
- Native Release-Ansichten unter Windows geprüft: deckende Farben, scharfe Schrift, FoodGlyph-Favoriten und abgerundete Haupt- und Einstellungsfenster. Kein Acrylic; Alpha bleibt ausschließlich außerhalb der runden Konturen.
- Getrenntes 128-Pixel-Kreissymbol und 416-Pixel-Panel. Panelbreite und -höhe werden auf die Arbeitsfläche begrenzt; das Symbol dockt nach dem Loslassen der Maus. Keine CSS-Skalierung des WebView-Inhalts.
- Fokuswechsel außerhalb klappt das native Panel ein. Ein ungespeicherter Eingabetext blieb nach dem Wiederöffnen erhalten und wurde danach entfernt. Das ursprüngliche Kalorienziel von 2200 kcal wurde nach dem Zielwerte-Test wiederhergestellt. Kein Testlebensmittel wurde eingetragen.
- Hauptfenster bleibt beim Einklappen gemountet und alleiniger Datenautor. Die vorhandene private Geräteverbindung und der Windows-Schlüsselspeicher werden weiterverwendet.
- Finales Release-Paket 0.3.0 gebaut und die reguläre portable Windows-EXE aus `output/release` gestartet. Strg+K öffnet das Panel aus dem Badge. Native Dateiauswahl geöffnet und ohne Import geschlossen: Einstellungen bleiben geöffnet, kein versehentliches Schließen durch das weitergeleitete Datei-Abbruchereignis.
- Kompakte Makroanzeige mit Tastaturfokus nativ geprüft; Kalorien bleiben sichtbar und Protein/Kohlenhydrate/Fett erhalten Gramm-Einheiten. Badge gezogen, ohne den geöffneten Panelzustand versehentlich umzuschalten.

Native Bedienprüfung auf dem vorhandenen Arbeitsplatz; weitere physische Monitore und veränderte Windows-DPI-Einstellungen wurden nicht durchgetestet. Die Geometrietests ersetzen diese Hardwareprüfung nicht. Die unten genannten ausstehenden KI-/Handyprüfungen bleiben unverändert.

## Erweiterung 0.2 – tatsächlich geprüft

- Private Site erfolgreich veröffentlicht: https://kalorie-coach-fatih.fatihgenc.chatgpt.site. Anmeldung als Eigentümer in der veröffentlichten Site bestätigt; unangemeldeter Zugriff fordert die Anmeldung an.
- Windows-Release 0.2.0 und deutschsprachiges NSIS-Paket erfolgreich gebaut. Die fertig gepackte EXE wurde gestartet und über WebView2 geprüft, ohne Konsolenfehler.
- 15 TypeScript-Tests bestanden (acht bestehende Datenprüfungen und sieben Fälle zur Zusammenführung). Drei Rust-Tests bestanden. TypeScript und Produktionsbuild von Widget und Site erfolgreich.
- Lokale Schnittstellenprüfung bestanden: fehlende oder gefälschte Identität abgewiesen, fremde Browser-Herkunft abgewiesen, parallele Schreibvorgänge ergeben genau einen Erfolg und einen Versionskonflikt, ungültige Nährwerte abgewiesen, Kopplung nur einmal möglich, Geräte dürfen keine anderen Geräte verwalten, unbekannte und widerrufene Geräteschlüssel abgewiesen.
- Die veröffentlichte Site mit dem echten Windows-Widget gekoppelt. Privater Hosting-Zugang und Gerätezugang liegen ausschließlich in der Windows-Anmeldeinformationsverwaltung. Das Tagebuch und die Abgleichsbasis enthalten keine Schlüssel.
- Ein Testeintrag aus dem Windows-Widget erschien in der veröffentlichten Site. Nach dem Entfernen dieses eigenen Testeintrags auf der Site verschwand er auch im Widget. Beide Ansichten zeigten danach wieder null Einträge und den erfolgreichen Abgleich. Die Geräteverbindung bleibt zur Nutzung eingerichtet.
- Mobile Ansicht bei 390 Pixeln Breite visuell geprüft. Kamera-/Galerie-Auswahl und Foto-Vorschau mit einem lokalen Konzeptbild geprüft; das Bild wurde auf höchstens 1024 Pixel und unter die Upload-Grenze verkleinert. Kein Bild wurde an OpenAI übertragen.
- Manifest und App-Symbole mit 192/512 Pixeln vorhanden. Service Worker speichert keine privaten Seiten oder Antworten; vollständiger Offline-Neustart zeigt eine neutrale Hinweisseite.

Noch offen: KI-Auswertung mit einem echten Schlüssel, Aufnahme mit einer echten Handy-Kamera und Installation auf einem physischen iPhone/Android-Gerät. Das Codex-Formular zur Schlüsselbestätigung antwortet automatisch mit Ablehnung; die Diagnose steht in `docs/KEY-SETUP-DIAGNOSIS.md`. Es gab keine kostenpflichtigen API-Aufrufe.

Die folgende Prüfung dokumentiert zusätzlich die zuvor erstellte Version 0.1.

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
