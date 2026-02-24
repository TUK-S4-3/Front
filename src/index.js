// // const express = require('express')  // -> CommonJS
// import express from 'express'          // -> ES Module

// const app = express()
// const port = 3000

// app.get('/', (req, res) => {
//   res.send('hi ~')
// })

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`)
// })

import express from "express";
const app = express();
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, msg: "backend connected" });
});

app.listen(3000, () => console.log("API on 3000"));
