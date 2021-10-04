console.clear();
const express = require("express");
const helmet = require("helmet");
require("dotenv").config();
const app = express();
const fs = require("fs");
const fileUpload = require("express-fileupload");
const path = require("path");

if (!process.env.PORT && !fs.existsSync("./.env"))
  return console.error(
    "\x1b[31m",
    "[ERROR]",
    "\x1b[0m",
    "The .env file could not be found.\nPlease check README.md for more information"
  );

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.set("view engine", "ejs");

app.use("/assets", express.static("assets"));
app.use("/image", express.static("images"));
app.use(fileUpload());
const types = ["", ".png", ".jpg", ".jpeg"];
let Fpath = "";
let Ftype = "";
let Fsize = "";
let Fdate = "";
app.post("/upload", (req, res) => {
  try {
    if (req.headers.key !== process.env.KEY) {
      return res.status(403).send({ status: 403, message: "Invalid token" });
    } else {
      if (!req.files) {
        res.status(404).send({
          status: 404,
          message: "No file uploaded",
        });
      } else {
        let avatar = req.files.sharex;
        let safeSuffix = path
          .normalize(avatar.name)
          .replace(/^(\.\.(\/|\\|$))+/, "");
        let safeJoin = path.join("./images/", safeSuffix);
        avatar.mv(safeJoin);
        res.send({
          status: 200,
          message: "File just got uploaded!",
          url: safeSuffix,
        });
        if (process.env.ADVANCED_LOGGING == "true") {
          console.log(`File ${safeSuffix} uploaded!`);
        }
      }
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json(e);
  }
});
app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.send("User-agent: *\nAllow: /$\nDisallow: /");
});
app.get("/:image", (req, res) => {
  types.forEach((i) => {
    if (fs.existsSync(`images/${req.path.slice(1)}${i}`)) {
      const size = fs.statSync(`images/${req.path.slice(1)}${i}`).size / 1000;
      Fpath = req.path.slice(1);
      Ftype = i;
      Fsize =
        size > 1000
          ? `${Math.round((size * 100) / 1000) / 100} MB`
          : `${Math.round(size * 100) / 100} KB`;
          Fdate = fs
        .statSync(`images/${req.path.slice(1)}${i}`)
        .mtime.toLocaleDateString("en-US");
    }
  });
  const fullPath = Fpath + Ftype;
  if (fullPath != "" && fs.existsSync(`images/${fullPath}`)) {
    res.render("image", {
      path: Fpath,
      type: Ftype,
      fullPath: fullPath,
      size: Fsize,
      date: Fdate,
    });
    if (process.env.ADVANCED_LOGGING == "true" && fullPath) {
      console.log(`File ${fullPath} viewed!`);
    }
  } else {
    res.render("404", {
      path: req.path.slice(1),
    });
  }
});
app.get("/", (req, res) => {
  res.render("index", {
    path: req.path.slice(1),
  });
});

app.listen(process.env.PORT, () => {
  console.log(
    "\x1b[32m",
    "[READY]",
    "\x1b[0m",
    `ImageWebServer running on ${process.env.DOMAIN}, using port ${process.env.PORT}!`
  );
});
