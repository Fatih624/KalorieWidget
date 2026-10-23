# Kalorie Widget

Ein lokales Windows-Widget für Kalorien, Makros und schnelle Mahlzeiteneinträge. Version 0.3 verwendet deckende Navy-Flächen, klare Schrift und farbige Makroanzeigen. Ein kleines Kreissymbol bleibt auf dem Desktop; das abgerundete Panel lässt sich aufklappen.

## Starten

Die für dich bereitgelegten Dateien liegen unter `output/release/Kalorie-Widget.exe` und `output/release/Kalorie-Widget-Setup.exe`. Die ursprünglichen Build-Ergebnisse liegen unter `src-tauri/target/release/`:

- `kalorie-widget.exe`: direkt starten, ohne Installation.
- `bundle/nsis/Kalorie Widget_0.3.0_x64-setup.exe`: deutschsprachige Installation für den aktuellen Windows-Benutzer.

Benötigt Windows 10/11 (x64) mit Microsoft Edge WebView2. Der Installer kann die WebView2-Laufzeit bei Bedarf beziehen. Das Paket ist lokal erstellt und nicht mit einem Herausgeberzertifikat signiert.

## Bedienung

- **Kreis ziehen:** Widget verschieben. Das Symbol misst 128 × 128 logische Pixel; seine Position und der Vordergrundstatus werden gespeichert. Nahe am Bildschirmrand rastet es nach dem Loslassen ein. Das Panel öffnet daneben und bleibt innerhalb der Arbeitsfläche einschließlich Taskleiste.
- **Kreis anklicken:** das 416 Pixel breite Panel öffnen. Minus oder ein Klick außerhalb klappen es wieder ein. Offene Formulare und ihre ungespeicherten Entwürfe bleiben beim Einklappen erhalten. Beim App-Start erscheint zunächst der Kreis.
- **Makros im Kreis:** drei farbige Ringe zeigen Protein, Kohlenhydrate und Fett. Hover oder Tastaturfokus blendet ihre Grammwerte ein; die heutigen Kalorien bleiben sichtbar. Datei- und Mikrofonfreigaben werden durch Auto-Hide nicht unterbrochen.
- **Favoriten:** ein Klick übernimmt die gespeicherte Portion. Unter „Alle ansehen“ können eigene Favoriten erstellt, bearbeitet und entfernt werden. Häufig verwendete Favoriten erscheinen zuerst.
- **Essen hinzufügen:** Favoriten durchsuchen, z. B. `300 g Skyr`, oder ein Lebensmittel selbst anlegen. Jeder Tagebucheintrag lässt sich durch Klicken bearbeiten. Löschen kann sechs Sekunden lang rückgängig gemacht werden.
- **Lebensmittel:** explizite Suche nach Produktname oder Barcode bei Open Food Facts. Nur Treffer mit vollständigen Kalorien- und Makrowerten werden angeboten. Werte zunächst pro 100 g; die gewünschte Portion danach wählen und prüfen. Es werden keine Daten an Open Food Facts geschrieben.
- **Kalenderpfeile:** frühere Tage ansehen und nachtragen. Beim Tageswechsel wechselt die Heute-Ansicht automatisch mit. Der Kreis bleibt auf den aktuellen Tag bezogen.
- **Woche:** die letzten sieben Tage ansehen und einzelne Tage öffnen. Die Übersicht zählt erfasste Tage und enthält keine Bewertung des Essverhaltens.
- **Strg+K:** Eingabefeld fokussieren; ein geschlossenes Widget wird dafür geöffnet.

Die Startfavoriten und Tagesziele sind bearbeitbare Richtwerte, keine aus persönlichen Chats übernommenen Angaben. Das Tagebuch startet leer. Mahlzeiten, Ziele, Zeit und Datum in den Konzeptbildern sind reine Beispieldaten.

## KI und Sprache

Bei „Mit KI“ können zusätzlich eine **Anzahl insgesamt** und ein **Zusatzkommentar** angegeben werden, zum Beispiel Burger, Anzahl 2, „vegane Patties“. Die Anzahl ersetzt eine bereits beschriebene Stückzahl. In der Handy-App gelten diese Angaben auch für Fotos: Ein fotografierter Burger kann als Grundlage für zwei gleichartige Burger dienen. Die gesamte Portion und ihre Nährwerte vor dem Speichern prüfen.

Die **Schnellsuche** berücksichtigt Favoriten und bereits erfasste Lebensmittel aus allen Tagen, unabhängig von der Erfassungsmethode. Gleiche Namen erscheinen nur einmal. Favoriten behalten ihre gespeicherte Portion; für andere Lebensmittel wird die zuletzt erfasste Portion verwendet.

Unter **Einstellungen → KI & Sprache** einen Anbieter auswählen, eine unterstützte Modell-ID eintragen und den eigenen API-Schlüssel mit „Schlüssel speichern“ hinterlegen. Das Speichern des Schlüssels gilt sofort; Modell, Limits und Sprache werden mit „Einstellungen übernehmen“ gespeichert.

Unterstützt werden OpenAI, Groq und OpenRouter über Chat Completions mit JSON-Modus. Die Modell-ID ist frei editierbar. Voreinstellungen: `gpt-4.1-mini`, `llama-3.3-70b-versatile`, `openai/gpt-4.1-mini`. Zugang, Verfügbarkeit und Abrechnung hängen vom jeweiligen Anbieter ab; diese Auswahl ist keine Garantie für das aktuell günstigste Modell.

„Mit KI erfassen“ sendet ausschließlich die eingegebene Essensbeschreibung an den ausgewählten Anbieter. Das Tagebuch und die Favoritenliste werden nicht mitgesendet. Die Antwort wird validiert und als **KI-Schätzung** zur manuellen Prüfung angezeigt. Vor dem Bestätigen erfolgt kein Eintrag. Mengen, Öl, Soßen und Getränke besonders prüfen.

Das lokale Tageslimit zählt gemeinsam für Schätzung und Sprache und wird auch nach einem Neustart beachtet. Standard: 10 Anfragen; 0 sperrt weitere KI-Anfragen. Auch fehlgeschlagene, bereits gestartete Anfragen zählen vorsichtshalber. Pro Schätzung werden höchstens 700 Ausgabetokens angefordert. Dies begrenzt die Zahl der Aufrufe, ist aber kein verbindliches Euro-Budget. Beim Anbieter sollte zusätzlich ein eigenes Ausgabenlimit eingestellt werden.

**Spracheingabe ist optional und zunächst aus.** Sie benötigt einen OpenAI-Schlüssel, auch wenn für Essensschätzungen ein anderer Anbieter gewählt ist. Nach Aktivierung startet das Mikrofon erst per Klick und mit Windows-Berechtigung. Stoppen oder 30 Sekunden Aufnahmezeit senden die Aufnahme an OpenAI (`gpt-4o-mini-transcribe`). Der Text erscheint zur weiteren Bearbeitung; eine Essensschätzung erfolgt erst durch eine weitere bewusste Aktion. Die Aufnahme wird nicht als Datei gespeichert. Mikrofon und Audioformat müssen von WebView2 unterstützt werden. Bei Ablehnung bleibt die Texteingabe nutzbar.

KI und Spracherkennung wurden ohne echten Anbieter-Schlüssel implementiert. Es wurden keine kostenpflichtigen Live-Anfragen ausgeführt. Der sichere Schlüsselspeicher wurde mit einem anschließend wieder entfernten Testwert geprüft.

## Daten und Sicherungen

Das Windows-Tagebuch liegt unter `%APPDATA%/de.fatih.kaloriewidget/diary.json`. Jede Speicherung erfolgt über eine temporäre Datei mit anschließender Umbenennung. Die vorherige Version wird zusätzlich als `diary.bak` aufbewahrt. API-Zähler liegen in `api-usage.json`; die Fensterposition liegt im lokalen WebView-Speicher. Nur eine App-Instanz läuft gleichzeitig.

API-Schlüssel liegen ausschließlich in der **Windows-Anmeldeinformationsverwaltung**, getrennt nach Anbieter. Sie werden dem Frontend nicht zurückgegeben und sind weder im Export noch im Git-Repository enthalten.

Unter **Einstellungen → Daten** lassen sich JSON-Sicherungen exportieren und importieren. Windows-Exporte landen im Downloadordner. Ein Import wird auf Format, Mengen, Tagesziele und Einträge geprüft und vor dem Ersetzen bestätigt. Vor einem Import empfiehlt sich ein Export des aktuellen Tagebuchs. Beschädigte vorhandene Daten werden beim Laden nicht automatisch überschrieben.

Die Browser-Vorschau verwendet einen eigenen lokalen Speicher und enthält keine echten Desktop- oder Online-Funktionen. Persönliche ChatGPT-/„Kalorien Coach“-Chats sind nicht automatisch erreichbar. Ein vom Benutzer bereitgestellter Chat-Export muss zunächst gesondert ausgewertet werden; der Sicherungsimport erwartet ausschließlich das Kalorie-Widget-Format (Version 1).

## Entwicklung

Voraussetzungen: Node.js >= 22.12, Rust (MSVC), Visual Studio C++ Build Tools und Windows SDK.

```powershell
npm ci
npm run dev           # Browser-Vorschau auf http://127.0.0.1:1420
npm run tauri dev     # Windows-App inkl. Entwicklungsserver (separaten Server vorher beenden)
npm run test          # Berechnungen und Sicherungsvalidierung
cargo test --manifest-path src-tauri/Cargo.toml
npm run tauri build   # Oberfläche, Windows-EXE und Installer
```

Alternativ lässt sich die Tauri-CLI unter Windows direkt mit `node node_modules/@tauri-apps/cli/tauri.js build` aufrufen. Die Oberfläche verwendet React und TypeScript; Dateispeicherung, Schlüsselspeicher, API-Anfragen und die nativen Kreis- und Panelregionen liegen in Rust. Hauptfenster und Badge sind getrennte WebViews; ausschließlich das Hauptfenster schreibt und synchronisiert Daten. Netzwerkzugriffe erfolgen im nativen Backend über HTTPS an festgelegte Anbieter. Die Flächen sind deckend, ohne Acrylic oder Hintergrundunschärfe. Fenster-Alpha wird nur außerhalb der runden Konturen verwendet. CSS-Bewegungen beachten die Systemeinstellung „Bewegung reduzieren“ und die zusätzliche Widget-Einstellung.

## Datenquelle und Dokumentation

- Lebensmitteldaten: [Open Food Facts](https://world.openfoodfacts.org), [ODbL-Lizenz](https://world.openfoodfacts.org/terms-of-use), [API-Dokumentation und Limits](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/).
- [Tauri-Fenster-API](https://v2.tauri.app/reference/javascript/api/namespacewindow/).
- [OpenAI: JSON-/strukturierte Ausgaben](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=chat), [Spracherkennung](https://developers.openai.com/api/docs/guides/speech-to-text), [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini).
- [Groq: API-Referenz](https://console.groq.com/docs/api-reference), [OpenRouter: API-Dokumentation](https://openrouter.ai/docs/api-reference/overview).

Open Food Facts wird nur auf ausdrückliche Suche aufgerufen, für die Sitzung zwischengespeichert und auf eine neue Online-Suche pro sieben Sekunden begrenzt. Favoriten, manuelle Einträge und bereits gespeicherte Mahlzeiten funktionieren offline.

## Handy und private Cloud (Version 0.2)

Die private Site ist unter https://kalorie-coach-fatih.fatihgenc.chatgpt.site veröffentlicht; die Quellen liegen in `sites/kalorie-coach`. [Einrichtung und Verhalten](docs/CLOUD.md), [Diagnose der Schlüsselbestätigung](docs/KEY-SETUP-DIAGNOSIS.md). Favoriten, Tagebuch und Tagesziele lassen sich mit dem Windows-Widget abgleichen; OpenAI ist dafür nicht erforderlich. Die KI-Fotoanalyse wartet noch auf die sichere Schlüsseleinrichtung.
