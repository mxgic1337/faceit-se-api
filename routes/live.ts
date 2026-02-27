import express from 'express';

export const liveRoute = express.Router();

liveRoute.get('/:playerName', (_, res) => {
  res.send("Funkcja została wycofana ze względu na ostatnie zmiany na FACEIT.")
});
