import express, { Application, json } from "express";
import { startDatabase } from "./database";
import {
  createMovie,
  deleteMovie,
  showAllMovies,
  updateMovie,
} from "./functions";
import { checkForDuplicateName, searchForMovie } from "./middlewares";

const app: Application = express();
app.use(json());

app.post("/movies", checkForDuplicateName, createMovie);
app.get("/movies", showAllMovies);
app.patch("/movies/:id", searchForMovie, checkForDuplicateName, updateMovie);
app.delete("/movies/:id", searchForMovie, deleteMovie);

const PORT: number = 3000;
const runningMsg: string = `Server running on http://localhost:${PORT}`;

app.listen(PORT, async () => {
  await startDatabase();
  console.log(runningMsg);
});
