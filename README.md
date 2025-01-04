# FACEIT StreamElements API (WIP)
API for [StreamElements](https://streamelements.com) that displays player stats from [FACEIT](https://faceit.com) on your stream chat.

## ✨ Commands:

- [x] !elo - Current FACEIT level, ELO, ELO gain/loss and amount of matches won/lost
- [ ] !avg - Average statistics from last 20 matches (Kills, K/D, K/R, etc.)
- [ ] !last - Stats from last match (Score, kills, deaths, K/D, K/R, etc.)
- [ ] !live - Current match stats (Score, map, average team ELO)

---

## 🔧 Configuration:

### !elo:

- Type this command in your stream chat:

```
!cmd add elo @${sender}, ${pathescape ${1} | Your FACEIT name}: $(customapi. 'fcb.mxgic1337.xyz/stats/${pathescape ${1} | Your FACEIT name}')
```

This will allow your viewers to check your level, ELO, ELO gain/loss and amount of matches won/lost.

This project is not affiliated with **FACEIT** and/or **StreamElements**.