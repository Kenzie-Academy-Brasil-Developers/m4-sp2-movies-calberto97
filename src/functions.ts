import { Request, Response } from "express";
import { QueryConfig, QueryResult } from "pg";
import format from "pg-format";
import { client } from "./database";
import {
  iMovieRequest,
  iMovieResult,
  tRequiredKeys,
  tUpdateKeys,
} from "./interfaces";

const validateMovieData = (payload: any): iMovieRequest => {
  let payloadKeys = Object.keys(payload);
  const requiredKeys: tRequiredKeys[] = ["name", "duration", "price"];

  const check = requiredKeys.every((key) => {
    return payloadKeys.includes(key);
  });

  if (!check) {
    throw new Error(
      `Required keys are "${requiredKeys}". You sent "${payloadKeys}"`
    );
  }

  if (payloadKeys.includes("description")) {
    payloadKeys = payloadKeys.filter((key) => key !== "description");
  }

  const checkExtra = payloadKeys.every((key) => {
    return requiredKeys.includes(key as any);
  });

  if (!checkExtra) {
    const extraKey = payloadKeys.filter(
      (key) => !requiredKeys.includes(key as any)
    );
    throw new Error(
      `Your request has an unsolicited key "${extraKey}". We only accept "${requiredKeys},description".`
    );
  }

  if (typeof payload.name !== "string") {
    throw new Error('Type of "name" must be string');
  }

  if (
    payload.description &&
    typeof payload.description !== "string"
  ) {
    throw new Error('Type of "description" must be string');
  }

  if (typeof payload.duration !== "number") {
    throw new Error('Type of "duration" must be number');
  }

  if (typeof payload.price !== "number") {
    throw new Error('Type of "price" must be number');
  }

  return payload;
};

const validateMovieUpdate = (payload: any): iMovieRequest => {
  const { name, description, duration, price } = payload;

  const payloadKeys = Object.keys(payload);
  const possibleKeys: tUpdateKeys[] = [
    "name",
    "description",
    "duration",
    "price",
  ];

  const checkExtra = payloadKeys.every((key) => {
    return possibleKeys.includes(key as any);
  });

  if (!checkExtra) {
    const extraKey = payloadKeys.filter(
      (key) => !possibleKeys.includes(key as any)
    );
    throw new Error(
      `Your request has an unsolicited key "${extraKey}". We only accept "${possibleKeys}".`
    );
  }

  if (name && typeof name !== "string") {
    throw new Error('Type of "name" must be string');
  }

  if (description && typeof description !== "string") {
    throw new Error('Type of "description" must be string');
  }

  if (duration && typeof duration !== "number") {
    throw new Error('Type of "duration" must be number');
  }

  if (price && typeof price !== "number") {
    throw new Error('Type of "price" must be number');
  }

  return payload;
};

export const createMovie = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const requestMovieData: iMovieRequest = validateMovieData(
      request.body
    );

    if (request.body.id) {
      return response
        .status(400)
        .json({ message: "You can't choose an ID." });
    }

    const query: string = format(
      `
          INSERT INTO
              movies(%I)
          VALUES
              (%L)
          RETURNING *;
          `,
      Object.keys(requestMovieData),
      Object.values(requestMovieData)
    );

    const queryResult: QueryResult<iMovieResult> = await client.query(
      query
    );
    const insertedMovie = queryResult.rows[0];

    return response.status(201).json(insertedMovie);
  } catch (error) {
    if (error instanceof Error) {
      return response.status(400).json({ message: error.message });
    }
    return response.status(500).json({ message: error });
  }
};

export const showAllMovies = async (
  request: Request,
  response: Response
): Promise<Response> => {
  let page: number = +request.query.page! || 1;
  let perPage: number = +request.query.perPage! || 5;

  if (page <= 0) {
    page = 1;
  }

  if (perPage < 0 || perPage > 5) {
    perPage = 5;
  }

  let query: string = `
    SELECT 
      *
    FROM
      movies
    LIMIT $1 OFFSET $2;
    `;

  let queryConfig: QueryConfig = {
    text: query,
    values: [perPage, (page - 1) * perPage],
  };

  const sort: any = request.query.sort;
  const order: any = request.query.order === "DESC" ? "DESC" : "ASC";

  let queries: any = queryConfig;

  if (sort === "price" || sort === "duration") {
    query = format(
      `
    SELECT * FROM movies ORDER BY %s ${order} LIMIT %L OFFSET %L
    `,
      `${sort}`,
      `${perPage}`,
      `${(page - 1) * perPage}`
    );

    queries = query;
  }

  const queryResult: QueryResult<iMovieResult> = await client.query(
    queries
  );

  let queryPagination: string = `
    SELECT 
      *
    FROM
      movies;
      `;

  let queryConfigPagination: QueryConfig = {
    text: queryPagination,
  };

  const queryResultPagination: QueryResult<iMovieResult> =
    await client.query(queryConfigPagination);

  const numberOfPages = Math.ceil(
    queryResultPagination.rowCount / perPage
  );
  const baseUrl = `http://localhost:3000/movies`;

  const prevPage =
    page <= 1
      ? null
      : numberOfPages >= page - 1
      ? `${baseUrl}?page=${page - 1}&perPage=${perPage}`
      : null;

  const nextPage =
    numberOfPages <= page
      ? null
      : `${baseUrl}?page=${page + 1}&perPage=${perPage}`;

  const pagination = {
    prevPage,
    nextPage,
    count: queryResult.rowCount,
    data: queryResult.rows,
  };

  return response.status(200).json(pagination);
};

export const updateMovie = async (
  request: Request,
  response: Response
): Promise<Response> => {
  try {
    const requestMovieData = validateMovieUpdate(request.body);
    if (request.body.id) {
      return response
        .status(400)
        .json({ message: "ID can't be changed" });
    }

    const queryString: string = `
    UPDATE movies
    SET (%I) = ROW (%L)
    WHERE id = $1
    RETURNING *;
    `;

    const queryFormat: string = format(
      queryString,
      Object.keys(requestMovieData),
      Object.values(requestMovieData)
    );

    const queryConfig: QueryConfig = {
      text: queryFormat,
      values: [+request.params.id],
    };

    const queryResult: QueryResult<iMovieResult> = await client.query(
      queryConfig
    );

    return response.status(200).json(queryResult.rows[0]);
  } catch (error) {
    if (error instanceof Error) {
      return response.status(400).json({ message: error.message });
    }
    return response.status(500).json({ message: error });
  }
};

export const deleteMovie = async (
  request: Request,
  response: Response
): Promise<Response> => {
  const query: string = `
  DELETE FROM 
    movies
  WHERE 
    id = $1;
  `;

  const queryConfig: QueryConfig = {
    text: query,
    values: [+request.params.id],
  };

  await client.query(queryConfig);

  return response.status(204).send();
};
