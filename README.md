# FACEIT StreamElements API
API do [StreamElements](https://streamelements.com), które wyświetla statystyki gracza z [FACEIT](https://faceit.com).

## Konfiguracja
### Konfiguracja komendy !elo
- Na swoim czacie wpisz komendę:
```
!cmd add elo @${sender}, Statystyki gracza ${pathescape ${1} | <Twój nick z FACEIT>}: $(customapi. 'fc.mxgic1337.xyz/stats/${pathescape ${1} | <Twój nick z FACEIT>}')
```
To pozwoli twoim widzom sprawdzić statystyki graczy poprzez użycie komendy **!elo**.

### Konfiguracja komendy !avg
- Na swoim czacie wpisz komendę:
```
!cmd add avg @${sender}, Średnie statystyki gracza ${pathescape ${1} | <Twój nick z FACEIT>}: $(customapi. 'fc.mxgic1337.xyz/avg/${pathescape ${1} | <Twój nick z FACEIT>}')
```
To pozwoli twoim widzom sprawdzić średnie statystyki graczy (avg. K/D, kille itp.) poprzez użycie komendy **!avg**.

### Konfiguracja komendy !last
- Na swoim czacie wpisz komendę:
```
!cmd add last @${sender}, Ostatni mecz ${pathescape ${1} | <Twój nick z FACEIT>}: $(customapi. 'fc.mxgic1337.xyz/last/${pathescape ${1} | <Twój nick z FACEIT>}')
```
To pozwoli twoim widzom sprawdzić statystyki z ostatniej gry danego gracza (avg. K/D, kille itp.) poprzez użycie komendy **!last**.

## Linki
- [Dokumentacja](https://docs.mxgic1337.xyz/faceit-stats-api/#/)

Projekt nie jest powiązany z **FACEIT** lub/i **StreamElements**.
