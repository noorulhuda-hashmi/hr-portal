const express = require("express");

// File upload: poori body bytes ki shakal mein (Buffer), 2 MB tak
module.exports = express.raw({ type: () => true, limit: "2mb" });
