# Private Handy-Version und Geräteabgleich

Die Handy-App nutzt ein eigenes Zugangspasswort und D1 als gemeinsamen Datenspeicher. Die Adresse ist ohne ChatGPT-Anmeldung erreichbar; Tagebuch und APIs verlangen eine gueltige App-Sitzung oder einen gekoppelten Geraeteschluessel. Einträge, Favoriten und Tagesziele werden zwischen Site und Windows-Widget zusammengeführt. Darstellung, Anbieter-Einstellungen und lokale API-Schlüssel bleiben auf dem jeweiligen Desktop.

Veröffentlicht: https://kalorie-coach-fatih.fatihgenc.chatgpt.site. Die Verbindung auf diesem Windows-Konto wurde eingerichtet und in beide Richtungen geprüft.

## Einrichtung

1. Die private Site im Handy-Browser öffnen und mit dem persoenlichen Zugangspasswort anmelden. Die Sitzung bleibt auf diesem Geraet bis zu 30 Tage aktiv.
2. Optional über das Browser-Menü zum Home-Bildschirm hinzufügen. Die Site enthält Manifest, App-Symbole und einen Service Worker. Ob der Browser eine Installation anbietet, hängt vom Gerät ab.
3. Unter „Mehr“ einen Kopplungscode erzeugen. Er gilt zehn Minuten und einmalig.
4. Im eingerichteten Windows-Widget „Handy & Cloud“ öffnen und den Code eingeben.

Der Windows-Rechner benötigt zusätzlich den privaten Hosting-Zugang. Dieser wird bei der Einrichtung ausschließlich in der Windows-Anmeldeinformationsverwaltung gespeichert. Das GitHub-Repository und die Installationsdatei enthalten diesen Zugang nicht. Ein anderes Windows-Konto oder ein anderer Rechner muss separat eingerichtet werden.

## Verhalten

- Automatischer Abgleich ungefähr alle 20 Sekunden, nach Änderungen und beim Zurückkehren ins Widget. Änderungen werden zusätzlich lokal gespeichert.
- Neue Einträge beider Geräte bleiben erhalten. Gleichzeitige Änderungen an demselben Eintrag, Favoriten oder Ziel erfordern eine Auswahl. Der Server verhindert das Überschreiben einer inzwischen geänderten Version.
- Offline können bereits geöffnete Ansichten weiterbearbeitet werden. Beim vollständigen Öffnen ohne Netzwerk zeigt die Handy-App eine Offline-Seite. Private Seiten, Fotos und API-Antworten werden vom Service Worker nicht zwischengespeichert.
- Geräte können auf der Site widerrufen werden. Der Widget-Befehl „Trennen“ entfernt den lokalen Gerätezugang und die Abgleichsbasis; die lokalen Einträge bleiben bestehen.
- Der Handy-Export ist als Kalorie-Widget-Sicherung importierbar. Er enthält keine API-Schlüssel.

## Fotoerfassung

Kamera und Fotomediathek stehen auf dem Handy zur Verfügung. Fotos werden vor einer Analyse auf höchstens 1024 Pixel Kantenlänge und JPEG verkleinert; Metadaten werden dabei entfernt. Erst „Foto analysieren“ sendet das vorbereitete Foto an das Backend. Einträge werden erst nach der Prüfung der vorgeschlagenen Portionen und Nährwerte übernommen.

Historischer Stand der Schluesselerstellung ueber das Plugin: Das lokale Bestätigungstool gibt sofort `not_approved / decline` zurück, obwohl kein Formular angezeigt wird. Es wurde kein neuer Schlüssel erstellt. Foto-Vorschau, manuelle Einträge, Favoriten und Synchronisierung benötigen keinen OpenAI-Schlüssel. Die damalige Plugin-Einrichtung wurde nicht fortgesetzt. Inzwischen wurde der vorhandene Schluessel direkt in der App gespeichert und die Fotoanalyse live erfolgreich geprueft.

## Entwicklung und Prüfung

Die Site liegt unter `sites/kalorie-coach`. Die Versionskennung in `.openai/hosting.json` gehört zur bestehenden privaten Site und darf nicht durch eine neue Registrierung ersetzt werden.

Die Datenbankmigrationen liegen unter `drizzle/`. Lokale und produktive Datenbanken sind getrennt. `scripts/check-local-sync.mjs` arbeitet ausschließlich gegen `http://127.0.0.1:5173` und die lokale Vorschau-Identität; es prüft Authentifizierung, Herkunft von Schreibanfragen, gleichzeitige Aktualisierungen, Datenvalidierung, Kopplung und Widerruf.

Geheimnisse und Laufzeitverzeichnisse werden weder eingecheckt noch veröffentlicht. Für die private Veröffentlichung verwendet die Einrichtung eine separate, ignorierte Hosting-Arbeitskopie unter `output/hosting/`; die bearbeitbaren Site-Quelldateien bleiben normaler Bestandteil dieses GitHub-Repositories.

## Mobile Ueberarbeitung und dauerhafte Schluessel

Die Oberflaeche ist fuer 360 Pixel breite Displays wie das Galaxy S10 ausgelegt; zusaetzlich bei 320 und 390 Pixeln geprueft. Deckende Flaechen, mindestens 50 Pixel hohe Hauptaktionen, 16-Pixel-Eingaben und eine feste Navigation ersetzen das zuvor verkleinerte Dashboard. Das Installationsmanifest verwendet neue versionierte PNG-Symbole mit Android-Maskenunterstuetzung. Android aktualisiert installierte Web-App-Symbole eventuell zeitversetzt; ein erneutes Hinzufuegen zum Startbildschirm laedt das neue Symbol.

Unter Mehr → Foto & KI kann ein vorhandener OpenAI-Schluessel einmalig eingegeben werden. Die App speichert ihn mit AES-GCM verschluesselt in D1 und liefert nur den Einrichtungsstatus zurueck. Der separate Verschluesselungsschluessel APP_SECRET liegt als Sites-Laufzeitgeheimnis vor und muss bei Updates erhalten bleiben. Ein gespeicherter API-Schluessel bleibt unabhaengig von Browser-Sitzung und Abmeldung erhalten. Er ist weder im Tagebuch-Export noch im Repository enthalten.

Die Passwortpruefung verwendet PBKDF2-SHA256 mit individuellem Salt und 100000 Iterationen. Sitzungen bestehen aus zufaelligen, serverseitig nur gehashten Tokens und Secure/HttpOnly-Cookies (normal SameSite-Strict; eingebettete Ansichten verwenden bei Bedarf partitionierte Cookies). Anmeldeversuche sind pro IP und insgesamt begrenzt. Das vom Benutzer gewuenschte kurze Passwort bleibt leicht zu erraten; die Begrenzung macht es nicht zu einem starken Passwort. APP_PASSWORD_HASH, APP_PASSWORD_SALT, APP_OWNER_ID und APP_SECRET werden ausschliesslich als Laufzeitgeheimnisse gesetzt. Die Zuordnung zum vorhandenen Tagebuch bleibt gleich; bestehende Windows-Geraetetokens werden weiter akzeptiert.

Lokaler Sicherheitstest: COACH_TEST_PASSWORD setzen, dann im Site-Verzeichnis `node scripts/check-password-auth.mjs` ausfuehren. Der Test verwendet ausschliesslich die lokale Vorschau und einen eindeutig unechten API-Schluessel, sendet keine OpenAI-Anfragen und entfernt seinen Testschluessel wieder.

Zur Sitzungskompatibilitaet eingebetteter Browser: [MDN: partitionierte Cookies](https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/Third-party_cookies/Partitioned_cookies). Die normale Live-Anmeldung wurde in Chrome verifiziert.
