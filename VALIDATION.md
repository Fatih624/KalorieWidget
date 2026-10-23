# Prüfung der Windows-Version und privaten Site

## Lebensmittelkatalog vom 23.10.2026

- Ein gemeinsamer, statischer Katalog mit 67 CoFID-Grundnahrungsmitteln und 10 Lidl-Produkten aus vollständigen Open-Food-Facts-Barcode-Datensätzen wird in beiden Schnellsuchen verwendet. Eigene Favoriten und jüngste Tagebucheinträge haben Vorrang; gleiche Namen oder IDs erscheinen nur einmal. Keine automatische Änderung persönlicher Favoriten oder Tagebucheinträge.
- Quellen und konkrete Datensätze unter `docs/PRESETS-SOURCES.md` dokumentiert; roh/trocken und gekocht getrennt. Der Windows-Suchparser nutzt nun dieselbe Mengen- und Stücklogik wie die Handy-App.
- 22 TypeScript-Tests erfolgreich, einschließlich Katalogvalidierung, ID-Eindeutigkeit, Priorität persönlicher Portionen, Roh-/Garunterscheidung und identischer Suche in beiden Apps. `2 Eier`, Grammangaben und Lidl-Suche geprüft. Frontend-Build, Handy-TypeScript-Prüfung, bisherige lokale API-/Historienprüfungen und Handy-Produktionsbuild erfolgreich.
- Auf Wunsch des Nutzers keine weitere Browser- oder Computer-Use-Prüfung durchgeführt.
- Windows-Release erfolgreich erstellt und Installer beendet mit Exitcode 0. Handy-Version 9 erfolgreich unter der bestehenden Adresse veröffentlicht; Datenbank und Laufzeitgeheimnisse unverändert.

## Ergänzungen vom 23.10.2026: KI-Angaben und Schnellsuche

- Optionale Gesamtanzahl und Zusatzkommentar bei Windows-KI sowie Foto-/Textanalyse der Handy-App ergänzt. Backend-Grenzen vor einer Anbieteranfrage geprüft; Cache unterscheidet Anzahl und Kommentar. Änderungen an Eingaben verwerfen vorherige Vorschläge.
- Schnellsuche berücksichtigt Favoriten und Tagebucheinträge aller Tage; Namen werden normalisiert und dedupliziert. Favoriten haben Vorrang, sonst gilt die jüngste Portion.
- 18 TypeScript-Tests und 11 Rust-Tests bestanden. Handy-TypeScript-Prüfung, Produktionsbuild und gezielte Tests für Anzahl, Kommentar, Cache-Daten und Historie bestanden. Ungültige Anzahl und überlanger Kommentar liefern in der lokalen API HTTP 400.
- Handy-Oberfläche mit lokalem Testkonto geprüft: Foto und KI zeigen die neuen Felder; ein manuell angelegter Testeintrag vom Vortag wird ohne Favoritenstatus gefunden. Ausschließlich lokale Testdaten, keine kostenpflichtige KI-Anfrage.
- Windows-Release neu gebaut und auf diesem Heim-PC installiert. Neue KI-Felder nativ sichtbar; bestehende Cloud-Verbindung und heutige 305 kcal nach Update weiterhin vorhanden. Handy-Version 8 unter der bestehenden Adresse erfolgreich veröffentlicht.

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


## Kreis-Rendering - 23.10.2026

- Die Kreisflaeche und Makroringe werden gemeinsam als SVG gezeichnet. Die Flaeche ist deckend und entspricht dem Panel (#142238); die separate CSS-Pseudoflaeche entfaellt.
- Der helle Offen-Statuspunkt oben rechts wurde entfernt. Er war ein absichtlich gezeichnetes Element; ob er die vom Nutzer gemeldete weisse Stelle vollstaendig erklaert, ist ohne Sichtpruefung nicht bestaetigt.
- Badge und Panel verwenden dieselben Makro-Farbvariablen. Ringbreite auf 4 logische Pixel erhoeht; keine Bitmap, CSS-Skalierung oder Unschaerfefilter fuer die Badge-Grafik.
- Bei null Fortschritt wird kein abgerundeter Restpunkt gezeichnet, bei vollem Fortschritt ein durchgehender Kreis.
- TypeScript-/Vite-Produktionsbuild und alle 22 vorhandenen Tests bestanden. Keine Aenderung an Datenformat oder Tagebuch.
- Sichtpruefung nicht abgeschlossen: Computer-Use konnte den Codex-App-Server nicht starten; Chrome erreichte den lokalen Vorschau-Server nicht, und die In-App-Browserroute war nicht verfuegbar. Daher keine bestaetigte Aussage zur nativen Darstellung oder verschiedenen DPI-Skalierungen.

- Nativer Release-Build erfolgreich (3m02s); aktualisierte portable EXE unter output/release/Kalorie-Widget.exe. NSIS-Installer konnte nicht neu erstellt werden, weil der Download der NSIS-Buildwerkzeuge an DNS/Netzwerkzugriff scheiterte. Keine Installation oder erfolgreiche Live-Sichtpruefung behauptet.

## Installation auf diesem PC - 23.10.2026

- Aktueller Windows-Release und NSIS-Installer erfolgreich erstellt; alle 22 Frontend-Tests bestanden.
- Installer unter output/release/Kalorie-Widget-Setup.exe bereitgelegt und im aktuellen Benutzerkonto ausgefuehrt (Exitcode 0). Vorhandene Installation 0.3.0 aktualisiert.
- Tagebuch und Cloud-Abgleichsbasis vorher zusaetzlich unter %LOCALAPPDATA%/KalorieWidget-Backups/before-update-20261023-144748 gesichert.
- Installierte EXE gestartet und mit Computer Use nativ geprueft: Kreis und Panel oeffnen, vorhandene Tagesdaten weiterhin 565 kcal mit sechs Eintraegen.
- Installierte und portable EXE unterscheiden sich ausschliesslich in drei Bytes der Tauri-Bundle-Kennung (NSS gegen UNK), passend zu Installation gegen portablem Start.
- Sichtpruefung bleibt eingeschraenkt: In der Kreisaufnahme bei geoeffnetem Panel erscheint weiterhin ein heller Bereich oben rechts. Bei der ersten Aufnahme mit geschlossenem Panel war er nicht vorhanden. Die Entfernung des alten Statuspunkts ist deshalb keine vollstaendige Bestaetigung der Fehlerbehebung; Ursache dieses verbleibenden Effekts noch offen.

## Korrektur des nativen Kreisrands - 23.10.2026

- Badge-Fenster und nativer WebView-Hintergrund verwenden deckendes Navy (#142238). Damit ist auch der Bereich zwischen SVG-Kante und nativer Fensterregion hinterlegt.
- Die native Kreisregion entspricht exakt der Fensterbreite/-hoehe; der bisherige zusaetzliche Pixel an rechter und unterer Grenze entfaellt.
- TypeScript-/Vite-Build und 22 Frontend-Tests erfolgreich. Nativer Release-Build und NSIS-Installer erfolgreich (3m01s).
- Aktuelles Paket nach output/release/Kalorie-Widget-Setup.exe kopiert und installiert (Exitcode 0); installierte EXE gestartet. Vergleich mit dem Build unterscheidet nur die drei erwarteten Bytes der Tauri-Bundle-Kennung (NSS/UNK).
- Computer-Use-Sichtpruefung der installierten Version: Kreis im geschlossenen Zustand und nach Oeffnen des Panels ohne sichtbaren hellen Bereich oben rechts. Panel weiterhin funktionsfaehig, heute 565 kcal und sechs Eintraege.
- Alle 17 gespeicherten Tagebucheintraege nach der Installation mit der vorherigen Sicherung verglichen: unveraendert. Sicherung unter %LOCALAPPDATA%/KalorieWidget-Backups/install-render-fix-20261023-150146.
- Sichtpruefung auf diesem Arbeitsplatz bei aktueller Bildschirmskalierung; weitere Monitore/DPI-Stufen nicht erneut getestet.

## NamazFlow-Stil - Version 0.3.1

- Rein visuelle Ueberarbeitung: dunkelpetrolfarbene Verlaeufe, warme Goldkonturen, dezente Schatten und abgestimmte Karten, Dialoge und Formulare. Die drei Makrofarben bleiben erhalten.
- Badge-Flachengrafik und Ringe bleiben SVG-Vektoren. Der sichtbare Kreis liegt weiter innen als die native Windows-Region; keine Bitmap-Skalierung oder Unschaerfefilter auf Text und Ringen.
- Fensterabmessungen, Ereignisbehandlung, Datenformat, Nahrungsberechnungen, Synchronisierung und Anbieteraufrufe unveraendert. Keine zusaetzlichen Animationen oder kostenpflichtigen API-Testanfragen.
- Alle 22 vorhandenen Frontend-Tests und TypeScript-/Vite-Build bestanden. Zusaetzliche Codepruefung von CSS-Kaskade und SVG-Geometrie ohne konkreten Befund.
- Finaler nativer Release-Build und NSIS-Paket erfolgreich. Nach der Sichtpruefung alle 22 Frontend-Tests erneut bestanden; git diff --check ohne Befund.
- Native Sichtpruefung des finalen Builds: Kreis und Makro-Detailanzeige lesbar, Verlauf und Goldkontur sichtbar, Oeffnen/Einklappen funktionieren. Panel zeigt die bisherigen sechs Tageseintraege und 565 kcal. Einstellungen geoeffnet und ohne Aenderungen geschlossen; Darstellung von Dialog, Tabs und Schaltern im neuen Theme geprueft.
- Der Kreis ist innerhalb seiner sichtbaren Vektorkontur geschlossen; die aeussere, unbemalte Fensterflaeche ist absichtlich transparent. Keine Bitmap oder Filter-Weichzeichnung der Ringe verwendet. Weitere DPI-Stufen und physische Monitore nicht erneut getestet.
- Version 0.3.1 ueber das aktuelle NSIS-Paket installiert (Exitcode 0); Windows-Installation meldet DisplayVersion 0.3.1 und wurde neu gestartet. Alle 17 Tagebucheintraege stimmen mit der Sicherung vor der Ueberarbeitung ueberein.
- Sicherung: %LOCALAPPDATA%/KalorieWidget-Backups/before-soft-theme-20261023-151235. Aktuelle portable EXE und Installer liegen unter output/release.

## Transparenter Kreisrand - Version 0.3.2

- Nutzerbild und erneute native Pruefung zeigten weiterhin einen hellen Streifen im unbemalten Aussenrand des Kreisfensters. Die vorherige Sichtpruefung von 0.3.1 hatte diesen Bereich nicht ausreichend erfasst.
- Die zusaetzliche Win32-Kreisregion (SetWindowRgn) wird fuer das Badge nicht mehr gesetzt. Der Kreis verwendet ausschliesslich die Alpha-Transparenz des Renderers. Native Panelregion, SVG-Grafik, Datenlogik und Fensterpositionierung bleiben unveraendert.
- Direkter Vergleich mit identischen Frontend-Assets: Mit Win32-Kreisregion war der Streifen sichtbar, ohne sie bei geschlossenem und geoeffnetem Panel nicht mehr. Der native HTML-title erzeugte zusaetzlich einen separaten hellen Tooltip; er wurde durch eine ARIA-Beschreibung ersetzt. Makro-Detailanzeige und Bedienhinweise in den Einstellungen bleiben erhalten.
- Finaler nativer Release-Build und NSIS-Paket erfolgreich (3m08s); TypeScript-/Vite-Build und alle 22 Frontend-Tests bestanden.
- Finale native Sichtpruefung: geschlossener Kreis, Makroanzeige nach Hover einschliesslich vier Sekunden Wartezeit, Oeffnen und erneutes Einklappen. Kein heller Randstreifen und kein separates weisses Tooltip-Fenster sichtbar. Panel weiterhin bedienbar, 565 kcal mit sechs heutigen Eintraegen.
- Version 0.3.2 installiert (Exitcode 0), DisplayVersion in Windows bestaetigt und Installation neu gestartet. Alle 17 Tagebucheintraege gegen die Sicherung verglichen: unveraendert. Sicherung unter %LOCALAPPDATA%/KalorieWidget-Backups/before-alpha-fix-20261023-154636.
- Geprueft am vorhandenen Arbeitsplatz bei aktueller DPI-Einstellung; keine Aussage zu allen Monitor-/Grafiktreiber-Kombinationen.

## Eintraege wiederholen und automatische Favoriten - Version 0.3.3

- Tagebucheintraege koennen einzeln oder als ganze angezeigte Tagesliste wiederholt werden. Portion und Naehrwerte bleiben gleich, Datum ist der angezeigte Tag, Uhrzeit und Eintrags-IDs sind neu. Rueckgaengig entfernt gezielt die Kopien und behaelt spaeter hinzugefuegte andere Eintraege.
- Automatik: mindestens drei verschiedene Kalendertage im inklusiven 30-Tage-Zeitraum, keine Zukunftstage, exakte normalisierte Namen statt unscharfer Produktzusammenlegung. Hoechstens zehn automatische Favoriten mit zuletzt erfasster Portion. Mehrere Eintraege pro Tag erhoehen die Zahl der Tage nicht.
- Lokale Lernmetadaten sind optional und werden validiert exportiert/importiert. Alte Version-1-Sicherungen bleiben gueltig. Fertige Favoriten werden ueber den vorhandenen Abgleich synchronisiert, die Lernpraeferenzen bleiben lokal. Auch entfernte Cloud-Favoriten werden fuer die erneute automatische Aufnahme ausgeschlossen.
- 35 Tests bestanden: 22 bisherige sowie zehn Tests zu Lernlogik/Zeitraum/Portion/Deduplizierung/Limits/Entfernen/Undo/Cloud/Parsing und drei Tests fuer Kopieren/Summen/selektives Undo. TypeScript-/Vite-Build, nativer Release und NSIS-Build erfolgreich (2m44s). Zusaetzliche Codepruefung ohne konkreten Korrektheitsbefund.
- Nativ geprueft: neue Kopiersymbole und Aktion fuer die ganze Liste sichtbar. Einzelkopie von 15 kcal: 565 -> 580 -> Rueckgaengig -> 565 kcal. Gesamte Liste: sechs -> zwoelf -> Rueckgaengig -> sechs Tageseintraege. Neue Kopien zeigen aktuelle Uhrzeit. Die eigenen Testkopien sind alle entfernt.
- Nach den Tests alle 17 urspruenglichen Tagebucheintraege gegen die Sicherung verglichen: unveraendert. Die automatische Auswahl wurde mit synthetischen Tagebuechern getestet; dafuer wurden keine persoenlichen historischen Eintraege veraendert und keine KI-Anfragen ausgefuehrt.
- Version 0.3.3 installiert (Exitcode 0), Windows-DisplayVersion bestaetigt und Installation neu gestartet. Sicherung unter %LOCALAPPDATA%/KalorieWidget-Backups/before-repeat-learning-20261023-161243. EXE und Installer unter output/release aktualisiert.
