const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Not found: ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  let status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message;

  if (err.type === "entity.too.large") {
    status = 413;
    message = "File is too large (maximum 2 MB)";
  } else if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  } else if (err.code === 11000) {
    status = 400;
    const field = Object.keys(err.keyValue || {})[0] || "value";
    message = `${field} already exists`;
  } else if (err.name === "CastError") {
    status = 400;
    message = "Invalid id or value";
  }

  // Production mein andar ki tafseel (server ke apne bug) bahar nahi bhejte
  if (status >= 500 && process.env.NODE_ENV === "production") message = "Something went wrong on the server";
  if (status >= 500) console.error(err);

  res.status(status).json({ message });
};

module.exports = { notFound, errorHandler };
