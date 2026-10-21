# Private Handy-Version und Geräteabgleich

Die private Site nutzt die ChatGPT-Anmeldung und D1 als gemeinsamen Datenspeicher. Einträge, Favoriten und Tagesziele werden zwischen Site und Windows-Widget zusammengeführt. Darstellung, Anbieter-Einstellungen und lokale API-Schlüssel bleiben auf dem jeweiligen Desktop.

Veröffentlicht: https://kalorie-coach-fatih.fatihgenc.chatgpt.site. Die Verbindung auf diesem Windows-Konto wurde eingerichtet und in beide Richtungen geprüft.

## Einrichtung

1. Die private Site im Handy-Browser öffnen und mit demselben ChatGPT-Konto anmelden, das die Site besitzt.
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

Die OpenAI-Einrichtung ist derzeit ausgesetzt: Das lokale Bestätigungstool gibt sofort `not_approved / decline` zurück, obwohl kein Formular angezeigt wird. Es wurde kein neuer Schlüssel erstellt. Foto-Vorschau, manuelle Einträge, Favoriten und Synchronisierung benötigen keinen OpenAI-Schlüssel. Eine kostenpflichtige Fotoanalyse ist noch nicht live geprüft.

## Entwicklung und Prüfung

Die Site liegt unter `sites/kalorie-coach`. Die Versionskennung in `.openai/hosting.json` gehört zur bestehenden privaten Site und darf nicht durch eine neue Registrierung ersetzt werden.

Die Datenbankmigrationen liegen unter `drizzle/`. Lokale und produktive Datenbanken sind getrennt. `scripts/check-local-sync.mjs` arbeitet ausschließlich gegen `http://127.0.0.1:5173` und die lokale Vorschau-Identität; es prüft Authentifizierung, Herkunft von Schreibanfragen, gleichzeitige Aktualisierungen, Datenvalidierung, Kopplung und Widerruf.

Geheimnisse und Laufzeitverzeichnisse werden weder eingecheckt noch veröffentlicht. Für die private Veröffentlichung verwendet die Einrichtung eine separate, ignorierte Hosting-Arbeitskopie unter `output/hosting/`; die bearbeitbaren Site-Quelldateien bleiben normaler Bestandteil dieses GitHub-Repositories.
