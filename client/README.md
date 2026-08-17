Hive app - frontend

Chat GIF and sticker search use the Giphy API via the backend (`GET /chat/gifs` and `GET /chat/stickers`). Set `GIPHY_API_KEY` in the server `.env` (see [Giphy developers](https://developers.giphy.com/)). GIF and sticker media URLs are validated on the server.