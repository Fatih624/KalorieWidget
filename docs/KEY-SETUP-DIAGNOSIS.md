# Diagnose der fehlenden Speicherort-Bestätigung

Stand: 21.10.2026. Es wurde kein API-Schlüssel erstellt oder gespeichert und keine Bestätigung simuliert.

## Festgestellte Befunde

- Das lokale Plugin ist gestartet und sein Bestätigungstool erreichbar.
- Die Tool-Aufrufe liefern unmittelbar `status: not_approved`, `action: decline` zurück.
- Der Benutzer berichtet, dass kein Formular erscheint.
- Der unveränderte Plugin-Code in `openai-developers/1.3.6/mcp/server.mjs` prüft zuerst den Speicherort innerhalb des Arbeitsverzeichnisses. Danach sendet er `elicitation/create` mit `mode: form` an Codex. Nur eine Antwort mit `action: accept` wird als Bestätigung gewertet.
- Ein ungültiger Pfad würde einen Parameterfehler auslösen, keinen erfolgreichen Tool-Aufruf mit `decline`. Der beobachtete Abbruch findet somit an der Formularantwort des Clients statt.
- In den lokalen Codex-Einstellungen ist `approval_policy = "never"` gesetzt. In dieser Sitzung sind interaktive Ausführungsfreigaben ebenfalls deaktiviert. Das ist eine mögliche Erklärung für eine automatische Ablehnung; die vorhandenen Protokolle belegen den direkten Zusammenhang jedoch nicht.
- Die betrachteten Desktop-Protokolle bestätigen den erfolgreichen Plugin-Start, enthalten aber keine erklärende Fehlermeldung für diese Formularantwort. Die Ursache innerhalb des Codex-Clients lässt sich damit nicht abschließend bestimmen.

## Konsequenz

Keine automatische Wiederholung, keine Änderung globaler Freigabeeinstellungen und kein Umgehen der Schlüsselbestätigung. Arbeiten ohne API-Schlüssel gehen weiter. Nach einer Reparatur der Formularanzeige kann die sichere Einrichtung erneut gestartet werden. Ein API-Schlüssel soll nicht in den Chat kopiert werden.
