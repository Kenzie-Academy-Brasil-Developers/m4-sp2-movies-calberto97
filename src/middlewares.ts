import { Request, Response, NextFunction } from "express";
import { QueryConfig, QueryResult } from "pg";
import { client } from "./database";
import { iMovieResult } from "./interfaces";

export const searchForMovie = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<Response | void> => {
  const id = +request.params.id;

  const queryString: string = `
    SELECT * FROM movies WHERE id = $1  
    `;

  const queryConfig: QueryConfig = {
    text: queryString,
    values: [id],
  };

  const queryResult: QueryResult<iMovieResult> = await client.query(
    queryConfig
  );

  if (!queryResult.rowCount) {
    return response.status(404).json({
      message: `Movie with ID ${id} not found.`,
    });
  }

  return next();
};

export const checkForDuplicateName = async (
  request: Request,
  response: Response,
  next: NextFunction
): Promise<Response | void> => {
  const { name } = request.body;
  const queryString: string = `
    SELECT * FROM movies WHERE name = $1
    `;

  const queryConfig: QueryConfig = {
    text: queryString,
    values: [name],
  };

  const queryResult: QueryResult<iMovieResult> = await client.query(
    queryConfig
  );
  
  const nameExists = queryResult.rows[0];

  if (nameExists) {
    return response
      .status(409)
      .json({ message: `Movie with name ${name} already exists.` });
  }

  return next();
};
