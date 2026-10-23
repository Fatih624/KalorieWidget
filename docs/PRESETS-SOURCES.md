# Quellen der Grundnahrungsmittel-Voreinstellungen

Public Health England (2021), *McCance and Widdowson’s Composition of Foods Integrated Dataset* (CoFID), © Crown copyright, unter der [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).

- [Offizielle Veröffentlichung](https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid)
- [Original-XLSX](https://assets.publishing.service.gov.uk/media/60538b91e90e07527df82ae4/McCance_Widdowsons_Composition_of_Foods_Integrated_Dataset_2021..xlsx)
- [Offizieller Benutzerleitfaden](https://assets.publishing.service.gov.uk/media/60538e66d3bf7f03249bac58/McCance_and_Widdowsons_Composition_of_Foods_integrated_dataset_2021.pdf)

Abruf: 23.10.2026. Werte direkt aus der Originaldatei, Blatt `1.3 Proximates`, anhand der unten dokumentierten `Food Code`-Kennungen extrahiert. Verwendete Spalten: `Energy (kcal) (kcal)`, `Protein (g)`, `Carbohydrate (g)`, `Fat (g)`. Die Tabelle zeigt Originalwerte je 100 g. `Tr` (Spur) wird in der App 0; unbekannte Werte werden nicht 0 gesetzt. Alle ausgewählten Zeilen haben vier bekannte Werte.

Alle Einträge sind **Standard / Richtwert**. Marken, natürliche Schwankungen und Zubereitung können abweichen. Roh-/Trockengewicht und gegartes Gewicht haben getrennte Einträge. Ausgewählte gegarte Lebensmittel enthalten laut Originalbeschreibung kein zugesetztes Bratöl. Fleischwerte gelten nur für den bezeichneten essbaren Anteil (z. B. ohne Haut / mager). Britische Brot-Durchschnittswerte stehen nicht für eine bestimmte deutsche Brotsorte.

**Kohlenhydrate:** CoFID nennt verfügbare Kohlenhydrate als Monosaccharid-Äquivalente, ohne Ballaststoffe. Besonders bei Stärke sind sie nicht unmittelbar mit EU-Verpackungswerten vergleichbar. Die Originalwerte werden übernommen; keine scheinpräzise Umrechnung aus unvollständigen Kohlenhydratfraktionen. Energie stammt aus dem Original, nicht aus einer Neuberechnung mit 4/4/9.

Standardportion: 100 g essbarer Anteil, auch bei Milch und Öl (keine ml-Umrechnung). Eier: 60 g **essbarer Inhalt ohne Schale je Stück**, eine gewählte Portionskonvention, keine garantierte Größenklasse. Die Portionswerte werden proportional skaliert, kcal auf ganze Zahlen, Makronährstoffe auf 0,1 g gerundet. Persönliche Favoriten und Tagebucheinträge werden durch den Katalog nicht verändert.

Originaldatei SHA-256: `436e9445ef2adb2a75f3d7edd51302de3adad25385f9795fc94ba58bd030e97d`.

## Nachweis je Eintrag

ID-Präfix: `basic-`. Alle Zahlen je 100 g, E in kcal, P/KH/F in g. Originalnamen machen die deutschen Bezeichnungen überprüfbar.

| ID ohne Präfix | Deutscher Name | CoFID-Code | Originalbezeichnung | E | P | KH | F |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| egg-raw | Eier / Ei, roh · 1 Stück (60 g) | 12-937 | Eggs, chicken, whole, raw | 131 | 12.6 | Tr | 9.0 |
| egg-boiled | Eier / Ei, gekocht · 1 Stück (60 g) | 12-940 | Eggs, chicken, whole, boiled | 143 | 14.1 | Tr | 9.6 |
| egg-white | Eiklar, roh | 12-938 | Eggs, chicken, white, raw | 43 | 10.8 | Tr | Tr |
| rice-dry | Reis trocken, weißer Langkornreis | 11-861 | Rice, white, long grain, raw | 355 | 6.7 | 85.1 | 1.0 |
| rice-cooked | Reis gekocht, weißer Langkornreis, ohne Salz | 11-862 | Rice, white, long grain, boiled in unsalted water | 131 | 2.8 | 31.1 | 0.4 |
| basmati-dry | Basmatireis trocken, weiß | 11-857 | Rice, white, basmati, raw | 351 | 8.1 | 83.7 | 0.5 |
| basmati-cooked | Basmatireis gekocht, weiß, ohne Salz | 11-858 | Rice, white, basmati, boiled in unsalted water | 117 | 2.8 | 26.5 | 0.7 |
| brown-rice-dry | Vollkornreis trocken | 11-868 | Rice, brown, wholegrain, raw | 333 | 7.7 | 77.0 | 1.5 |
| brown-rice-cooked | Vollkornreis gekocht, ohne Salz | 11-869 | Rice, brown, wholegrain, boiled in unsalted water | 132 | 3.6 | 29.2 | 0.9 |
| pasta-dry | Nudeln trocken, Hartweizen, ohne Ei | 11-716 | Pasta, white, dried, raw | 343 | 11.3 | 75.6 | 1.6 |
| pasta-cooked | Nudeln gekocht, Hartweizen, ohne Ei und Salz | 11-1129 | Pasta, white, dried, boiled in unsalted water | 169 | 5.5 | 37.2 | 0.8 |
| wholewheat-pasta-dry | Vollkornnudeln trocken, Spaghetti | 11-718 | Pasta, wholewheat, spaghetti, dried, raw | 329 | 12.6 | 68.3 | 2.5 |
| wholewheat-pasta-cooked | Vollkornnudeln gekocht, Spaghetti, ohne Salz | 11-723 | Pasta, wholewheat, spaghetti, dried, boiled in unsalted water | 134 | 5.2 | 27.5 | 1.1 |
| oats | Haferflocken trocken | 11-788 | Porridge oats, unfortified | 381 | 10.9 | 70.7 | 8.1 |
| potato-raw | Kartoffeln roh, geschält | 13-489 | Potatoes, old, raw, flesh only | 82 | 1.9 | 19.6 | 0.1 |
| potato-boiled | Kartoffeln gekocht, geschält, ohne Salz | 13-490 | Potatoes, old, boiled in unsalted water, flesh only | 74 | 1.8 | 17.5 | 0.1 |
| potato-baked | Kartoffeln gebacken, mit Schale | 13-491 | Potatoes, old, baked, flesh and skin | 97 | 2.5 | 22.6 | 0.2 |
| chicken-raw | Hähnchen, helles Fleisch roh, ohne Haut | 18-290 | Chicken, light meat, raw | 106 | 24.0 | 0.0 | 1.1 |
| chicken-grilled | Hähnchenbrust gegrillt, ohne Haut | 18-323 | Chicken, breast, grilled without skin, meat only | 148 | 32.0 | 0.0 | 2.2 |
| beef-raw | Rind, Rumpsteak roh, mager | 18-043 | Beef, rump steak, raw, lean | 125 | 22.0 | 0.0 | 4.1 |
| beef-grilled | Rind, Rumpsteak gegrillt, mager | 18-474 | Beef, rump steak, grilled, lean only | 177 | 31.0 | 0.0 | 5.9 |
| beef-mince-raw | Rinderhackfleisch roh, extra mager (4,2 % Fett) | 18-508 | Beef, mince, raw, extra lean | 130 | 21.9 | 0.0 | 4.2 |
| beef-mince-cooked | Rinderhackfleisch geschmort, extra mager | 18-507 | Beef, mince, extra lean, stewed | 137 | 24.7 | 0.0 | 4.2 |
| pork-raw | Schweinefilet-Medaillons roh, mager | 18-510 | Pork, fillet medallions, raw, lean | 96 | 22.8 | 0 | 0.5 |
| pork-grilled | Schweinefilet-Medaillons gegrillt, mager | 18-531 | Pork, fillet medallions, grilled lean | 152 | 36.3 | 0 | 0.8 |
| salmon-raw | Lachs roh, Zucht, ohne Haut und Gräten | 16-356 | Salmon, farmed, flesh only, raw | 217 | 20.4 | 0.0 | 15.0 |
| salmon-baked | Lachs gebacken, Zucht, ohne Haut und Gräten | 16-359 | Salmon, farmed, flesh only, baked | 232 | 25.2 | 0.0 | 14.6 |
| cod-raw | Kabeljau roh, ohne Haut und Gräten | 16-372 | Cod, flesh only, raw | 75 | 17.5 | 0.0 | 0.6 |
| cod-steamed | Kabeljau gedämpft, ohne Haut und Gräten | 16-467 | Cod, flesh only, steamed | 98 | 22.8 | 0.0 | 0.8 |
| tuna-brine | Thunfisch aus der Dose, in Salzlake, abgetropft | 16-416 | Tuna, canned in brine, drained | 109 | 24.9 | 0.0 | 1.0 |
| broccoli-raw | Brokkoli roh | 13-502 | Broccoli, green, raw | 34 | 4.3 | 3.2 | 0.6 |
| broccoli-boiled | Brokkoli gekocht, ohne Salz | 13-503 | Broccoli, green, boiled in unsalted water | 28 | 3.3 | 2.8 | 0.5 |
| carrot-raw | Karotten / Möhren roh | 13-496 | Carrots, old, raw | 34 | 0.5 | 7.7 | 0.4 |
| carrot-boiled | Karotten / Möhren gekocht, ohne Salz | 13-497 | Carrots, old, boiled in unsalted water | 29 | 0.5 | 6.0 | 0.5 |
| tomato-raw | Tomaten roh | 13-517 | Tomatoes, standard, raw | 14 | 0.5 | 3.0 | 0.1 |
| cucumber-raw | Gurke roh, mit Schale | 13-523 | Cucumber, raw, flesh and skin | 14 | 1.0 | 1.2 | 0.6 |
| pepper-green | Paprika grün, roh | 13-318 | Peppers, capsicum, green, raw | 15 | 0.8 | 2.6 | 0.3 |
| zucchini-raw | Zucchini roh | 13-627 | Courgette, raw | 16 | 1.3 | 2.3 | 0.2 |
| spinach-raw | Blattspinat roh | 13-572 | Spinach, mature, raw | 25 | 2.8 | 1.6 | 0.8 |
| lettuce-raw | Blattsalat roh | 13-520 | Lettuce, average, raw | 11 | 1.2 | 1.4 | 0.1 |
| onion-raw | Zwiebeln roh | 13-499 | Onions, raw | 35 | 1.0 | 8.0 | 0.1 |
| mushroom-raw | Champignons weiß, roh | 13-505 | Mushrooms, white, raw | 7 | 1.0 | 0.3 | 0.2 |
| cauliflower-boiled | Blumenkohl gekocht, ohne Salz | 13-513 | Cauliflower, boiled in unsalted water | 29 | 1.9 | 3.5 | 0.9 |
| peas-boiled | Erbsen tiefgekühlt, gekocht, ohne Salz | 13-536 | Peas, frozen, boiled in unsalted water | 70 | 5.5 | 11.2 | 0.7 |
| apple | Apfel roh, mit Schale, ohne Kerngehäuse | 14-319 | Apples, eating, raw, flesh and skin | 51 | 0.6 | 11.6 | 0.5 |
| banana | Banane roh, ohne Schale | 14-318 | Bananas, flesh only | 81 | 1.2 | 20.3 | 0.1 |
| orange | Orange roh, nur Fruchtfleisch | 14-327 | Oranges, flesh only | 36 | 0.8 | 8.2 | 0.2 |
| pear | Birne roh, mit Schale, ohne Kerngehäuse | 14-321 | Pears, raw, flesh and skin | 43 | 0.3 | 10.9 | 0.1 |
| strawberry | Erdbeeren roh | 14-324 | Strawberries, raw | 30 | 0.6 | 6.1 | 0.5 |
| grapes | Weintrauben, essbarer Anteil | 14-350 | Grapes, average | 65 | 0.7 | 16.1 | 0.2 |
| avocado | Avocado Hass, nur Fruchtfleisch | 14-386 | Avocado, Hass, flesh only | 171 | 1.8 | 1.7999999999999998 | 17.4 |
| lentils-dry | Linsen rot, trocken, geschält | 13-657 | Lentils, red, split, dried, raw | 311 | 25.6 | 51.2 | 1.8 |
| lentils-cooked | Linsen rot, gekocht, ohne Salz | 13-658 | Lentils, red, split, dried, boiled in unsalted water | 102 | 8.1 | 16.9 | 0.7 |
| chickpeas-cooked | Kichererbsen gekocht, ohne Salz | 13-662 | Beans, chick peas, Kabuli, whole, dried, boiled in unsalted water | 129 | 8.4 | 18.3 | 3 |
| kidneybeans-canned | Kidneybohnen aus der Dose, erhitzt, abgetropft | 13-660 | Beans, red kidney, canned in water, re-heated, drained | 100 | 8.6 | 15.1 | 1 |
| quark | Magerquark natur | 12-174 | Cheese, Quark | 74 | 14.6 | 4.0 | Tr |
| yogurt | Joghurt natur, 1 % Fett | 12-379 | Yogurt, low fat, plain | 57 | 4.8 | 7.8 | 1.0 |
| cottage-cheese | Hüttenkäse natur, 1,5 % Fett | 12-550 | Cheese, cottage, plain, reduced fat | 68 | 10.6 | 3.3 | 1.5 |
| milk-whole | Vollmilch pasteurisiert, 3,6 % Fett | 12-596 | Milk, whole, pasteurised, average | 63 | 3.4 | 4.6 | 3.6 |
| milk-semi | Milch pasteurisiert, 1,7 % Fett | 12-313 | Milk, semi-skimmed, pasteurised, average | 46 | 3.5 | 4.7 | 1.7 |
| bread-wholemeal | Weizenvollkornbrot, britischer Durchschnitt | 11-981 | Bread, wholemeal, average | 217 | 9.4 | 42.0 | 2.5 |
| bread-white | Weißbrot, britischer Durchschnitt | 11-1145 | Bread, white, average | 236 | 8.7 | 48.7 | 2.1 |
| almonds | Mandeln, ganze Kerne | 14-896 | Almonds, whole kernels | 554 | 21.2 | 5.3 | 49.9 |
| walnuts | Walnusskerne | 14-879 | Walnuts, kernel only | 688 | 14.7 | 3.3 | 68.5 |
| olive-oil | Olivenöl | 17-038 | Oil, olive | 899 | Tr | 0.0 | 99.9 |
| rapeseed-oil | Rapsöl | 17-041 | Oil, rapeseed | 899 | Tr | 0.0 | 99.9 |
| butter | Butter ungesalzen | 17-661 | Butter, unsalted | 744 | 0.6 | 0.6 | 82.2 |

## Lidl-Produkte

10 konkrete Barcode-Datensätze von Open Food Facts, abgerufen am 23.10.2026. Nur vollständige Kalorien-, Protein-, Kohlenhydrat- und Fettwerte sowie Länderkennzeichnung Deutschland übernommen. Standardportion jeweils 100 g, auch bei Milch (keine ml-Umrechnung). Die Bezeichnung wird deutsch und mit Marke dargestellt; keine Schätzung von Markendurchschnittswerten. Rezepturen und Barcode-Versionen können abweichen: Packung prüfen. Keine Aussage zur aktuellen Filialverfügbarkeit.

Quelle: Open Food Facts contributors, [Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/1-0/), [Nutzungsbedingungen](https://world.openfoodfacts.org/terms-of-use), [API](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/). Der Produktteil dieses Katalogs wird mit Quellenangabe als OFF-Datenbankauszug unter ODbL bereitgestellt.

- [Lidl · Milbona High Protein Pudding Vanille](https://world.openfoodfacts.org/product/4056489216155) · Barcode 4056489216155
- [Lidl · Milbona High Protein Pudding Schokolade](https://world.openfoodfacts.org/product/4056489216162) · Barcode 4056489216162
- [Lidl · Milbona körniger Frischkäse](https://world.openfoodfacts.org/product/20917975) · Barcode 20917975
- [Lidl · Milbona Skyr natur](https://world.openfoodfacts.org/product/4056489035381) · Barcode 4056489035381
- [Lidl · Milbona Bio frische Milch 1,5 % Fett](https://world.openfoodfacts.org/product/4056489013068) · Barcode 4056489013068
- [Lidl · Milbona H-Milch 1,5 % Fett](https://world.openfoodfacts.org/product/20757595) · Barcode 20757595
- [Lidl · Milbona Speisequark 40 % Fett i.Tr.](https://world.openfoodfacts.org/product/01772829) · Barcode 01772829
- [Lidl · Crownfield Haferflocken zart](https://world.openfoodfacts.org/product/40897677) · Barcode 40897677
- [Lidl · Freshona Bio Kichererbsen (Dose)](https://world.openfoodfacts.org/product/4056489844747) · Barcode 4056489844747
- [Lidl · Freshona Bio rote Kidneybohnen (Dose)](https://world.openfoodfacts.org/product/4056489467595) · Barcode 4056489467595


## BLS-Standardbrötchen für lokale Ausfallsuche

Zwei Standard-Datensätze aus dem deutschen Bundeslebensmittelschlüssel (BLS), je 100 g essbarer Anteil:
- [Weizenbrötchen B511000](https://blsdb.de/food?foodId=38113): 280 kcal, 10,09 g Protein, 53,97 g Kohlenhydrate, 1,81 g Fett. Das UI zeigt als **Beispielportion** 55 g = 154 kcal, 5,55 g Protein, 29,68 g Kohlenhydrate, 1,00 g Fett.
- [Weizenvollkornbrötchen B411000](https://blsdb.blprod.se.ble.de/): 288 kcal, 10,50 g Protein, 49,00 g Kohlenhydrate, 3,26 g Fett. Beispielportion 55 g = 158,4 kcal, 5,78 g Protein, 26,95 g Kohlenhydrate, 1,79 g Fett.

55 g ist eine frei gewählte Portionsgröße, nicht die garantierte Gewichtseinheit eines Bäckereiartikels. Markenwerte können abweichen; wenn möglich, Produktetikett prüfen. Diese beiden generischen Lebensmittel sind keine Barcode-Produkte.
