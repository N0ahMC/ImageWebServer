const express = require("express");
const helmet = require("helmet");
require("dotenv").config();
const app = express();
const fs = require("fs");
const fileUpload = require("express-fileupload");
const path = require("path");

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
let Rpath = "";
let Rtype = "";
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
        if (process.env.ADVANCED_LOGGING) {
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
      Rpath = req.path.slice(1);
      Rtype = i;
    }
  });
  const fullPath = Rpath + Rtype;
  if (fs.existsSync(`images/${fullPath}`)) {
    res.render("image", {
      path: Rpath,
      type: Rtype,
    });
    if (process.env.ADVANCED_LOGGING && fullPath) {
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
    `ImageWebServer running on ${process.env.DOMAIN}, using port ${process.env.PORT}!`
  );
});
